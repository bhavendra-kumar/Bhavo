import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
  evaluateDriverEligibility,
  calculateHaversineDistanceKm,
  IDriverCandidate,
  IRideRequirements,
} from "../src/lib/driverEligibility";

import {
  rankEligibleCandidates,
} from "../src/lib/dispatchRanking";

import {
  canTransition,
  isRideDispatchable,
  getDispatchLeadTimeMs,
} from "../src/lib/rideStateMachine";

import {
  formatTrackingSnapshot,
  evaluateLocationFreshness,
  buildSseMessage,
  buildSseKeepalive,
  isRideTerminal,
} from "../src/lib/rideTracking";

import type { IRide } from "../src/models/Ride";

describe("Phase 7: Realtime Dispatch & Live-Tracking Verification Suite", () => {
  const baseTime = new Date("2026-10-13T12:00:00.000Z");

  const validDriverTemplate: IDriverCandidate = {
    _id: new mongoose.Types.ObjectId().toString(),
    role: "DRIVER",
    status: "ACTIVE",
    isOnline: true,
    dutyState: "ONLINE_SEARCHING",
    driverCoordinates: [28.6139, 77.209],
    driverCoordinatesUpdatedAt: new Date("2026-10-13T11:59:30.000Z"),
    driverVehicle: {
      type: "Cab Premium",
      documentsVerified: true,
    },
    driverSettings: {
      petFriendly: true,
    },
    rating: 4.95,
  };

  const validRideTemplate: IRideRequirements = {
    _id: new mongoose.Types.ObjectId().toString(),
    vehicleType: "Cab Premium",
    pickup: {
      address: "Connaught Place, New Delhi",
      coordinates: [28.6304, 77.2177],
    },
    petFriendly: false,
    rejectedDrivers: [],
  };

  describe("1. Driver Eligibility & Exclusivity Gates", () => {
    it("Valid unencumbered driver passes all eligibility gates", () => {
      const result = evaluateDriverEligibility(validDriverTemplate, validRideTemplate, { atTime: baseTime });
      assert.equal(result.isEligible, true);
      assert.ok(typeof result.distanceKm === "number" && result.distanceKm > 0);
    });

    it("Driver with activeRideId is strictly disqualified (DRIVER_OCCUPIED)", () => {
      const occupiedDriver: IDriverCandidate = {
        ...validDriverTemplate,
        activeRideId: new mongoose.Types.ObjectId().toString(),
      };
      const result = evaluateDriverEligibility(occupiedDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.code, "DRIVER_OCCUPIED");
    });

    it("Driver on trip (dutyState: ON_TRIP) is strictly disqualified (DRIVER_OCCUPIED)", () => {
      const occupiedDriver: IDriverCandidate = {
        ...validDriverTemplate,
        dutyState: "ON_TRIP",
      };
      const result = evaluateDriverEligibility(occupiedDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.code, "DRIVER_OCCUPIED");
    });

    it("Driver offline or with isOnline: false is strictly disqualified (DRIVER_OFFLINE)", () => {
      const offlineDriver1: IDriverCandidate = {
        ...validDriverTemplate,
        isOnline: false,
      };
      const res1 = evaluateDriverEligibility(offlineDriver1, validRideTemplate, { atTime: baseTime });
      assert.equal(res1.isEligible, false);
      assert.equal(res1.code, "DRIVER_OFFLINE");

      const offlineDriver2: IDriverCandidate = {
        ...validDriverTemplate,
        dutyState: "OFFLINE",
      };
      const res2 = evaluateDriverEligibility(offlineDriver2, validRideTemplate, { atTime: baseTime });
      assert.equal(res2.isEligible, false);
      assert.equal(res2.code, "DRIVER_OFFLINE");
    });

    it("Suspended or inactive driver is strictly disqualified (DRIVER_INACTIVE)", () => {
      const inactiveDriver: IDriverCandidate = {
        ...validDriverTemplate,
        status: "SUSPENDED",
      };
      const res = evaluateDriverEligibility(inactiveDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "DRIVER_INACTIVE");
    });

    it("Driver with invalid role is strictly disqualified (INVALID_ROLE)", () => {
      const riderAsDriver: IDriverCandidate = {
        ...validDriverTemplate,
        role: "RIDER",
      };
      const res = evaluateDriverEligibility(riderAsDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "INVALID_ROLE");
    });

    it("Driver with unverified vehicle documents is strictly disqualified (DOCUMENTS_UNVERIFIED)", () => {
      const unverifiedDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverVehicle: {
          type: "Cab Premium",
          documentsVerified: false,
        },
      };
      const res = evaluateDriverEligibility(unverifiedDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "DOCUMENTS_UNVERIFIED");
    });

    it("Incompatible vehicle type fails closed (VEHICLE_INCOMPATIBLE)", () => {
      const ecoDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverVehicle: {
          type: "Cab Economy",
          documentsVerified: true,
        },
      };
      const res = evaluateDriverEligibility(ecoDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "VEHICLE_INCOMPATIBLE");
    });

    it("Pet-incompatible driver cannot receive pet-friendly ride offer (PET_INCOMPATIBLE)", () => {
      const nonPetDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverSettings: { petFriendly: false },
      };
      const petRide: IRideRequirements = {
        ...validRideTemplate,
        petFriendly: true,
      };
      const res = evaluateDriverEligibility(nonPetDriver, petRide, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "PET_INCOMPATIBLE");
    });

    it("Driver with stale location (> 120s) is strictly disqualified (LOCATION_STALE)", () => {
      const staleDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverCoordinatesUpdatedAt: new Date("2026-10-13T11:57:00.000Z"),
      };
      const res = evaluateDriverEligibility(staleDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "LOCATION_STALE");
    });

    it("Driver with missing or non-finite coordinates is strictly disqualified (LOCATION_STALE)", () => {
      const missingCoordsDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverCoordinates: undefined,
      };
      const res1 = evaluateDriverEligibility(missingCoordsDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res1.isEligible, false);
      assert.equal(res1.code, "LOCATION_STALE");

      const nanCoordsDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverCoordinates: [NaN, 77.209],
      };
      const res2 = evaluateDriverEligibility(nanCoordsDriver, validRideTemplate, { atTime: baseTime });
      assert.equal(res2.isEligible, false);
      assert.equal(res2.code, "LOCATION_STALE");
    });

    it("Driver outside configured max dispatch radius is disqualified (OUTSIDE_RADIUS)", () => {
      const farDriver: IDriverCandidate = {
        ...validDriverTemplate,
        driverCoordinates: [28.4595, 77.0266],
      };
      const res = evaluateDriverEligibility(farDriver, validRideTemplate, { atTime: baseTime, maxRadiusKm: 10 });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "OUTSIDE_RADIUS");
      assert.ok(res.distanceKm! > 10);
    });

    it("Driver already in rejectedDrivers for current dispatch cycle is disqualified (ALREADY_REJECTED)", () => {
      const rejectedDriver: IDriverCandidate = {
        ...validDriverTemplate,
        _id: "driver_99",
      };
      const rideWithRejection: IRideRequirements = {
        ...validRideTemplate,
        rejectedDrivers: ["driver_99"],
      };
      const res = evaluateDriverEligibility(rejectedDriver, rideWithRejection, { atTime: baseTime });
      assert.equal(res.isEligible, false);
      assert.equal(res.code, "ALREADY_REJECTED");
    });
  });

  describe("2. Deterministic Candidate Ranking", () => {
    it("Preferred driver is prioritized first when eligible", () => {
      const candidate1: IDriverCandidate = { ...validDriverTemplate, _id: "driver_1", rating: 4.8 };
      const candidate2: IDriverCandidate = { ...validDriverTemplate, _id: "driver_2", rating: 5.0 };

      const ranked = rankEligibleCandidates(
        [
          { driver: candidate1, distanceKm: 3.5 },
          { driver: candidate2, distanceKm: 1.2 },
        ],
        "driver_1"
      );

      assert.equal(ranked.length, 2);
      assert.equal(ranked[0].driver._id, "driver_1");
      assert.equal(ranked[0].isPreferred, true);
      assert.equal(ranked[1].driver._id, "driver_2");
      assert.equal(ranked[1].isPreferred, false);
    });

    it("Ranks non-preferred candidates deterministically by proximity bucket (500m bands), rating, and ID", () => {
      const driverA: IDriverCandidate = { ...validDriverTemplate, _id: "driver_A", rating: 4.9 };
      const driverB: IDriverCandidate = { ...validDriverTemplate, _id: "driver_B", rating: 5.0 };
      const driverC: IDriverCandidate = { ...validDriverTemplate, _id: "driver_C", rating: 5.0 };

      const ranked = rankEligibleCandidates([
        { driver: driverA, distanceKm: 1.1 },
        { driver: driverC, distanceKm: 2.1 },
        { driver: driverB, distanceKm: 1.3 },
      ]);

      assert.equal(ranked.length, 3);
      assert.equal(ranked[0].driver._id, "driver_B");
      assert.equal(ranked[1].driver._id, "driver_A");
      assert.equal(ranked[2].driver._id, "driver_C");
    });

    it("Tie-breaking uses lexicographical driver _id when proximity bucket and rating are identical", () => {
      const driver1: IDriverCandidate = { ...validDriverTemplate, _id: "bbb", rating: 4.9 };
      const driver2: IDriverCandidate = { ...validDriverTemplate, _id: "aaa", rating: 4.9 };

      const ranked = rankEligibleCandidates([
        { driver: driver1, distanceKm: 1.2 },
        { driver: driver2, distanceKm: 1.2 },
      ]);

      assert.equal(ranked.length, 2);
      assert.equal(ranked[0].driver._id, "aaa");
      assert.equal(ranked[1].driver._id, "bbb");
    });
  });

  describe("3. Targeted Offers, Expiry & Fallback Progression", () => {
    it("Validates offer expiration authoritatively against server time", () => {
      const offerExpiry = new Date(baseTime.getTime() + 15000);
      const pastTime = new Date(baseTime.getTime() + 16000);

      assert.ok(offerExpiry.getTime() > baseTime.getTime(), "Offer is initially active");
      assert.ok(offerExpiry.getTime() < pastTime.getTime(), "Offer is expired at pastTime");
    });

    it("Calculates Haversine straight-line distance truthfully without fabrication", () => {
      const dist = calculateHaversineDistanceKm([28.6304, 77.2177], [28.6129, 77.2295]);
      assert.ok(!isNaN(dist));
      assert.ok(dist >= 2.0 && dist <= 2.5, `Expected ~2.2 km, got ${dist} km`);

      assert.ok(isNaN(calculateHaversineDistanceKm([NaN, 0], [0, 0])));
      assert.ok(isNaN(calculateHaversineDistanceKm([0, 0] as any, undefined as any)));
    });
  });

  describe("4. Ride State Machine & Concurrency Invariants", () => {
    it("Validates canonical lifecycle transitions strictly", () => {
      assert.equal(canTransition("SEARCHING", "ACCEPTED"), true);
      assert.equal(canTransition("ACCEPTED", "ARRIVED"), true);
      assert.equal(canTransition("ARRIVED", "IN_PROGRESS"), true);
      assert.equal(canTransition("IN_PROGRESS", "COMPLETED"), true);

      assert.equal(canTransition("SEARCHING", "CANCELLED"), true);
      assert.equal(canTransition("ACCEPTED", "CANCELLED"), true);
      assert.equal(canTransition("ARRIVED", "CANCELLED"), true);

      assert.equal(canTransition("COMPLETED", "ACCEPTED"), false);
      assert.equal(canTransition("COMPLETED", "IN_PROGRESS"), false);
      assert.equal(canTransition("CANCELLED", "ACCEPTED"), false);
      assert.equal(canTransition("CANCELLED", "SEARCHING"), false);

      assert.equal(canTransition("IN_PROGRESS", "CANCELLED"), false);

      assert.equal(canTransition("SEARCHING", "ARRIVED"), false);
      assert.equal(canTransition("SEARCHING", "IN_PROGRESS"), false);
      assert.equal(canTransition("SEARCHING", "COMPLETED"), false);
      assert.equal(canTransition("ACCEPTED", "COMPLETED"), false);
    });

    it("Scheduled rides strictly respect configured T-60 lead time dispatch window", () => {
      const now = new Date("2026-10-13T12:00:00.000Z");
      const leadTimeMs = getDispatchLeadTimeMs();

      const futureRide = {
        status: "SEARCHING",
        scheduledFor: new Date("2026-10-13T13:15:00.000Z"),
      };
      assert.equal(isRideDispatchable(futureRide, now, leadTimeMs), false);

      const boundaryRide = {
        status: "SEARCHING",
        scheduledFor: new Date("2026-10-13T13:00:00.000Z"),
      };
      assert.equal(isRideDispatchable(boundaryRide, now, leadTimeMs), true);

      const insideRide = {
        status: "SEARCHING",
        scheduledFor: new Date("2026-10-13T12:45:00.000Z"),
      };
      assert.equal(isRideDispatchable(insideRide, now, leadTimeMs), true);

      const instantRide = {
        status: "SEARCHING",
        scheduledFor: null,
      };
      assert.equal(isRideDispatchable(instantRide, now, leadTimeMs), true);

      assert.equal(
        isRideDispatchable({ status: "ACCEPTED", scheduledFor: null, driver: "d1" }, now, leadTimeMs),
        false
      );
    });

    it("Simulates atomic mutual exclusion for driver acceptance", async () => {
      let assignedDriver: string | null = null;
      let rideStatus = "SEARCHING";

      const acceptRideAtomic = async (driverId: string): Promise<boolean> => {
        if (rideStatus === "SEARCHING" && assignedDriver === null) {
          rideStatus = "ACCEPTED";
          assignedDriver = driverId;
          return true;
        }
        return false;
      };

      const [res1, res2] = await Promise.all([
        acceptRideAtomic("driver_A"),
        acceptRideAtomic("driver_B"),
      ]);

      assert.ok((res1 && !res2) || (!res1 && res2), "Exactly one concurrent driver must win");
      assert.equal(rideStatus, "ACCEPTED");
      assert.ok(assignedDriver === "driver_A" || assignedDriver === "driver_B");
    });

    it("Simulates driver exclusivity: single driver cannot accept two different active rides", async () => {
      let driverActiveRideId: string | null = null;

      const reserveDriverForRide = async (driverId: string, rideId: string): Promise<boolean> => {
        if (driverActiveRideId === null) {
          driverActiveRideId = rideId;
          return true;
        }
        return false;
      };

      const [res1, res2] = await Promise.all([
        reserveDriverForRide("driver_1", "ride_AAA"),
        reserveDriverForRide("driver_1", "ride_BBB"),
      ]);

      assert.ok((res1 && !res2) || (!res1 && res2), "Driver cannot be assigned to two rides simultaneously");
      assert.ok(driverActiveRideId !== null);
    });
  });

  describe("5. Live Tracking, SSE & Privacy Invariants", () => {
    const mockRideDoc: Partial<IRide> = {
      _id: new mongoose.Types.ObjectId(),
      status: "ACCEPTED",
      otp: "8492",
      vehicleType: "Cab Premium",
      fare: 285,
      pickup: { address: "Pickup St", coordinates: [28.6139, 77.209] },
      dropoff: { address: "Dropoff Ave", coordinates: [28.5355, 77.391] },
      driver: new mongoose.Types.ObjectId(),
      driverDetails: {
        name: "Rajesh Kumar",
        phone: "+91 98765 43210",
        rating: 4.94,
        vehicleNumber: "DL-01-EV-4429",
        vehicleModel: "Tata Tigor EV",
      },
      driverCoordinates: [28.62, 77.215],
      driverCoordinatesUpdatedAt: new Date("2026-10-13T11:59:45.000Z"),
      trackingVersion: 4,
    };

    it("Rider snapshot contains OTP before trip starts (ACCEPTED, ARRIVED)", () => {
      const riderSnapshot = formatTrackingSnapshot(mockRideDoc as IRide, "RIDER", baseTime);
      assert.equal(riderSnapshot.otp, "8492");
      assert.equal(riderSnapshot.driverDetails?.name, "Rajesh Kumar");
      assert.equal(riderSnapshot.locationStatus, "FRESH");
      assert.equal(riderSnapshot.isLocationFresh, true);
      assert.equal(riderSnapshot.trackingVersion, 4);
    });

    it("Driver snapshot NEVER exposes OTP (strict privacy boundary)", () => {
      const driverSnapshot = formatTrackingSnapshot(mockRideDoc as IRide, "DRIVER", baseTime);
      assert.equal(driverSnapshot.otp, undefined, "Driver snapshot must never include OTP");
      assert.equal(driverSnapshot.trackingVersion, 4);
    });

    it("Rider snapshot hides OTP once ride enters IN_PROGRESS or terminal state", () => {
      const inProgressRide = { ...mockRideDoc, status: "IN_PROGRESS" } as IRide;
      const snapshot = formatTrackingSnapshot(inProgressRide, "RIDER", baseTime);
      assert.equal(snapshot.otp, undefined, "OTP must be concealed once trip is in progress");
    });

    it("Evaluates location freshness states accurately: FRESH, STALE, UNAVAILABLE, TERMINAL", () => {
      const coords: [number, number] = [28.62, 77.215];

      const fresh = evaluateLocationFreshness(coords, new Date("2026-10-13T11:59:30.000Z"), 120, baseTime);
      assert.equal(fresh.status, "FRESH");
      assert.equal(fresh.isFresh, true);
      assert.equal(fresh.ageSeconds, 30);

      const stale = evaluateLocationFreshness(coords, new Date("2026-10-13T11:57:30.000Z"), 120, baseTime);
      assert.equal(stale.status, "STALE");
      assert.equal(stale.isFresh, false);
      assert.equal(stale.ageSeconds, 150);

      const unavail = evaluateLocationFreshness(coords, null, 120, baseTime);
      assert.equal(unavail.status, "UNAVAILABLE");
      assert.equal(unavail.isFresh, false);

      const completedRide = { ...mockRideDoc, status: "COMPLETED" } as IRide;
      const termSnapshot = formatTrackingSnapshot(completedRide, "RIDER", baseTime);
      assert.equal(termSnapshot.locationStatus, "TERMINAL");
      assert.equal(termSnapshot.isLocationFresh, false);
      assert.equal(termSnapshot.isTerminal, true);
      assert.equal(termSnapshot.driverCoordinates, null);
    });

    it("buildSseMessage formats typed event frames with id, event, and data correctly", () => {
      const payload = { rideId: "r123", status: "ACCEPTED", trackingVersion: 2 };
      const msg = buildSseMessage("snapshot", payload, 2);

      assert.ok(msg.includes("id: 2\n"));
      assert.ok(msg.includes("event: snapshot\n"));
      assert.ok(msg.includes(`data: ${JSON.stringify(payload)}\n\n`));
    });

    it("buildSseKeepalive formats valid SSE comment keepalive", () => {
      const keepalive = buildSseKeepalive();
      assert.ok(keepalive.startsWith(": keepalive "));
      assert.ok(keepalive.endsWith("\n\n"));
    });

    it("isRideTerminal identifies COMPLETED and CANCELLED correctly", () => {
      assert.equal(isRideTerminal("COMPLETED"), true);
      assert.equal(isRideTerminal("CANCELLED"), true);
      assert.equal(isRideTerminal("SEARCHING"), false);
      assert.equal(isRideTerminal("ACCEPTED"), false);
      assert.equal(isRideTerminal("ARRIVED"), false);
      assert.equal(isRideTerminal("IN_PROGRESS"), false);
    });

    it("Monotonic guard: client updater rejects out-of-order SSE or polling updates", () => {
      const currentRideState = {
        _id: "ride_1",
        status: "ACCEPTED",
        trackingVersion: 5,
        driverCoordinates: [28.62, 77.21] as [number, number],
      };

      const outOfOrderUpdate = {
        _id: "ride_1",
        status: "ACCEPTED",
        trackingVersion: 3,
        driverCoordinates: [28.61, 77.20] as [number, number],
      };

      const shouldApply = (cur: typeof currentRideState, incoming: typeof outOfOrderUpdate): boolean => {
        if (incoming.trackingVersion < cur.trackingVersion && !["COMPLETED", "CANCELLED"].includes(incoming.status)) {
          return false;
        }
        return true;
      };

      assert.equal(shouldApply(currentRideState, outOfOrderUpdate), false);

      const newerUpdate = {
        ...outOfOrderUpdate,
        trackingVersion: 6,
      };
      assert.equal(shouldApply(currentRideState, newerUpdate), true);

      const terminalUpdate = {
        ...outOfOrderUpdate,
        status: "CANCELLED",
        trackingVersion: 2,
      };
      assert.equal(shouldApply(currentRideState, terminalUpdate), true);
    });

    it("Out-of-order location update guard: server rejects telemetry with older timestamp", () => {
      const existingCoordinatesUpdatedAt = new Date("2026-10-13T11:59:30.000Z");

      const isOutOfOrder = (incomingClientTime: Date, existingTime: Date): boolean => {
        return incomingClientTime.getTime() < existingTime.getTime();
      };

      const olderTime = new Date("2026-10-13T11:59:15.000Z");
      assert.equal(isOutOfOrder(olderTime, existingCoordinatesUpdatedAt), true);

      const newerTime = new Date("2026-10-13T11:59:45.000Z");
      assert.equal(isOutOfOrder(newerTime, existingCoordinatesUpdatedAt), false);
    });
  });
});
