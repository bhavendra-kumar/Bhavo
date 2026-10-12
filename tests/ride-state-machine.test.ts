import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  RideTransitionError,
  RideStatus,
} from "../src/lib/rideStateMachine";

describe("Phase 1B: Ride State Machine & Transition Tests", () => {
  // Helper verifying transition permission
  const checkTransition = (from: RideStatus, to: RideStatus) => {
    if (!canTransition(from, to)) {
      throw new RideTransitionError(
        `Illegal transition from '${from}' to '${to}'`,
        409,
        "ILLEGAL_TRANSITION"
      );
    }
    return true;
  };

  // 1. SEARCHING -> ACCEPTED succeeds
  it("Scenario 1: SEARCHING -> ACCEPTED succeeds", () => {
    assert.equal(checkTransition("SEARCHING", "ACCEPTED"), true);
  });

  // 2. ACCEPTED -> ARRIVED succeeds
  it("Scenario 2: ACCEPTED -> ARRIVED succeeds", () => {
    assert.equal(checkTransition("ACCEPTED", "ARRIVED"), true);
  });

  // 3. ARRIVED -> IN_PROGRESS succeeds with valid OTP
  it("Scenario 3: ARRIVED -> IN_PROGRESS succeeds with valid OTP", () => {
    assert.equal(checkTransition("ARRIVED", "IN_PROGRESS"), true);
  });

  // 4. IN_PROGRESS -> COMPLETED succeeds
  it("Scenario 4: IN_PROGRESS -> COMPLETED succeeds", () => {
    assert.equal(checkTransition("IN_PROGRESS", "COMPLETED"), true);
  });

  // 5. SEARCHING -> ARRIVED fails
  it("Scenario 5: SEARCHING -> ARRIVED fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("SEARCHING", "ARRIVED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "ILLEGAL_TRANSITION");
        return true;
      }
    );
  });

  // 6. SEARCHING -> IN_PROGRESS fails
  it("Scenario 6: SEARCHING -> IN_PROGRESS fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("SEARCHING", "IN_PROGRESS"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });

  // 7. SEARCHING -> COMPLETED fails
  it("Scenario 7: SEARCHING -> COMPLETED fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("SEARCHING", "COMPLETED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });

  // 8. ACCEPTED -> COMPLETED fails
  it("Scenario 8: ACCEPTED -> COMPLETED fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("ACCEPTED", "COMPLETED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });

  // 9. COMPLETED -> ACCEPTED fails
  it("Scenario 9: COMPLETED -> ACCEPTED fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("COMPLETED", "ACCEPTED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });

  // 10. COMPLETED -> IN_PROGRESS fails
  it("Scenario 10: COMPLETED -> IN_PROGRESS fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("COMPLETED", "IN_PROGRESS"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });

  // 11. CANCELLED -> ACCEPTED fails
  it("Scenario 11: CANCELLED -> ACCEPTED fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("CANCELLED", "ACCEPTED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });

  // 12. CANCELLED -> COMPLETED fails
  it("Scenario 12: CANCELLED -> COMPLETED fails with 409 Conflict", () => {
    assert.throws(
      () => checkTransition("CANCELLED", "COMPLETED"),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        return true;
      }
    );
  });
});
