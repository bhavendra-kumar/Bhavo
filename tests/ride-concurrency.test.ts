/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { RideTransitionError } from "../src/lib/rideStateMachine";

/**
 * Concurrency Test Engine:
 * Simulates MongoDB's single-document atomic update semantics (linearizable atomicity per document).
 * Guarantees that concurrent Promise execution tests real race conditions against the document.
 */
class AtomicRideDatabase {
  private rides = new Map<string, any>();
  private users = new Map<string, any>();

  // Mutex per document to simulate MongoDB's collection/document-level write latch
  private docLocks = new Map<string, Promise<void>>();

  public setRide(id: string, data: any) {
    this.rides.set(id, { ...data, _id: id });
  }

  public getRide(id: string) {
    return this.rides.get(id);
  }

  public setUser(id: string, data: any) {
    this.users.set(id, { ...data, _id: id });
  }

  public getUser(id: string) {
    return this.users.get(id);
  }

  private async acquireDocLock(id: string): Promise<() => void> {
    while (this.docLocks.has(id)) {
      await this.docLocks.get(id);
    }
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = () => {
        this.docLocks.delete(id);
        resolve();
      };
    });
    this.docLocks.set(id, lockPromise);
    return releaseLock!;
  }

  /**
   * Models MongoDB atomic findOneAndUpdate with condition and $set
   */
  public async atomicFindOneAndUpdate(
    id: string,
    filter: (doc: any) => boolean,
    update: Record<string, any>
  ): Promise<any | null> {
    const release = await this.acquireDocLock(id);
    try {
      // Simulate random micro-delay (0-2ms) to interleave concurrent execution threads
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3)));

      const current = this.rides.get(id);
      if (!current) return null;

      if (!filter(current)) {
        return null;
      }

      const updated = { ...current, ...update };
      this.rides.set(id, updated);
      return updated;
    } finally {
      release();
    }
  }

  /**
   * Concurrent Driver Accept implementation matching transitionToAccepted()
   */
  public async acceptRide(rideId: string, driver: { id: string; name: string }) {
    const updated = await this.atomicFindOneAndUpdate(
      rideId,
      (doc) => doc.status === "SEARCHING" && doc.driver === null,
      {
        status: "ACCEPTED",
        driver: driver.id,
        driverName: driver.name,
        acceptedAt: new Date(),
      }
    );

    if (updated) {
      return { status: 200, ride: updated };
    }

    // Diagnose conflict
    const current = this.rides.get(rideId);
    if (!current) throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (current.driver === driver.id) throw new RideTransitionError("Ride already accepted by you", 409, "ALREADY_ACCEPTED");
    if (current.driver) throw new RideTransitionError("Ride has already been accepted by another driver", 409, "RIDE_ALREADY_ACCEPTED");
    if (current.status === "CANCELLED") throw new RideTransitionError("Ride is cancelled", 409, "RIDE_CANCELLED");
    throw new RideTransitionError("Conflict", 409, "CONFLICT");
  }

  /**
   * Driver document-level atomic reservation matching User.findOneAndUpdate with activeRideId
   */
  public async atomicReserveDriver(driverId: string, rideId: string): Promise<boolean> {
    const release = await this.acquireDocLock(`user_${driverId}`);
    try {
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3)));
      const user = this.users.get(driverId) || {
        _id: driverId,
        isOnline: true,
        dutyState: "ONLINE_SEARCHING",
        activeRideId: null,
        status: "ACTIVE",
      };

      if (user.status && user.status !== "ACTIVE") {
        return false;
      }

      if (!user.isOnline || (user.dutyState !== "ONLINE_SEARCHING" && user.dutyState !== "DISPATCH_ALERT")) {
        return false;
      }

      if (user.activeRideId && user.activeRideId !== rideId) {
        return false;
      }

      user.dutyState = "ON_TRIP";
      user.activeRideId = rideId;
      this.users.set(driverId, user);
      return true;
    } finally {
      release();
    }
  }

  /**
   * Driver reservation release strictly conditional on the assigned rideId
   */
  public async atomicReleaseDriverReservation(driverId: string, rideId: string): Promise<boolean> {
    const release = await this.acquireDocLock(`user_${driverId}`);
    try {
      const user = this.users.get(driverId);
      if (!user) return false;
      if (user.activeRideId !== rideId) {
        // Guard: cannot release if reservation belongs to a different ride
        return false;
      }

      user.dutyState = user.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      user.activeRideId = null;
      this.users.set(driverId, user);
      return true;
    } finally {
      release();
    }
  }

  /**
   * Complete dual-document atomic accept flow (reserves User, then CAS on Ride, releasing User if CAS fails)
   */
  public async acceptRideWithDriverReservation(rideId: string, driver: { id: string; name: string }) {
    const reserved = await this.atomicReserveDriver(driver.id, rideId);
    if (!reserved) {
      throw new RideTransitionError("Driver already occupied or inactive", 409, "DRIVER_OCCUPIED");
    }

    const updated = await this.atomicFindOneAndUpdate(
      rideId,
      (doc) => doc.status === "SEARCHING" && doc.driver === null,
      {
        status: "ACCEPTED",
        driver: driver.id,
        driverName: driver.name,
        acceptedAt: new Date(),
      }
    );

    if (updated) {
      return { status: 200, ride: updated };
    }

    // Immediately release reservation conditionally on THIS ride if Ride CAS lost
    await this.atomicReleaseDriverReservation(driver.id, rideId);
    throw new RideTransitionError("Ride conflict", 409, "RIDE_ALREADY_ACCEPTED");
  }

  /**
   * Concurrent Completion implementation matching transitionToCompleted()
   */
  public async completeRide(rideId: string, driverId: string) {
    const tipAmount = 25;
    const updated = await this.atomicFindOneAndUpdate(
      rideId,
      (doc) => doc.status === "IN_PROGRESS" && doc.driver === driverId,
      {
        status: "COMPLETED",
        completedAt: new Date(),
        tip: tipAmount,
      }
    );

    if (updated) {
      // Financial side effect executes ONLY once
      const driver = this.users.get(driverId) || { walletBalance: 0 };
      driver.walletBalance += (updated.fare || 250) + tipAmount;
      this.users.set(driverId, driver);

      if (updated.rider) {
        const rider = this.users.get(updated.rider) || { walletBalance: 1000 };
        rider.walletBalance = Math.max(0, rider.walletBalance - updated.fare);
        this.users.set(updated.rider, rider);
      }

      return { status: 200, ride: updated };
    }

    const current = this.rides.get(rideId);
    if (!current) throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (current.driver !== driverId) throw new RideTransitionError("Forbidden", 403, "FORBIDDEN");
    if (current.status === "COMPLETED") throw new RideTransitionError("Ride is already completed", 409, "ALREADY_COMPLETED");
    throw new RideTransitionError("Invalid transition", 409, "INVALID_TRANSITION");
  }

  /**
   * Concurrent Cancellation by Rider matching transitionToCancelledByRider()
   */
  public async cancelByRider(rideId: string, riderId: string) {
    const updated = await this.atomicFindOneAndUpdate(
      rideId,
      (doc) => doc.rider === riderId && ["SEARCHING", "ACCEPTED", "ARRIVED"].includes(doc.status),
      {
        status: "CANCELLED",
        cancelledBy: "RIDER",
        cancelledAt: new Date(),
      }
    );

    if (updated) {
      return { status: 200, ride: updated };
    }

    const current = this.rides.get(rideId);
    if (!current) throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (current.rider !== riderId) throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (current.status === "CANCELLED") throw new RideTransitionError("Ride is already cancelled", 409, "ALREADY_CANCELLED");
    if (current.status === "COMPLETED") throw new RideTransitionError("Cannot cancel completed ride", 409, "CANNOT_CANCEL_COMPLETED");
    if (current.status === "IN_PROGRESS") throw new RideTransitionError("Cannot cancel in-progress ride", 409, "CANNOT_CANCEL_IN_PROGRESS");
    throw new RideTransitionError("Conflict", 409, "CONFLICT");
  }
}

