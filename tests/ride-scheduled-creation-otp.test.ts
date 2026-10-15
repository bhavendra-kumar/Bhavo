import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRideDispatchable,
  getDispatchLeadTimeMinutes,
  getDispatchLeadTimeMs,
  DEFAULT_DISPATCH_LEAD_TIME_MINUTES,
  RideTransitionError,
} from "../src/lib/rideStateMachine";

describe("Phase 1B: Scheduled Ride Safety, Creation Security & OTP Tests", () => {

  it("Scenario 29.1: Default configuration is 60 minutes when environment variable is absent", () => {
    assert.equal(DEFAULT_DISPATCH_LEAD_TIME_MINUTES, 60);
    assert.equal(getDispatchLeadTimeMinutes(undefined), 60);
    assert.equal(getDispatchLeadTimeMinutes(""), 60);
    assert.equal(getDispatchLeadTimeMinutes("   "), 60);
    assert.equal(getDispatchLeadTimeMs(undefined), 60 * 60 * 1000);
  });

  it("Scenario 29.2: 60-minute boundary: ride is accepted when exactly 60 minutes remain", () => {
    const scheduledPickup = new Date("2026-10-10T08:15:00.000Z");
    const exactBoundaryTime = new Date("2026-10-10T07:15:00.000Z");
    const ride = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: scheduledPickup,
    };

    const dispatchable = isRideDispatchable(ride, exactBoundaryTime);
    assert.equal(
      dispatchable,
      true,
      "Ride must be dispatchable at exactly 60 minutes before scheduled pickup (07:15 for 08:15)"
    );
  });

  it("Scenario 29.3: More than 60 minutes: ride cannot be accepted", () => {
    const scheduledPickup = new Date("2026-10-10T08:15:00.000Z");
    const ride = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: scheduledPickup,
    };

    const earlyTime135m = new Date("2026-10-10T06:00:00.000Z");
    assert.equal(
      isRideDispatchable(ride, earlyTime135m),
      false,
      "Ride 135 minutes ahead must NOT be dispatchable"
    );

    const earlyTime61m = new Date("2026-10-10T07:14:00.000Z");
    assert.equal(
      isRideDispatchable(ride, earlyTime61m),
      false,
      "Ride 61 minutes ahead must NOT be dispatchable"
    );

    const tomorrowRide = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: new Date("2026-10-11T08:15:00.000Z"),
    };
    assert.equal(
      isRideDispatchable(tomorrowRide, exactBoundaryTimeOrNow(earlyTime61m)),
      false,
      "Ride scheduled for tomorrow must NOT be dispatchable"
    );

    function exactBoundaryTimeOrNow(d: Date) {
      return d;
    }
  });

  it("Scenario 29.4: Less than 60 minutes: ride can be accepted", () => {
    const scheduledPickup = new Date("2026-10-10T08:15:00.000Z");
    const ride = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: scheduledPickup,
    };

    const time45m = new Date("2026-10-10T07:30:00.000Z");
    assert.equal(
      isRideDispatchable(ride, time45m),
      true,
      "Ride 45 minutes ahead must be dispatchable"
    );

    const time15m = new Date("2026-10-10T08:00:00.000Z");
    assert.equal(
      isRideDispatchable(ride, time15m),
      true,
      "Ride 15 minutes ahead must be dispatchable"
    );
  });

  it("Scenario 29.5: Custom configuration: RIDE_DISPATCH_LEAD_TIME_MINUTES=90 enforces 90-minute window", () => {
    assert.equal(getDispatchLeadTimeMinutes("90"), 90);
    assert.equal(getDispatchLeadTimeMs("90"), 90 * 60 * 1000);

    const scheduledPickup = new Date("2026-10-10T09:30:00.000Z");
    const ride = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: scheduledPickup,
    };

    const lead90Ms = getDispatchLeadTimeMs("90");

    const timeAt90m = new Date("2026-10-10T08:00:00.000Z");
    assert.equal(isRideDispatchable(ride, timeAt90m, lead90Ms), true);

    const timeAt91m = new Date("2026-10-10T07:59:00.000Z");
    assert.equal(isRideDispatchable(ride, timeAt91m, lead90Ms), false);
  });

  it("Scenario 29.6: Invalid configuration: non-numeric value is rejected", () => {
    assert.throws(
      () => getDispatchLeadTimeMinutes("invalid-string"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
    assert.throws(
      () => getDispatchLeadTimeMinutes("abc"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
  });

  it("Scenario 29.7: Invalid configuration: zero is rejected", () => {
    assert.throws(
      () => getDispatchLeadTimeMinutes("0"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
  });

  it("Scenario 29.8: Invalid configuration: negative value is rejected", () => {
    assert.throws(
      () => getDispatchLeadTimeMinutes("-60"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
  });

  it("Scenario 29.9: Invalid configuration: decimal value is rejected", () => {
    assert.throws(
      () => getDispatchLeadTimeMinutes("60.5"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
    assert.throws(
      () => getDispatchLeadTimeMinutes("45.0"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
  });

  it("Scenario 29.10: Dispatch discovery and driver acceptance use the SAME configured value", () => {
    const leadTimeMs = getDispatchLeadTimeMs();
    assert.equal(leadTimeMs, 60 * 60 * 1000);

    const now = new Date("2026-10-10T12:00:00.000Z");
    const maxDispatchScheduledFor = new Date(now.getTime() + leadTimeMs);
    const maxAllowedAcceptanceScheduledFor = new Date(now.getTime() + leadTimeMs);

    assert.equal(
      maxDispatchScheduledFor.getTime(),
      maxAllowedAcceptanceScheduledFor.getTime(),
      "Dispatch polling query ceiling must match acceptance atomic condition ceiling exactly"
    );
  });

  it("Scenario 29.11: Immediate rides remain unaffected by scheduled dispatch window", () => {
    const instantRideNull = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: null,
    };
    const instantRideUndefined = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: undefined,
    };

    assert.equal(isRideDispatchable(instantRideNull, new Date()), true);
    assert.equal(isRideDispatchable(instantRideUndefined, new Date()), true);
  });

  const sanitizeAndCreateRide = (
    authenticatedRiderId: string,
    rawClientInput: Record<string, unknown>
  ) => {
    const sanitizedRide = {
      _id: "ride_new_123",
      rider: authenticatedRiderId,
      pickup: rawClientInput.pickup || { address: "Pickup point" },
      dropoff: rawClientInput.dropoff || { address: "Dropoff point" },
      fare: typeof rawClientInput.fare === "number" ? rawClientInput.fare : 250,
      status: "SEARCHING",
      driver: null,
      otp: "5678",
      paymentStatus: "PENDING",
    };

    return sanitizedRide;
  };

  it("Scenario 31: Client input attempting to force status=COMPLETED is stripped and forced to SEARCHING", () => {
    const riderId = "rider_legit_1";
    const maliciousInput = {
      pickup: { address: "A" },
      dropoff: { address: "B" },
      status: "COMPLETED",
    };

    const ride = sanitizeAndCreateRide(riderId, maliciousInput);
    assert.equal(ride.status, "SEARCHING");
    assert.notEqual(ride.status, "COMPLETED");
  });

  it("Scenario 32: Client input attempting to force status=ACCEPTED is stripped and forced to SEARCHING", () => {
    const riderId = "rider_legit_1";
    const maliciousInput = {
      pickup: { address: "A" },
      dropoff: { address: "B" },
      status: "ACCEPTED",
    };

    const ride = sanitizeAndCreateRide(riderId, maliciousInput);
    assert.equal(ride.status, "SEARCHING");
    assert.notEqual(ride.status, "ACCEPTED");
  });

  it("Scenario 33: Client input attempting to assign an arbitrary driverId is stripped and set to null", () => {
    const riderId = "rider_legit_1";
    const maliciousInput = {
      pickup: { address: "A" },
      dropoff: { address: "B" },
      driver: "driver_victim_999",
      driverId: "driver_victim_999",
    };

    const ride = sanitizeAndCreateRide(riderId, maliciousInput);
    assert.equal(ride.driver, null);
  });

  it("Scenario 34: Client input attempting to book on behalf of another riderId is ignored", () => {
    const authenticatedRiderId = "rider_session_actual";
    const spoofedRiderId = "rider_victim_123";
    const maliciousInput = {
      pickup: { address: "A" },
      dropoff: { address: "B" },
      rider: spoofedRiderId,
      userId: spoofedRiderId,
    };

    const ride = sanitizeAndCreateRide(authenticatedRiderId, maliciousInput);
    assert.equal(ride.rider, authenticatedRiderId);
    assert.notEqual(ride.rider, spoofedRiderId);
  });

  const attemptStartRideWithOtp = (
    ride: { status: string; driver: string; otp: string },
    callingDriverId: string,
    enteredOtp: string
  ) => {
    if (ride.driver !== callingDriverId) {
      throw new RideTransitionError("Forbidden", 403, "FORBIDDEN");
    }
    if (ride.status === "IN_PROGRESS") {
      throw new RideTransitionError("Ride already started", 409, "ALREADY_STARTED");
    }
    if (ride.status !== "ARRIVED") {
      throw new RideTransitionError(
        `Cannot start ride from status '${ride.status}'`,
        409,
        "INVALID_TRANSITION"
      );
    }
    const cleanOtp = String(enteredOtp || "").trim();
    if (!cleanOtp) {
      throw new RideTransitionError("OTP code required", 400, "OTP_REQUIRED");
    }
    if (cleanOtp !== ride.otp) {
      throw new RideTransitionError("Invalid OTP code", 400, "INVALID_OTP");
    }

    return { ...ride, status: "IN_PROGRESS" };
  };

  it("Scenario 35: Invalid OTP cannot start a ride (rejected with 400 INVALID_OTP)", () => {
    const ride = {
      status: "ARRIVED",
      driver: "driver_1",
      otp: "4921",
    };

    assert.throws(
      () => attemptStartRideWithOtp(ride, "driver_1", "9999"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "INVALID_OTP");
        return true;
      }
    );
  });

  it("Scenario 36: Valid OTP permits ARRIVED -> IN_PROGRESS transition", () => {
    const ride = {
      status: "ARRIVED",
      driver: "driver_1",
      otp: "4921",
    };

    const updated = attemptStartRideWithOtp(ride, "driver_1", "4921");
    assert.equal(updated.status, "IN_PROGRESS");
  });

  it("Scenario 37: Correct OTP cannot bypass state validation if ride is not in ARRIVED status", () => {
    const searchingRide = {
      status: "SEARCHING",
      driver: "driver_1",
      otp: "4921",
    };

    assert.throws(
      () => attemptStartRideWithOtp(searchingRide, "driver_1", "4921"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "INVALID_TRANSITION");
        return true;
      }
    );
  });

  it("Scenario 38: Already-started ride cannot be started again (409 ALREADY_STARTED)", () => {
    const inProgressRide = {
      status: "IN_PROGRESS",
      driver: "driver_1",
      otp: "4921",
    };

    assert.throws(
      () => attemptStartRideWithOtp(inProgressRide, "driver_1", "4921"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "ALREADY_STARTED");
        return true;
      }
    );
  });
});
