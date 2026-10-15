import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { RideTransitionError } from "../src/lib/rideStateMachine";

class AtomicDispatchEngine {
  private rides = new Map<string, any>();
  private users = new Map<string, any>();
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

  public async atomicFindOneAndUpdateRide(
    id: string,
    filter: (doc: any) => boolean,
    updater: (doc: any) => any
  ): Promise<any | null> {
    const release = await this.acquireDocLock(id);
    try {
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3)));
      const current = this.rides.get(id);
      if (!current || !filter(current)) {
        return null;
      }
      const updated = updater(current);
      this.rides.set(id, updated);
      return updated;
    } finally {
      release();
    }
  }

  public async atomicFindOneAndUpdateUser(
    id: string,
    filter: (doc: any) => boolean,
    updater: (doc: any) => any
  ): Promise<any | null> {
    const release = await this.acquireDocLock(id);
    try {
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3)));
      const current = this.users.get(id);
      if (!current || !filter(current)) {
        return null;
      }
      const updated = updater(current);
      this.users.set(id, updated);
      return updated;
    } finally {
      release();
    }
  }

  public async assignOffer(rideId: string, driverId: string, now: Date, ttlSeconds: number = 25) {
    const offerId = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    return this.atomicFindOneAndUpdateRide(
      rideId,
      (r) => r.status === "SEARCHING" && r.currentOffer === null && r.dispatchStatus !== "EXHAUSTED",
      (r) => ({
        ...r,
        currentOffer: {
          offerId,
          driverId,
          offeredAt: now,
          expiresAt,
        },
        dispatchStatus: "OFFERED",
        dispatchAttempts: (r.dispatchAttempts || 0) + 1,
      })
    );
  }

  public async acceptOffer(
    rideId: string,
    driverId: string,
    offerId?: string,
    atTime: Date = new Date()
  ) {
    const ride = this.rides.get(rideId);
    if (!ride) throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");

    if (ride.currentOffer) {
      if (ride.currentOffer.driverId !== driverId) {
        throw new RideTransitionError("This ride offer was dispatched to another driver", 403, "OFFER_MISMATCH");
      }
      if (offerId && ride.currentOffer.offerId !== offerId) {
        throw new RideTransitionError("Stale offer identifier", 409, "STALE_OFFER_ID");
      }
      if (ride.currentOffer.expiresAt && new Date(ride.currentOffer.expiresAt) < atTime) {
        throw new RideTransitionError("Ride offer has expired", 409, "OFFER_EXPIRED");
      }
    }

    const reservedDriver = await this.atomicFindOneAndUpdateUser(
      driverId,
      (u) => u.isOnline === true && (u.dutyState === "ONLINE_SEARCHING" || u.dutyState === "DISPATCH_ALERT"),
      (u) => ({ ...u, dutyState: "ON_TRIP" })
    );

    if (!reservedDriver) {
      const isAlreadyOnThisRide = ride.driver === driverId && ride.status === "ACCEPTED";
      if (isAlreadyOnThisRide) return ride;
      throw new RideTransitionError("Driver already has an active ride in progress", 409, "DRIVER_OCCUPIED");
    }

    const updatedRide = await this.atomicFindOneAndUpdateRide(
      rideId,
      (r) =>
        r.status === "SEARCHING" &&
        r.driver === null &&
        (r.currentOffer === null || r.currentOffer.driverId === driverId),
      (r) => ({
        ...r,
        status: "ACCEPTED",
        driver: driverId,
        currentOffer: null,
        dispatchStatus: "ASSIGNED",
        acceptedAt: atTime,
      })
    );

    if (updatedRide) {
      return updatedRide;
    }

    await this.atomicFindOneAndUpdateUser(
      driverId,
      (u) => u.dutyState === "ON_TRIP",
      (u) => ({ ...u, dutyState: "ONLINE_SEARCHING" })
    );

    throw new RideTransitionError("Ride has already been accepted by another driver", 409, "RIDE_ALREADY_ACCEPTED");
  }

  public async rejectOffer(rideId: string, driverId: string, offerId?: string, maxAttempts: number = 8) {
    const ride = this.rides.get(rideId);
    if (!ride) throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");

    if (ride.status !== "SEARCHING") {
      return { rejected: false, ride };
    }

    if (ride.currentOffer) {
      if (ride.currentOffer.driverId !== driverId) {
        throw new RideTransitionError("Cannot reject an offer assigned to another driver", 403, "OFFER_MISMATCH");
      }
      if (offerId && ride.currentOffer.offerId !== offerId) {
        throw new RideTransitionError("Stale offer identifier", 409, "STALE_OFFER_ID");
      }
    }

    const updated = await this.atomicFindOneAndUpdateRide(
      rideId,
      (r) => r.status === "SEARCHING" && (r.currentOffer === null || r.currentOffer.driverId === driverId),
      (r) => {
        const rejected = Array.from(new Set([...(r.rejectedDrivers || []), driverId]));
        const isExhausted = (r.dispatchAttempts || 0) >= maxAttempts;
        return {
          ...r,
          currentOffer: null,
          rejectedDrivers: rejected,
          dispatchStatus: isExhausted ? "EXHAUSTED" : "DISPATCHING",
        };
      }
    );

    return { rejected: true, ride: updated || ride };
  }

  public async sweepExpired(now: Date, maxAttempts: number = 8) {
    let sweptCount = 0;
    for (const [rideId, ride] of this.rides.entries()) {
      if (
        ride.status === "SEARCHING" &&
        ride.currentOffer &&
        new Date(ride.currentOffer.expiresAt) < now
      ) {
        const expiredOfferId = ride.currentOffer.offerId;
        const expiredDriverId = ride.currentOffer.driverId;

        const updated = await this.atomicFindOneAndUpdateRide(
          rideId,
          (r) => r.status === "SEARCHING" && r.currentOffer?.offerId === expiredOfferId,
          (r) => {
            const rejected = Array.from(new Set([...(r.rejectedDrivers || []), expiredDriverId]));
            const isExhausted = (r.dispatchAttempts || 0) >= maxAttempts;
            return {
              ...r,
              currentOffer: null,
              rejectedDrivers: rejected,
              dispatchStatus: isExhausted ? "EXHAUSTED" : "DISPATCHING",
            };
          }
        );

        if (updated) sweptCount++;
      }
    }
    return sweptCount;
  }
}