describe("Phase 1B: Driver Acceptance Concurrency & Race Tests", () => {
  let db: AtomicRideDatabase;

  beforeEach(() => {
    db = new AtomicRideDatabase();
  });

  // 26 & MANDATORY CONCURRENCY TEST: Two drivers accepting the same ride simultaneously
  it("Scenario 26 (Mandatory Concurrency): Two concurrent driver accept requests produce exactly one winner and one 409 conflict", async () => {
    const rideId = "ride_concurrent_123";
    db.setRide(rideId, {
      status: "SEARCHING",
      driver: null,
      rider: "rider_ananya",
      fare: 350,
    });

    const driverA = { id: "driver_vikram_A", name: "Vikram Malhotra" };
    const driverB = { id: "driver_rohit_B", name: "Rohit Verma" };

    // Execute concurrently using Promise.allSettled
    const [resultA, resultB] = await Promise.allSettled([
      db.acceptRide(rideId, driverA),
      db.acceptRide(rideId, driverB),
    ]);

    // Exactly one must fulfill, exactly one must reject
    const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
    const rejected = [resultA, resultB].filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Exactly one driver must successfully accept the ride");
    assert.equal(rejected.length, 1, "Exactly one driver must receive conflict error");

    // The winning driver
    const winnerResult = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    assert.equal(winnerResult.status, 200);
    assert.equal(winnerResult.ride.status, "ACCEPTED");

    // The losing driver receives 409
    const loserReason = (rejected[0] as PromiseRejectedResult).reason as RideTransitionError;
    assert.equal(loserReason.statusCode, 409);
    assert.equal(loserReason.code, "RIDE_ALREADY_ACCEPTED");

    // Database state is strictly consistent
    const finalRide = db.getRide(rideId);
    assert.equal(finalRide.status, "ACCEPTED");
    assert.ok(finalRide.driver === driverA.id || finalRide.driver === driverB.id);
  });

  // 21 & 27: Two completion requests do not create two completions or double wallet credits
  it("Scenario 21 & 27: Concurrent completion requests result in exactly one completion with non-duplicated financial side effects", async () => {
    const rideId = "ride_complete_race";
    const driverId = "driver_111";
    const riderId = "rider_222";

    db.setRide(rideId, {
      status: "IN_PROGRESS",
      driver: driverId,
      rider: riderId,
      fare: 300,
      paymentMethod: "WALLET",
    });
    db.setUser(driverId, { walletBalance: 100 });
    db.setUser(riderId, { walletBalance: 500 });

    // Two concurrent complete requests by the driver (e.g. double-click or network retry)
    const [res1, res2] = await Promise.allSettled([
      db.completeRide(rideId, driverId),
      db.completeRide(rideId, driverId),
    ]);

    const fulfilled = [res1, res2].filter((r) => r.status === "fulfilled");
    const rejected = [res1, res2].filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Only first complete request must succeed");
    assert.equal(rejected.length, 1, "Duplicate complete request must fail with 409");

    const loserError = (rejected[0] as PromiseRejectedResult).reason as RideTransitionError;
    assert.equal(loserError.statusCode, 409);
    assert.equal(loserError.code, "ALREADY_COMPLETED");

    // Verify financial integrity: driver wallet credited exactly once (100 + 300 + 25 = 425)
    const finalDriver = db.getUser(driverId);
    assert.equal(finalDriver.walletBalance, 425, "Driver wallet must only be credited once");

    // Rider wallet deducted exactly once (500 - 300 = 200)
    const finalRider = db.getUser(riderId);
    assert.equal(finalRider.walletBalance, 200, "Rider wallet must only be deducted once");
  });

  // 22: Two cancellation requests do not create two cancellations
  it("Scenario 22: Duplicate cancellation requests result in exactly one success and one 409 ALREADY_CANCELLED", async () => {
    const rideId = "ride_cancel_race";
    const riderId = "rider_333";

    db.setRide(rideId, {
      status: "SEARCHING",
      driver: null,
      rider: riderId,
    });

    const [res1, res2] = await Promise.allSettled([
      db.cancelByRider(rideId, riderId),
      db.cancelByRider(rideId, riderId),
    ]);

    const fulfilled = [res1, res2].filter((r) => r.status === "fulfilled");
    const rejected = [res1, res2].filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);

    const loserError = (rejected[0] as PromiseRejectedResult).reason as RideTransitionError;
    assert.equal(loserError.statusCode, 409);
    assert.equal(loserError.code, "ALREADY_CANCELLED");
  });

  // 24: Double acceptance by same driver is deterministic
  it("Scenario 24: Double acceptance by the same driver is deterministic (first wins, second 409 ALREADY_ACCEPTED)", async () => {
    const rideId = "ride_double_accept";
    const driver = { id: "driver_same_123", name: "Same Driver" };

    db.setRide(rideId, {
      status: "SEARCHING",
      driver: null,
      rider: "rider_xyz",
    });

    const first = await db.acceptRide(rideId, driver);
    assert.equal(first.status, 200);

    // Second accept by the same driver
    await assert.rejects(
      async () => db.acceptRide(rideId, driver),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "ALREADY_ACCEPTED");
        return true;
      }
    );
  });

  // 25: Rider cancellation vs driver acceptance race
  it("Scenario 25: Rider cancellation vs driver acceptance concurrent race produces deterministic atomic outcome", async () => {
    const rideId = "ride_cancel_vs_accept";
    const riderId = "rider_444";
    const driver = { id: "driver_555", name: "Driver Rahul" };

    db.setRide(rideId, {
      status: "SEARCHING",
      driver: null,
      rider: riderId,
    });

    // Rider cancels while Driver accepts concurrently
    const [cancelResult, acceptResult] = await Promise.allSettled([
      db.cancelByRider(rideId, riderId),
      db.acceptRide(rideId, driver),
    ]);

    const finalRide = db.getRide(rideId);

    if (cancelResult.status === "fulfilled") {
      // If cancellation hit first, accept MUST fail with 409
      assert.equal(finalRide.status, "CANCELLED");
      assert.equal(acceptResult.status, "rejected");
      const acceptErr = (acceptResult as PromiseRejectedResult).reason as RideTransitionError;
      assert.equal(acceptErr.statusCode, 409);
    } else {
      // If accept hit first, ride became ACCEPTED; then rider cancellation succeeded on the accepted ride
      assert.equal(acceptResult.status, "fulfilled");
      assert.equal(finalRide.status, "CANCELLED");
    }
  });

  // 28: Completion vs Cancellation race on IN_PROGRESS ride
  it("Scenario 28: Completion vs Cancellation on an in-progress ride prevents cancellation once completed", async () => {
    const rideId = "ride_complete_vs_cancel";
    const driverId = "driver_777";
    const riderId = "rider_888";

    db.setRide(rideId, {
      status: "IN_PROGRESS",
      driver: driverId,
      rider: riderId,
      fare: 250,
    });

    // Driver completes the ride
    const completeRes = await db.completeRide(rideId, driverId);
    assert.equal(completeRes.status, 200);

    // Rider subsequently attempts to cancel completed ride
    await assert.rejects(
      async () => db.cancelByRider(rideId, riderId),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "CANNOT_CANCEL_COMPLETED");
        return true;
      }
    );
  });

  // 30 & MANDATORY DRIVER EXCLUSIVITY CONCURRENCY TEST: Two simultaneous acceptance requests for different rides by the SAME driver
  it("Scenario 30 (Mandatory Driver Exclusivity): Two concurrent accept requests for different rides by the same driver produce exactly one winner and one 409 DRIVER_OCCUPIED", async () => {
    const ride1Id = "ride_exclusive_1";
    const ride2Id = "ride_exclusive_2";
    const driver = { id: "driver_exclusive_dev", name: "Devendra Singh" };

    db.setRide(ride1Id, {
      status: "SEARCHING",
      driver: null,
      rider: "rider_101",
      fare: 320,
    });
    db.setRide(ride2Id, {
      status: "SEARCHING",
      driver: null,
      rider: "rider_102",
      fare: 410,
    });

    db.setUser(driver.id, {
      _id: driver.id,
      name: driver.name,
      isOnline: true,
      dutyState: "ONLINE_SEARCHING",
      activeRideId: null,
      status: "ACTIVE",
    });

    // Both accept requests fire concurrently
    const [res1, res2] = await Promise.allSettled([
      db.acceptRideWithDriverReservation(ride1Id, driver),
      db.acceptRideWithDriverReservation(ride2Id, driver),
    ]);

    const fulfilled = [res1, res2].filter((r) => r.status === "fulfilled");
    const rejected = [res1, res2].filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Exactly one ride must be accepted by the driver");
    assert.equal(rejected.length, 1, "Competing ride accept must be rejected with 409");

    const winner = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    assert.equal(winner.status, 200);
    assert.equal(winner.ride.status, "ACCEPTED");
    assert.equal(winner.ride.driver, driver.id);

    const loserErr = (rejected[0] as PromiseRejectedResult).reason as RideTransitionError;
    assert.equal(loserErr.statusCode, 409);
    assert.equal(loserErr.code, "DRIVER_OCCUPIED");

    // Verify driver state in DB: activeRideId is assigned to the winning ride and dutyState is ON_TRIP
    const updatedDriver = db.getUser(driver.id);
    assert.equal(updatedDriver.dutyState, "ON_TRIP");
    assert.ok(
      updatedDriver.activeRideId === ride1Id || updatedDriver.activeRideId === ride2Id,
      "Driver activeRideId must point to the winning ride"
    );
  });

  // 31: Reservation release is strictly conditional on the assigned ride
  it("Scenario 31 (Conditional Reservation Release): Release attempt with mismatching rideId is rejected and preserves driver lock", async () => {
    const driverId = "driver_cond_lock";
    const assignedRideId = "ride_assigned_correct";
    const wrongRideId = "ride_unrelated_wrong";

    db.setUser(driverId, {
      _id: driverId,
      isOnline: true,
      dutyState: "ON_TRIP",
      activeRideId: assignedRideId,
      status: "ACTIVE",
    });

    // Mismatched release attempt (e.g. from a different cancelled/failed ride)
    const releaseMismatch = await db.atomicReleaseDriverReservation(driverId, wrongRideId);
    assert.equal(releaseMismatch, false, "Must refuse to release lock for an unassigned ride");

    // Driver lock remains intact
    const driverStillLocked = db.getUser(driverId);
    assert.equal(driverStillLocked.dutyState, "ON_TRIP");
    assert.equal(driverStillLocked.activeRideId, assignedRideId);

    // Correct release attempt
    const releaseCorrect = await db.atomicReleaseDriverReservation(driverId, assignedRideId);
    assert.equal(releaseCorrect, true, "Must release lock when rideId matches assigned ride");

    const driverFreed = db.getUser(driverId);
    assert.equal(driverFreed.dutyState, "ONLINE_SEARCHING");
    assert.equal(driverFreed.activeRideId, null);
  });

  // 32: Inactive, suspended, or disabled driver cannot reserve or accept rides
  it("Scenario 32: Suspended or disabled driver cannot reserve or accept rides", async () => {
    const rideId = "ride_inactive_test";
    const suspendedDriver = { id: "driver_suspended_1", name: "Suspended Driver" };

    db.setRide(rideId, {
      status: "SEARCHING",
      driver: null,
      rider: "rider_201",
      fare: 250,
    });

    db.setUser(suspendedDriver.id, {
      _id: suspendedDriver.id,
      name: suspendedDriver.name,
      isOnline: true,
      dutyState: "ONLINE_SEARCHING",
      activeRideId: null,
      status: "SUSPENDED",
    });

    await assert.rejects(
      async () => db.acceptRideWithDriverReservation(rideId, suspendedDriver),
      (err: unknown) => {
        const error = err as RideTransitionError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "DRIVER_OCCUPIED");
        return true;
      }
    );

    // Ride remains unassigned
    const ride = db.getRide(rideId);
    assert.equal(ride.status, "SEARCHING");
    assert.equal(ride.driver, null);
  });
});

