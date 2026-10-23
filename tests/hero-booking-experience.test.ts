import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuthoritativeFare,
  validateCoordinates,
  PricingError,
  AUTHORITATIVE_RATE_CARDS,
} from "../src/lib/pricingEngine";
import { formatTrackingSnapshot, isRideTerminal } from "../src/lib/rideTracking";
import { parseCommuteTime, getCanonicalWeekdayName } from "../src/lib/recurrenceEngine";
import { POST as estimatePOST, GET as estimateGET } from "../src/app/api/rides/estimate/route";

describe("Hero Real-Time Booking Experience & Server-Authoritative Integrity Tests", () => {
  const pickupConnaught: [number, number] = [28.6315, 77.2167];
  const dropoffNoida62: [number, number] = [28.628, 77.3649];

  describe("1. Coordinate Validation & Rejection of Fallbacks", () => {
    it("Validates and accepts standard geographic coordinates within range", () => {
      const validatedPickup = validateCoordinates(pickupConnaught, "pickup");
      assert.deepEqual(validatedPickup, pickupConnaught);

      const validatedDropoff = validateCoordinates(dropoffNoida62, "dropoff");
      assert.deepEqual(validatedDropoff, dropoffNoida62);
    });

    it("Rejects non-array, missing, or malformed coordinate representations", () => {
      assert.throws(
        () => validateCoordinates(null, "pickup"),
        (err: unknown) => (err as PricingError).code === "INVALID_COORDINATES"
      );
      assert.throws(
        () => validateCoordinates([28.61], "pickup"),
        (err: unknown) => (err as PricingError).code === "INVALID_COORDINATES"
      );
      assert.throws(
        () => validateCoordinates(["28.61", "77.20"], "pickup"),
        (err: unknown) => (err as PricingError).code === "INVALID_COORDINATES"
      );
      assert.throws(
        () => validateCoordinates([NaN, 77.20], "pickup"),
        (err: unknown) => (err as PricingError).code === "INVALID_COORDINATES"
      );
    });

    it("Rejects out-of-range latitudes (> 90 or < -90) and longitudes (> 180 or < -180)", () => {
      assert.throws(
        () => validateCoordinates([95.0, 77.20], "pickup"),
        (err: unknown) => (err as PricingError).code === "INVALID_COORDINATES"
      );
      assert.throws(
        () => validateCoordinates([28.61, 195.0], "dropoff"),
        (err: unknown) => (err as PricingError).code === "INVALID_COORDINATES"
      );
    });

    it("Rejects identical or near-identical coordinates (< 50 meters apart)", () => {
      assert.throws(
        () =>
          calculateAuthoritativeFare({
            pickupCoordinates: pickupConnaught,
            dropoffCoordinates: [pickupConnaught[0] + 0.00001, pickupConnaught[1] + 0.00001],
            vehicleType: "Cab Premium",
          }),
        (err: unknown) => (err as PricingError).code === "IDENTICAL_LOCATIONS"
      );
    });
  });

  describe("2. Server-Authoritative Fare Estimation & Rate Cards", () => {
    it("Calculates correct fares across all standard categories in integer paise and INR rupees", () => {
      const distanceKm = 15.0;

      for (const [key, card] of Object.entries(AUTHORITATIVE_RATE_CARDS)) {
        const result = calculateAuthoritativeFare({
          pickupCoordinates: pickupConnaught,
          dropoffCoordinates: dropoffNoida62,
          vehicleType: card.name,
          claimedDistanceKm: distanceKm,
        });

        const expectedDistancePaise = Math.round(distanceKm * card.perKmPaise);
        const expectedTotalPaise = card.baseRatePaise + expectedDistancePaise;
        const expectedRupees = Math.round(expectedTotalPaise / 100);

        assert.equal(result.fareInPaise, expectedTotalPaise, `Paise mismatch for ${key}`);
        assert.equal(result.fareInRupees, expectedRupees, `Rupees mismatch for ${key}`);
        assert.equal(result.pricingSnapshot.baseFarePaise, card.baseRatePaise);
        assert.equal(result.pricingSnapshot.distanceFarePaise, expectedDistancePaise);
        assert.equal(result.pricingSnapshot.currency, "INR");
        assert.equal(result.pricingSnapshot.rateRuleVersion, "v1_standard");
      }
    });

    it("Applies pet-friendly 15% surcharge strictly in integer paise without fractional leakage", () => {
      const baseResult = calculateAuthoritativeFare({
        pickupCoordinates: pickupConnaught,
        dropoffCoordinates: dropoffNoida62,
        vehicleType: "Cab Economy",
        claimedDistanceKm: 16.0,
        petFriendly: false,
      });

      const petResult = calculateAuthoritativeFare({
        pickupCoordinates: pickupConnaught,
        dropoffCoordinates: dropoffNoida62,
        vehicleType: "Cab Economy",
        claimedDistanceKm: 16.0,
        petFriendly: true,
      });

      const expectedSurchargePaise = Math.round(baseResult.fareInPaise * 0.15);
      assert.equal(petResult.pricingSnapshot.petFriendlySurchargePaise, expectedSurchargePaise);
      assert.equal(petResult.fareInPaise, baseResult.fareInPaise + expectedSurchargePaise);
      assert.equal(petResult.fareInRupees, Math.round(petResult.fareInPaise / 100));
    });

    it("Rejects client attempts to claim distance lower than geodesic road lower bound", () => {
      assert.throws(
        () =>
          calculateAuthoritativeFare({
            pickupCoordinates: pickupConnaught,
            dropoffCoordinates: dropoffNoida62,
            vehicleType: "Cab Economy",
            claimedDistanceKm: 1.0, // Geodesic is ~14.4km
          }),
        (err: unknown) => (err as PricingError).code === "INVALID_DISTANCE_MANIPULATION"
      );
    });

    it("Rejects client attempts to inflate distance excessively (> 3.5x geodesic)", () => {
      assert.throws(
        () =>
          calculateAuthoritativeFare({
            pickupCoordinates: pickupConnaught,
            dropoffCoordinates: dropoffNoida62,
            vehicleType: "Cab Economy",
            claimedDistanceKm: 250.0,
          }),
        (err: unknown) => (err as PricingError).code === "EXCESSIVE_DISTANCE"
      );
    });
  });

  describe("3. Estimation API Route Handlers", () => {
    it("POST /api/rides/estimate returns valid estimates array for all vehicles", async () => {
      const req = new Request("http://localhost:3000/api/rides/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCoordinates: pickupConnaught,
          dropoffCoordinates: dropoffNoida62,
          vehicleType: "Cab Economy",
          petFriendly: false,
        }),
      });

      const res = await estimatePOST(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, "success");
      assert.ok(json.data.distanceKm > 0);
      assert.ok(json.data.durationMins > 0);
      assert.ok(Array.isArray(json.data.estimates));
      assert.equal(json.data.estimates.length, Object.keys(AUTHORITATIVE_RATE_CARDS).length);

      const economy = json.data.estimates.find((e: { name: string }) => e.name === "Cab Economy");
      assert.ok(economy);
      assert.equal(economy.fareInRupees, json.data.fareInRupees);
    });

    it("POST /api/rides/estimate rejects missing coordinates with 400 error", async () => {
      const req = new Request("http://localhost:3000/api/rides/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCoordinates: null,
          dropoffCoordinates: dropoffNoida62,
        }),
      });

      const res = await estimatePOST(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.equal(json.status, "error");
      assert.equal(json.code, "INVALID_COORDINATES");
    });

    it("GET /api/rides/estimate with query params returns valid calculation", async () => {
      const req = new Request(
        `http://localhost:3000/api/rides/estimate?pickupLat=${pickupConnaught[0]}&pickupLng=${pickupConnaught[1]}&dropoffLat=${dropoffNoida62[0]}&dropoffLng=${dropoffNoida62[1]}&vehicleType=Auto`
      );

      const res = await estimateGET(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.status, "success");
      assert.equal(json.data.selectedVehicle, "Auto");
      assert.ok(json.data.fareInRupees > 0);
    });
  });

  describe("4. Commute Recurrence Validation & Domain Rules", () => {
    it("Validates commute times in 12-hour and 24-hour formats", () => {
      const t1 = parseCommuteTime("08:30 AM");
      assert.equal(t1.hours, 8);
      assert.equal(t1.minutes, 30);

      const t2 = parseCommuteTime("5:45 PM");
      assert.equal(t2.hours, 17);
      assert.equal(t2.minutes, 45);

      const t3 = parseCommuteTime("14:20");
      assert.equal(t3.hours, 14);
      assert.equal(t3.minutes, 20);
    });

    it("Rejects invalid commute time formats", () => {
      assert.throws(() => parseCommuteTime("25:00"));
      assert.throws(() => parseCommuteTime("not-a-time"));
      assert.throws(() => parseCommuteTime("12:75 AM"));
    });

    it("Canonicalizes and validates weekday abbreviations", () => {
      assert.equal(getCanonicalWeekdayName("Mon"), "Mon");
      assert.equal(getCanonicalWeekdayName("monday"), "Mon");
      assert.equal(getCanonicalWeekdayName("fri"), "Fri");
      assert.equal(getCanonicalWeekdayName("Sunday"), "Sun");

      assert.throws(() => getCanonicalWeekdayName("Funday"));
      assert.throws(() => getCanonicalWeekdayName(""));
    });
  });

  describe("5. Ride Lifecycle & OTP Security Policy", () => {
    const mockRideBase = {
      _id: "660000000000000000000001",
      rider: "660000000000000000000002",
      pickup: { address: "Connaught Place", coordinates: pickupConnaught },
      dropoff: { address: "Noida Sector 62", coordinates: dropoffNoida62 },
      vehicleType: "Cab Premium",
      fare: 540,
      fareInPaise: 54000,
      distance: "16.0 km",
      duration: "35 mins",
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      otp: "8492",
      trackingVersion: 3,
      updatedAt: new Date(),
    };

    it("NEVER reveals OTP to rider while ride is in SEARCHING state", () => {
      const searchingRide = {
        ...mockRideBase,
        status: "SEARCHING" as const,
        driver: null,
      };

      const snapshot = formatTrackingSnapshot(searchingRide as any, "RIDER");
      assert.equal(snapshot.status, "SEARCHING");
      assert.equal(snapshot.otp, undefined, "OTP must NOT be exposed in SEARCHING status");
    });

    it("Reveals OTP to rider only when driver is ACCEPTED or ARRIVED", () => {
      const acceptedRide = {
        ...mockRideBase,
        status: "ACCEPTED" as const,
        driver: "660000000000000000000003",
        driverDetails: {
          name: "Ramesh Kumar",
          phone: "+919876543210",
          rating: 4.9,
          vehicleNumber: "DL 1Y AB 1234",
          vehicleModel: "Swift Dzire",
        },
      };

      const snapshot = formatTrackingSnapshot(acceptedRide as any, "RIDER");
      assert.equal(snapshot.status, "ACCEPTED");
      assert.equal(snapshot.otp, "8492", "OTP must be exposed when driver is assigned");
      assert.equal(snapshot.driverDetails?.name, "Ramesh Kumar");
    });

    it("Hides OTP once ride transitions to IN_PROGRESS", () => {
      const inProgressRide = {
        ...mockRideBase,
        status: "IN_PROGRESS" as const,
        driver: "660000000000000000000003",
      };

      const snapshot = formatTrackingSnapshot(inProgressRide as any, "RIDER");
      assert.equal(snapshot.status, "IN_PROGRESS");
      assert.equal(snapshot.otp, undefined, "OTP must be hidden once ride is in progress");
    });

    it("Correctly identifies terminal ride states", () => {
      assert.equal(isRideTerminal("COMPLETED"), true);
      assert.equal(isRideTerminal("CANCELLED"), true);
      assert.equal(isRideTerminal("SEARCHING"), false);
      assert.equal(isRideTerminal("ACCEPTED"), false);
      assert.equal(isRideTerminal("IN_PROGRESS"), false);
    });
  });
});
