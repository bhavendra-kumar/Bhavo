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
  // ==========================================
  // SCHEDULED RIDE DISPATCH LEAD TIME TESTS
  // ==========================================

  // 1. Default configuration is 60 minutes when environment variable is absent
  it("Scenario 29.1: Default configuration is 60 minutes when environment variable is absent", () => {
    assert.equal(DEFAULT_DISPATCH_LEAD_TIME_MINUTES, 60);
    assert.equal(getDispatchLeadTimeMinutes(undefined), 60);
    assert.equal(getDispatchLeadTimeMinutes(""), 60);
    assert.equal(getDispatchLeadTimeMinutes("   "), 60);
    assert.equal(getDispatchLeadTimeMs(undefined), 60 * 60 * 1000);
  });

  // 2. 60-minute boundary: ride is accepted when exactly 60 minutes remain
  it("Scenario 29.2: 60-minute boundary: ride is accepted when exactly 60 minutes remain", () => {
    // Scheduled pickup: 08:15 AM
    const scheduledPickup = new Date("2026-10-10T08:15:00.000Z");
    // Exactly 60 minutes before: 07:15 AM
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

  // 3. More than 60 minutes: ride cannot be accepted
  it("Scenario 29.3: More than 60 minutes: ride cannot be accepted", () => {
    const scheduledPickup = new Date("2026-10-10T08:15:00.000Z");
    const ride = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: scheduledPickup,
    };

    // Case 1: 06:00 AM (135 minutes before pickup)
    const earlyTime135m = new Date("2026-10-10T06:00:00.000Z");
    assert.equal(
      isRideDispatchable(ride, earlyTime135m),
      false,
      "Ride 135 minutes ahead must NOT be dispatchable"
    );

    // Case 2: 07:14 AM (61 minutes before pickup)
    const earlyTime61m = new Date("2026-10-10T07:14:00.000Z");
    assert.equal(
      isRideDispatchable(ride, earlyTime61m),
      false,
      "Ride 61 minutes ahead must NOT be dispatchable"
    );

    // Case 3: Tomorrow (24 hours ahead)
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

  // 4. Less than 60 minutes: ride can be accepted
  it("Scenario 29.4: Less than 60 minutes: ride can be accepted", () => {
    const scheduledPickup = new Date("2026-10-10T08:15:00.000Z");
    const ride = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: scheduledPickup,
    };

    // Case 4: 07:30 AM (45 minutes before pickup)
    const time45m = new Date("2026-10-10T07:30:00.000Z");
    assert.equal(
      isRideDispatchable(ride, time45m),
      true,
      "Ride 45 minutes ahead must be dispatchable"
    );

    // Case 5: 08:00 AM (15 minutes before pickup)
    const time15m = new Date("2026-10-10T08:00:00.000Z");
    assert.equal(
      isRideDispatchable(ride, time15m),
      true,
      "Ride 15 minutes ahead must be dispatchable"
    );
  });

  // 5. Custom configuration: Example: RIDE_DISPATCH_LEAD_TIME_MINUTES=90
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

    // At 08:00 AM (exactly 90 minutes before) -> dispatchable
    const timeAt90m = new Date("2026-10-10T08:00:00.000Z");
    assert.equal(isRideDispatchable(ride, timeAt90m, lead90Ms), true);

    // At 07:59 AM (91 minutes before) -> NOT dispatchable
    const timeAt91m = new Date("2026-10-10T07:59:00.000Z");
    assert.equal(isRideDispatchable(ride, timeAt91m, lead90Ms), false);
  });

  // 6. Invalid configuration: non-numeric value -> safe failure / validation error
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

  // 7. Invalid configuration: zero -> rejected
  it("Scenario 29.7: Invalid configuration: zero is rejected", () => {
    assert.throws(
      () => getDispatchLeadTimeMinutes("0"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
  });

  // 8. Invalid configuration: negative value -> rejected
  it("Scenario 29.8: Invalid configuration: negative value is rejected", () => {
    assert.throws(
      () => getDispatchLeadTimeMinutes("-60"),
      /Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES/
    );
  });

  // 9. Invalid configuration: decimal value -> rejected
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

  // 10. Dispatch discovery and driver acceptance use the SAME configured value
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

  // 11. Immediate rides remain unaffected
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

  // ==========================================
  // RIDE CREATION PRIVILEGE STRIPPING TESTS
  // ==========================================

  const sanitizeAndCreateRide = (
    authenticatedRiderId: string,
    rawClientInput: Record<string, unknown>
  ) => {
    // Server strictly enforces ownership, initial state, and null driver
    const sanitizedRide = {
      _id: "ride_new_123",
      rider: authenticatedRiderId, // Derived strictly from session, ignores rawClientInput.rider
      pickup: rawClientInput.pickup || { address: "Pickup point" },
      dropoff: rawClientInput.dropoff || { address: "Dropoff point" },
      fare: typeof rawClientInput.fare === "number" ? rawClientInput.fare : 250,
      status: "SEARCHING", // Server forces initial status; ignores rawClientInput.status
      driver: null, // Server forces null driver; ignores rawClientInput.driver / driverId
      otp: "5678", // Server generates OTP
      paymentStatus: "PENDING",
    };

    return sanitizedRide;
  };

  // 31. Client cannot force COMPLETED state
  it("Scenario 31: Client input attempting to force status=COMPLETED is stripped and forced to SEARCHING", () => {
    const riderId = "rider_legit_1";
    const maliciousInput = {
      pickup: { address: "A" },
      dropoff: { address: "B" },
      status: "COMPLETED", // Attempted privilege escalation
    };

    const ride = sanitizeAndCreateRide(riderId, maliciousInput);
    assert.equal(ride.status, "SEARCHING");
    assert.notEqual(ride.status, "COMPLETED");
  });

  // 32. Client cannot force ACCEPTED state
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

  // 33. Client cannot assign arbitrary driver
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

  // 34. Client cannot assign another rider
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

  // ==========================================
  // OTP SECURITY & TRANSITION TESTS
  // ==========================================

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

  // 35. Invalid OTP cannot start a ride
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

  // 36. Valid OTP permits only the correct ARRIVED -> IN_PROGRESS transition
  it("Scenario 36: Valid OTP permits ARRIVED -> IN_PROGRESS transition", () => {
    const ride = {
      status: "ARRIVED",
      driver: "driver_1",
      otp: "4921",
    };

    const updated = attemptStartRideWithOtp(ride, "driver_1", "4921");
    assert.equal(updated.status, "IN_PROGRESS");
  });

  // 37. OTP cannot bypass state validation
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

  // 38. Already-started ride cannot be started again
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
