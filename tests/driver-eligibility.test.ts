import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isVehicleCompatible,
  isPetCompatible,
  evaluateDriverEligibility,
  IDriverCandidate,
  IRideRequirements,
} from "../src/lib/driverEligibility";

describe("Phase 1D: Centralized Driver Eligibility Service Tests", () => {
  const baseTime = new Date("2026-10-09T12:00:00.000Z");

  const validDriver: IDriverCandidate = {
    _id: "driver_valid_1",
    role: "DRIVER",
    status: "ACTIVE",
    isOnline: true,
    dutyState: "ONLINE_SEARCHING",
    driverCoordinates: [28.6139, 77.209],
    driverCoordinatesUpdatedAt: new Date("2026-10-09T11:59:30.000Z"), // 30s ago
    driverVehicle: {
      type: "Cab Premium",
      documentsVerified: true,
    },
    driverSettings: {
      petFriendly: true,
    },
  };

  const standardRide: IRideRequirements = {
    _id: "ride_std_1",
    vehicleType: "Cab Premium",
    pickup: {
      address: "India Gate, New Delhi",
      coordinates: [28.6129, 77.2295], // ~2 km away
    },
    petFriendly: false,
    rejectedDrivers: [],
  };

  // --- Vehicle Compatibility Tests ---
  describe("Vehicle Compatibility Mapping", () => {
    it("Exact match vehicle types are compatible", () => {
      assert.equal(isVehicleCompatible("Cab Economy", "Cab Economy"), true);
      assert.equal(isVehicleCompatible("Cab Premium", "Cab Premium"), true);
      assert.equal(isVehicleCompatible("Auto", "Auto"), true);
      assert.equal(isVehicleCompatible("Bike", "Bike"), true);
    });

    it("Cab XL can fulfill Cab Premium and Cab Economy", () => {
      assert.equal(isVehicleCompatible("Cab XL", "Cab Premium"), true);
      assert.equal(isVehicleCompatible("Cab XL", "Cab Economy"), true);
    });

    it("Cab Premium can fulfill Cab Economy", () => {
      assert.equal(isVehicleCompatible("Cab Premium", "Cab Economy"), true);
    });

    it("Cab Economy cannot fulfill Cab Premium or Cab XL", () => {
      assert.equal(isVehicleCompatible("Cab Economy", "Cab Premium"), false);
      assert.equal(isVehicleCompatible("Cab Economy", "Cab XL"), false);
    });

    it("Auto and Bike cannot fulfill Car categories", () => {
      assert.equal(isVehicleCompatible("Auto", "Cab Economy"), false);
      assert.equal(isVehicleCompatible("Bike", "Cab Premium"), false);
      assert.equal(isVehicleCompatible("Cab Premium", "Auto"), false);
    });

    it("Unknown or unsupported vehicle categories fail closed", () => {
      assert.equal(isVehicleCompatible("Helicopter", "Cab Premium"), false);
      assert.equal(isVehicleCompatible("Cab Premium", "Submarine"), false);
      assert.equal(isVehicleCompatible(undefined, "Cab Economy"), false);
      assert.equal(isVehicleCompatible("Cab Premium", undefined), false);
    });
  });

  // --- Pet Compatibility Tests ---
  describe("Pet Compatibility", () => {
    it("Pet-friendly ride requires explicit pet-friendly driver setting", () => {
      assert.equal(isPetCompatible({ petFriendly: true }, true), true);
      assert.equal(isPetCompatible({ petFriendly: false }, true), false);
      assert.equal(isPetCompatible(undefined, true), false);
      assert.equal(isPetCompatible({}, true), false);
    });

    it("Standard non-pet ride does not require pet setting", () => {
      assert.equal(isPetCompatible({ petFriendly: false }, false), true);
      assert.equal(isPetCompatible(undefined, false), true);
      assert.equal(isPetCompatible({ petFriendly: true }, false), true);
    });
  });

  // --- Comprehensive Driver Eligibility Evaluation ---
  describe("evaluateDriverEligibility()", () => {
    it("Fully compliant driver is eligible for ride within radius", () => {
      const result = evaluateDriverEligibility(validDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, true);
      assert.ok(result.distanceKm! < 5, "Expected distance < 5km");
    });

    it("Offline driver is rejected", () => {
      const offlineDriver = { ...validDriver, isOnline: false };
      const result = evaluateDriverEligibility(offlineDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "DRIVER_OFFLINE");
    });

    it("Driver with dutyState OFFLINE is rejected", () => {
      const offlineDriver = { ...validDriver, dutyState: "OFFLINE" };
      const result = evaluateDriverEligibility(offlineDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "DRIVER_OFFLINE");
    });

    it("Driver on an active trip (dutyState ON_TRIP) is rejected", () => {
      const occupiedDriver = { ...validDriver, dutyState: "ON_TRIP" };
      const result = evaluateDriverEligibility(occupiedDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "DRIVER_OCCUPIED");
    });

    it("Suspended or non-active driver account is rejected", () => {
      const suspendedDriver = { ...validDriver, status: "SUSPENDED" };
      const result = evaluateDriverEligibility(suspendedDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "DRIVER_INACTIVE");
    });

    it("Driver without role DRIVER is rejected", () => {
      const riderUser = { ...validDriver, role: "RIDER" };
      const result = evaluateDriverEligibility(riderUser, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "INVALID_ROLE");
    });

    it("Driver with unverified vehicle documents is rejected", () => {
      const unverifiedDriver = {
        ...validDriver,
        driverVehicle: { type: "Cab Premium", documentsVerified: false },
      };
      const result = evaluateDriverEligibility(unverifiedDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "DOCUMENTS_UNVERIFIED");
    });

    it("Driver with incompatible vehicle category is rejected", () => {
      const bikeDriver = {
        ...validDriver,
        driverVehicle: { type: "Bike", documentsVerified: true },
      };
      const result = evaluateDriverEligibility(bikeDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "VEHICLE_INCOMPATIBLE");
    });

    it("Driver with stale location (> 120s) is rejected", () => {
      const staleDriver = {
        ...validDriver,
        driverCoordinatesUpdatedAt: new Date("2026-10-09T11:55:00.000Z"), // 5 mins ago
      };
      const result = evaluateDriverEligibility(staleDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "LOCATION_STALE");
    });

    it("Driver with missing location timestamp is rejected", () => {
      const noTimestampDriver = {
        ...validDriver,
        driverCoordinatesUpdatedAt: null,
      };
      const result = evaluateDriverEligibility(noTimestampDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "LOCATION_STALE");
    });

    it("Driver located outside maximum matching radius (> 10 km) is rejected", () => {
      // Greater Noida Pari Chowk is ~35 km from India Gate
      const distantDriver = {
        ...validDriver,
        driverCoordinates: [28.468, 77.509] as [number, number],
      };
      const result = evaluateDriverEligibility(distantDriver, standardRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "OUTSIDE_RADIUS");
    });

    it("Pet-friendly ride rejects driver who does not accept pets", () => {
      const nonPetDriver = {
        ...validDriver,
        driverSettings: { petFriendly: false },
      };
      const petRide: IRideRequirements = {
        ...standardRide,
        petFriendly: true,
      };
      const result = evaluateDriverEligibility(nonPetDriver, petRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "PET_INCOMPATIBLE");
    });

    it("Pet-friendly ride accepts driver who explicitly accepts pets", () => {
      const petRide: IRideRequirements = {
        ...standardRide,
        petFriendly: true,
      };
      const result = evaluateDriverEligibility(validDriver, petRide, { atTime: baseTime });
      assert.equal(result.isEligible, true);
    });

    it("Driver in ride's rejectedDrivers list is excluded from eligibility", () => {
      const rejectedRide: IRideRequirements = {
        ...standardRide,
        rejectedDrivers: ["driver_valid_1"],
      };
      const result = evaluateDriverEligibility(validDriver, rejectedRide, { atTime: baseTime });
      assert.equal(result.isEligible, false);
      assert.equal(result.reason, "ALREADY_REJECTED");
    });
  });
});
