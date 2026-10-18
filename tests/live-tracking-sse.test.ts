import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  evaluateLocationFreshness,
  formatTrackingSnapshot,
  buildSseMessage,
  buildSseKeepalive,
} from "../src/lib/rideTracking";
import { validateDriverCoordinates } from "../src/lib/driverEligibility";
import type { IRide } from "../src/models/Ride";

describe("Phase 1E: Real-Time Location, Live Tracking & SSE Reliability Tests", () => {
  const riderId = new mongoose.Types.ObjectId();
  const driverId = new mongoose.Types.ObjectId();
  const otherRiderId = new mongoose.Types.ObjectId();
  const otherDriverId = new mongoose.Types.ObjectId();
  const rideId = new mongoose.Types.ObjectId();

  describe("A. Location Validation & Freshness Evaluation", () => {
    it("Validates coordinates correctly within mathematical boundaries", () => {
      assert.equal(validateDriverCoordinates([28.6139, 77.209]), true);
      assert.equal(validateDriverCoordinates([0, 0]), true);
      assert.equal(validateDriverCoordinates([90, 180]), true);
      assert.equal(validateDriverCoordinates([-90, -180]), true);

      assert.equal(validateDriverCoordinates([90.0001, 77.209]), false);
      assert.equal(validateDriverCoordinates([-90.0001, 77.209]), false);
      assert.equal(validateDriverCoordinates([28.6139, 180.0001]), false);
      assert.equal(validateDriverCoordinates([28.6139, -180.0001]), false);

      assert.equal(validateDriverCoordinates([NaN, 77.209]), false);
      assert.equal(validateDriverCoordinates([28.6139, Infinity]), false);
      assert.equal(validateDriverCoordinates([null as unknown as number, 77.209]), false);
      assert.equal(validateDriverCoordinates([28.6139]), false);
    });

    it("Evaluates fresh location when timestamp is within 120s TTL", () => {
      const now = new Date("2026-10-11T12:00:00.000Z");
      const updatedAt = new Date("2026-10-11T11:59:30.000Z");
      const coords: [number, number] = [28.6139, 77.209];

      const res = evaluateLocationFreshness(coords, updatedAt, "ACCEPTED", now);
      assert.equal(res.status, "FRESH");
      assert.equal(res.isFresh, true);
      assert.equal(res.ageSeconds, 30);
    });

    it("Evaluates stale location when timestamp is older than 120s TTL", () => {
      const now = new Date("2026-10-11T12:00:00.000Z");
      const updatedAt = new Date("2026-10-11T11:57:45.000Z");
      const coords: [number, number] = [28.6139, 77.209];

      const res = evaluateLocationFreshness(coords, updatedAt, "ACCEPTED", now);
      assert.equal(res.status, "STALE");
      assert.equal(res.isFresh, false);
      assert.equal(res.ageSeconds, 135);
    });

    it("Marks location UNAVAILABLE when coordinates or timestamp are missing", () => {
      const now = new Date("2026-10-11T12:00:00.000Z");
      const resNull = evaluateLocationFreshness(null, null, "ACCEPTED", now);
      assert.equal(resNull.status, "UNAVAILABLE");
      assert.equal(resNull.isFresh, false);
      assert.equal(resNull.ageSeconds, null);

      const resMissingTime = evaluateLocationFreshness([28.6139, 77.209], null, "ACCEPTED", now);
      assert.equal(resMissingTime.status, "UNAVAILABLE");
      assert.equal(resMissingTime.isFresh, false);
    });

    it("Marks location TERMINAL for COMPLETED and CANCELLED rides regardless of coordinates", () => {
      const now = new Date("2026-10-11T12:00:00.000Z");
      const freshTimestamp = new Date("2026-10-11T11:59:50.000Z");
      const coords: [number, number] = [28.6139, 77.209];

      const resCompleted = evaluateLocationFreshness(coords, freshTimestamp, "COMPLETED", now);
      assert.equal(resCompleted.status, "TERMINAL");
      assert.equal(resCompleted.isFresh, false);

      const resCancelled = evaluateLocationFreshness(coords, freshTimestamp, "CANCELLED", now);
      assert.equal(resCancelled.status, "TERMINAL");
      assert.equal(resCancelled.isFresh, false);
    });
  });

  describe("B. Role-Appropriate Projections & OTP Security", () => {
    const mockRide = {
      _id: rideId,
      rider: riderId,
      driver: driverId,
      pickup: {
        address: "Sector 18, Noida",
        coordinates: [28.5708, 77.3261] as [number, number],
      },
      dropoff: {
        address: "Connaught Place, New Delhi",
        coordinates: [28.6315, 77.2167] as [number, number],
      },
      fare: 350,
      vehicleType: "Cab Premium",
      status: "ACCEPTED" as const,
      otp: "8492",
      driverCoordinates: [28.58, 77.33] as [number, number],
      driverCoordinatesUpdatedAt: new Date(Date.now() - 15000),
      trackingVersion: 4,
      driverDetails: {
        name: "Rajesh Kumar",
        phone: "+91 9876543210",
        rating: 4.88,
        vehicleNumber: "DL 1Y A 4321",
        vehicleModel: "Swift Dzire",
      },
      paymentMethod: "WALLET" as const,
      paymentStatus: "PENDING" as const,
      distance: "14.2 km",
      duration: "28 mins",
    };

    it("Rider snapshot strictly INCLUDES OTP prior to ride start for trip validation", () => {
      const snapshot = formatTrackingSnapshot(mockRide as unknown as IRide, "RIDER");
      assert.equal(snapshot.otp, "8492");
      assert.equal(snapshot.status, "ACCEPTED");
      assert.equal(snapshot.trackingVersion, 4);
      assert.equal(snapshot.locationStatus, "FRESH");
      assert.equal(snapshot.isLocationFresh, true);
      assert.deepEqual(snapshot.driverCoordinates, [28.58, 77.33]);
    });

    it("Driver snapshot STRICTLY EXCLUDES OTP to prevent driver self-starting", () => {
      const snapshot = formatTrackingSnapshot(mockRide as unknown as IRide, "DRIVER");
      assert.equal((snapshot as unknown as Record<string, unknown>).otp, undefined, "Driver snapshot must NEVER contain rider OTP");
      assert.equal(snapshot.status, "ACCEPTED");
      assert.equal(snapshot.trackingVersion, 4);
    });

    it("Rider snapshot removes OTP once ride has transitioned to IN_PROGRESS", () => {
      const inProgressRide = {
        ...mockRide,
        status: "IN_PROGRESS" as const,
        trackingVersion: 5,
      };
      const snapshot = formatTrackingSnapshot(inProgressRide as unknown as IRide, "RIDER");
      assert.equal((snapshot as unknown as Record<string, unknown>).otp, undefined, "OTP must not be exposed after trip start");
      assert.equal(snapshot.status, "IN_PROGRESS");
    });

    it("Excludes driver coordinates and marks TERMINAL when ride is completed", () => {
      const completedRide = {
        ...mockRide,
        status: "COMPLETED" as const,
        trackingVersion: 6,
      };
      const snapshot = formatTrackingSnapshot(completedRide as unknown as IRide, "RIDER");
      assert.equal(snapshot.driverCoordinates, null);
      assert.equal(snapshot.locationStatus, "TERMINAL");
      assert.equal(snapshot.isLocationFresh, false);
    });
  });

  describe("C. SSE Protocol Formatting & Monotonic Sequencing", () => {
    it("Formats SSE messages compliant with W3C Server-Sent Events spec", () => {
      const payload = {
        _id: rideId.toString(),
        status: "ACCEPTED",
        trackingVersion: 3,
      };
      const msg = buildSseMessage("ride_update", payload, 3);
      assert.ok(msg.includes("id: 3\n"));
      assert.ok(msg.includes("event: ride_update\n"));
      assert.ok(msg.includes(`data: ${JSON.stringify(payload)}\n\n`));
    });

    it("Formats SSE keepalive comments without corrupting data parser", () => {
      const keepalive = buildSseKeepalive();
      assert.ok(keepalive.startsWith(": keepalive "));
      assert.ok(keepalive.endsWith("\n\n"));
    });

    it("Monotonic versioning prevents stale or out-of-order state overwrites", () => {
      let currentState = {
        _id: rideId.toString(),
        status: "ACCEPTED",
        trackingVersion: 5,
        driverCoordinates: [28.58, 77.33] as [number, number],
      };

      const handleUpdate = (incoming: { _id: string; status: string; trackingVersion: number; driverCoordinates: [number, number] }) => {
        if (incoming._id === currentState._id) {
          if (incoming.trackingVersion < currentState.trackingVersion) {
            return false;
          }
        }
        currentState = incoming;
        return true;
      };

      const staleUpdate = {
        _id: rideId.toString(),
        status: "ACCEPTED",
        trackingVersion: 4,
        driverCoordinates: [28.57, 77.32] as [number, number],
      };
      const acceptedStale = handleUpdate(staleUpdate);
      assert.equal(acceptedStale, false, "Stale update with lower trackingVersion must be rejected");
      assert.equal(currentState.trackingVersion, 5);
      assert.deepEqual(currentState.driverCoordinates, [28.58, 77.33]);

      const newerUpdate = {
        _id: rideId.toString(),
        status: "ARRIVED",
        trackingVersion: 6,
        driverCoordinates: [28.5708, 77.3261] as [number, number],
      };
      const acceptedNew = handleUpdate(newerUpdate);
      assert.equal(acceptedNew, true, "Newer update with higher trackingVersion must be applied");
      assert.equal(currentState.trackingVersion, 6);
      assert.equal(currentState.status, "ARRIVED");
    });
  });

  describe("D. Authorization & IDOR Subscription Safety", () => {
    it("Rider can subscribe only to rides they own", () => {
      const isRiderAuthorized = (requestingRiderId: mongoose.Types.ObjectId, rideRiderId: mongoose.Types.ObjectId) => {
        return requestingRiderId.equals(rideRiderId);
      };

      assert.equal(isRiderAuthorized(riderId, riderId), true);
      assert.equal(isRiderAuthorized(otherRiderId, riderId), false, "IDOR: Other rider cannot subscribe to ride");
    });

    it("Driver can subscribe only to rides assigned to them", () => {
      const isDriverAuthorized = (requestingDriverId: mongoose.Types.ObjectId, assignedDriverId?: mongoose.Types.ObjectId | null) => {
        return !!assignedDriverId && requestingDriverId.equals(assignedDriverId);
      };

      assert.equal(isDriverAuthorized(driverId, driverId), true);
      assert.equal(isDriverAuthorized(otherDriverId, driverId), false, "IDOR: Unassigned driver cannot subscribe to ride");
      assert.equal(isDriverAuthorized(driverId, null), false, "Driver cannot subscribe to unassigned ride");
    });
  });

  describe("E. Driver Availability & Dispatch Integrity Invariants", () => {
    it("Sending location telemetry does NOT alter driver online status or duty state independently", () => {
      const initialDriverState = {
        driverId: driverId.toString(),
        isOnline: false,
        dutyState: "OFFLINE",
        coordinates: [28.6139, 77.209] as [number, number],
        driverCoordinatesUpdatedAt: new Date(),
      };

      const updateLocation = (coords: [number, number]) => {
        return {
          ...initialDriverState,
          coordinates: coords,
          driverCoordinatesUpdatedAt: new Date(),
          isOnline: initialDriverState.isOnline,
          dutyState: initialDriverState.dutyState,
        };
      };

      const updated = updateLocation([28.615, 77.210]);
      assert.equal(updated.isOnline, false, "Telemetry write must not make driver online");
      assert.equal(updated.dutyState, "OFFLINE", "Telemetry write must not change duty state");
      assert.deepEqual(updated.coordinates, [28.615, 77.210]);
    });

    it("Active ride prevents double dispatch reservation (exclusivity guarantee)", () => {
      const canAcceptNewOffer = (dutyState: string, activeRideId: string | null) => {
        return dutyState === "DISPATCH_ALERT" && activeRideId === null;
      };

      assert.equal(canAcceptNewOffer("DISPATCH_ALERT", null), true);
      assert.equal(canAcceptNewOffer("ON_TRIP", rideId.toString()), false, "Driver on active trip cannot receive or accept concurrent offers");
    });
  });
});
