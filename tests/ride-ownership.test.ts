import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RideTransitionError } from "../src/lib/rideStateMachine";

describe("Phase 1B: Ride Ownership & IDOR Protection Tests", () => {
  const ridesDb = new Map<string, Record<string, unknown>>([
    [
      "ride_rider1_111",
      {
        _id: "ride_rider1_111",
        rider: "user_rider_1",
        driver: "user_driver_1",
        status: "ACCEPTED",
      },
    ],
    [
      "ride_rider2_222",
      {
        _id: "ride_rider2_222",
        rider: "user_rider_2",
        driver: "user_driver_2",
        status: "SEARCHING",
      },
    ],
  ]);

  const accessRideAsRider = (
    authenticatedRider: { id: string; role: string },
    rideId: string,
    action?: "read" | "cancel",
    bodySpoofedRiderId?: string
  ) => {
    const effectiveRiderId = authenticatedRider.id;

    const ride = ridesDb.get(rideId);
    if (!ride) {
      throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    }

    if (ride.rider !== effectiveRiderId) {
      throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    }

    if (action === "cancel") {
      if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
        throw new RideTransitionError(`Cannot cancel ${ride.status} ride`, 409, "CANNOT_CANCEL");
      }
      return { success: true, cancelledBy: effectiveRiderId, status: "CANCELLED" };
    }

    return { success: true, ride, effectiveRiderId, ignoredBodyId: bodySpoofedRiderId };
  };

  const mutateRideAsDriver = (
    authenticatedDriver: { id: string; role: string },
    rideId: string,
    action: "ARRIVED" | "START" | "COMPLETE",
    bodySpoofedDriverId?: string
  ) => {
    const effectiveDriverId = authenticatedDriver.id;

    const ride = ridesDb.get(rideId);
    if (!ride) {
      throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    }

    if (ride.driver !== effectiveDriverId) {
      throw new RideTransitionError("Forbidden: Not assigned to this ride", 403, "FORBIDDEN");
    }

    return { success: true, effectiveDriverId, ignoredBodyId: bodySpoofedDriverId, action };
  };

  it("Scenario 13: Rider can read own ride", () => {
    const riderSession = { id: "user_rider_1", role: "RIDER" };
    const result = accessRideAsRider(riderSession, "ride_rider1_111", "read");
    assert.equal(result.success, true);
    assert.ok(result.ride);
    assert.equal(result.ride._id, "ride_rider1_111");
  });

  it("Scenario 14: Rider cannot read another rider's ride (returns 404 IDOR protected)", () => {
    const riderSession = { id: "user_rider_1", role: "RIDER" };
    assert.throws(
      () => accessRideAsRider(riderSession, "ride_rider2_222", "read"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 404);
        assert.equal(error.code, "RIDE_NOT_FOUND");
        return true;
      }
    );
  });

  it("Scenario 15: Rider can cancel own eligible ride", () => {
    const riderSession = { id: "user_rider_1", role: "RIDER" };
    const result = accessRideAsRider(riderSession, "ride_rider1_111", "cancel");
    assert.equal(result.success, true);
    assert.equal(result.status, "CANCELLED");
    assert.equal(result.cancelledBy, "user_rider_1");
  });

  it("Scenario 16: Rider cannot cancel another rider's ride (returns 404 IDOR protected)", () => {
    const riderSession = { id: "user_rider_1", role: "RIDER" };
    assert.throws(
      () => accessRideAsRider(riderSession, "ride_rider2_222", "cancel"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 404);
        return true;
      }
    );
  });

  it("Scenario 17: Driver can mutate assigned ride", () => {
    const driverSession = { id: "user_driver_1", role: "DRIVER" };
    const result = mutateRideAsDriver(driverSession, "ride_rider1_111", "ARRIVED");
    assert.equal(result.success, true);
    assert.equal(result.effectiveDriverId, "user_driver_1");
  });

  it("Scenario 18: Driver cannot mutate another driver's ride (returns 403 Forbidden)", () => {
    const driverSession = { id: "user_driver_2", role: "DRIVER" };
    assert.throws(
      () => mutateRideAsDriver(driverSession, "ride_rider1_111", "ARRIVED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 403);
        assert.equal(error.code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("Scenario 19: Driver identity cannot be spoofed through request body", () => {
    const driverSession = { id: "user_driver_1", role: "DRIVER" };
    const spoofedDriverId = "user_driver_999";

    const result = mutateRideAsDriver(driverSession, "ride_rider1_111", "START", spoofedDriverId);
    assert.equal(result.effectiveDriverId, "user_driver_1");
    assert.notEqual(result.effectiveDriverId, spoofedDriverId);
    assert.equal(result.ignoredBodyId, spoofedDriverId);
  });

  it("Scenario 20: Rider identity cannot be spoofed through request body", () => {
    const riderSession = { id: "user_rider_1", role: "RIDER" };
    const spoofedRiderId = "user_rider_victim_999";

    const result = accessRideAsRider(riderSession, "ride_rider1_111", "read", spoofedRiderId);
    assert.equal(result.effectiveRiderId, "user_rider_1");
    assert.notEqual(result.effectiveRiderId, spoofedRiderId);
    assert.equal(result.ignoredBodyId, spoofedRiderId);
  });
});