describe("Phase 1D: Targeted Offer Lifecycle, Exclusivity & Expiration Tests", () => {
  let engine: AtomicDispatchEngine;
  const baseTime = new Date("2026-10-09T12:00:00.000Z");

  beforeEach(() => {
    engine = new AtomicDispatchEngine();
    engine.setUser("driver_A", { isOnline: true, dutyState: "ONLINE_SEARCHING" });
    engine.setUser("driver_B", { isOnline: true, dutyState: "ONLINE_SEARCHING" });
    engine.setUser("driver_C", { isOnline: true, dutyState: "ONLINE_SEARCHING" });

    engine.setRide("ride_1", {
      status: "SEARCHING",
      driver: null,
      currentOffer: null,
      rejectedDrivers: [],
      dispatchAttempts: 0,
      dispatchStatus: "SEARCHING",
    });
  });

  it("Assigns targeted offer to single designated driver atomically", async () => {
    const updated = await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    assert.ok(updated);
    assert.equal(updated.currentOffer.driverId, "driver_A");
    assert.equal(updated.dispatchStatus, "OFFERED");
    assert.equal(updated.dispatchAttempts, 1);
  });

  it("Two concurrent polls cannot create two different offers for the same ride", async () => {
    const [resA, resB] = await Promise.all([
      engine.assignOffer("ride_1", "driver_A", baseTime, 25),
      engine.assignOffer("ride_1", "driver_B", baseTime, 25),
    ]);

    const successCount = [resA, resB].filter((r) => r !== null).length;
    assert.equal(successCount, 1);
  });

  it("Targeted driver can accept their active offer", async () => {
    const assigned = await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    const offerId = assigned.currentOffer.offerId;

    const accepted = await engine.acceptOffer("ride_1", "driver_A", offerId, baseTime);
    assert.equal(accepted.status, "ACCEPTED");
    assert.equal(accepted.driver, "driver_A");
    assert.equal(accepted.currentOffer, null);
    assert.equal(accepted.dispatchStatus, "ASSIGNED");
    assert.equal(engine.getUser("driver_A").dutyState, "ON_TRIP");
  });

  it("Another driver cannot accept an offer targeted to someone else", async () => {
    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);

    await assert.rejects(
      () => engine.acceptOffer("ride_1", "driver_B", undefined, baseTime),
      (err: any) => {
        assert.equal(err.code, "OFFER_MISMATCH");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  it("Acceptance fails if the offer has expired according to server time", async () => {
    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    const expiredTime = new Date(baseTime.getTime() + 26 * 1000);

    await assert.rejects(
      () => engine.acceptOffer("ride_1", "driver_A", undefined, expiredTime),
      (err: any) => {
        assert.equal(err.code, "OFFER_EXPIRED");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  it("Acceptance fails if stale offerId is supplied", async () => {
    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);

    await assert.rejects(
      () => engine.acceptOffer("ride_1", "driver_A", "stale_uuid_1234", baseTime),
      (err: any) => {
        assert.equal(err.code, "STALE_OFFER_ID");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  it("Active ride exclusivity: Driver cannot simultaneously accept two different rides", async () => {
    engine.setRide("ride_2", {
      status: "SEARCHING",
      driver: null,
      currentOffer: null,
      rejectedDrivers: [],
      dispatchAttempts: 0,
    });

    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    await engine.assignOffer("ride_2", "driver_A", baseTime, 25);

    const results = await Promise.allSettled([
      engine.acceptOffer("ride_1", "driver_A", undefined, baseTime),
      engine.acceptOffer("ride_2", "driver_A", undefined, baseTime),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Exactly one ride can be accepted by driver");
    assert.equal(rejected.length, 1, "Second ride must be rejected with DRIVER_OCCUPIED");
    assert.equal((rejected[0] as PromiseRejectedResult).reason.code, "DRIVER_OCCUPIED");
  });

  it("Rejection moves driver to rejectedDrivers, clears currentOffer, and allows fallback", async () => {
    const assigned = await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    const offerId = assigned.currentOffer.offerId;

    const res = await engine.rejectOffer("ride_1", "driver_A", offerId);
    assert.equal(res.rejected, true);
    assert.equal(res.ride.currentOffer, null);
    assert.deepEqual(res.ride.rejectedDrivers, ["driver_A"]);
    assert.equal(res.ride.dispatchStatus, "DISPATCHING");

    const nextAssigned = await engine.assignOffer("ride_1", "driver_B", baseTime, 25);
    assert.ok(nextAssigned);
    assert.equal(nextAssigned.currentOffer.driverId, "driver_B");
  });

  it("Rejection by another driver is blocked with OFFER_MISMATCH", async () => {
    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);

    await assert.rejects(
      () => engine.rejectOffer("ride_1", "driver_B"),
      (err: any) => {
        assert.equal(err.code, "OFFER_MISMATCH");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  it("Expired offer sweep moves driver to rejectedDrivers and clears offer", async () => {
    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    const sweptTime = new Date(baseTime.getTime() + 30 * 1000);

    const sweptCount = await engine.sweepExpired(sweptTime);
    assert.equal(sweptCount, 1);

    const ride = engine.getRide("ride_1");
    assert.equal(ride.currentOffer, null);
    assert.deepEqual(ride.rejectedDrivers, ["driver_A"]);
  });

  it("Concurrent sweeps do not advance or duplicate candidate skips", async () => {
    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    const sweptTime = new Date(baseTime.getTime() + 30 * 1000);

    const [sweep1, sweep2] = await Promise.all([
      engine.sweepExpired(sweptTime),
      engine.sweepExpired(sweptTime),
    ]);

    assert.equal(sweep1 + sweep2, 1);
    const ride = engine.getRide("ride_1");
    assert.equal(ride.rejectedDrivers.length, 1);
  });

  it("Exhausting 8 attempts marks ride dispatchStatus as EXHAUSTED", async () => {
    const currentRide = engine.getRide("ride_1");
    currentRide.dispatchAttempts = 7;
    engine.setRide("ride_1", currentRide);

    await engine.assignOffer("ride_1", "driver_A", baseTime, 25);
    const res = await engine.rejectOffer("ride_1", "driver_A", undefined, 8);

    assert.equal(res.ride.dispatchStatus, "EXHAUSTED");
    assert.equal(res.ride.status, "SEARCHING");
  });
});
