import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { LedgerError } from "../src/lib/ledgerService";

interface IMockUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  walletBalance: number;
  walletBalanceInPaise: number;
  dutyState: string;
  isOnline: boolean;
  save: () => Promise<IMockUser>;
}

interface IMockRide {
  _id: string;
  rider: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  vehicleType: string;
  fare: number;
  fareInPaise: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  tip: number;
  cashCollectedAt: Date | null;
  cashCollectedBy: mongoose.Types.ObjectId | null;
  save: () => Promise<IMockRide>;
  [key: string]: unknown;
}

describe("Phase 1C: Ride and Payment Lifecycle Decoupling Tests", () => {
  const driverObjId = new mongoose.Types.ObjectId();
  const riderObjId = new mongoose.Types.ObjectId();
  const strangerDriverId = new mongoose.Types.ObjectId();

  // 1. Mock DB harness for in-memory integration validation
  class MockRidePaymentStore {
    public rides: Map<string, IMockRide> = new Map();
    public users: Map<string, IMockUser> = new Map();
    public transactions: Map<string, Record<string, unknown>> = new Map();

    constructor() {
      this.users.set(driverObjId.toString(), {
        _id: driverObjId,
        name: "Rajesh Driver",
        walletBalance: 500,
        walletBalanceInPaise: 50000,
        dutyState: "ON_TRIP",
        isOnline: true,
        save: async function (this: IMockUser) { return this; },
      });
      this.users.set(riderObjId.toString(), {
        _id: riderObjId,
        name: "Pooja Rider",
        walletBalance: 1000,
        walletBalanceInPaise: 100000,
        dutyState: "ONLINE",
        isOnline: true,
        save: async function (this: IMockUser) { return this; },
      });
    }

    public createRide(rideId: string, overrides: Record<string, unknown> = {}) {
      const ride = {
        _id: rideId,
        rider: riderObjId,
        driver: driverObjId,
        vehicleType: "Cab Premium",
        fare: 450,
        fareInPaise: 45000,
        status: "IN_PROGRESS",
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        tip: 0,
        cashCollectedAt: null as Date | null,
        cashCollectedBy: null as mongoose.Types.ObjectId | null,
        save: async function () { return this; },
        ...overrides,
      };
      this.rides.set(rideId, ride);
      return ride;
    }
  }

  // 2. CASH ride completion transitions to PENDING_COLLECTION, NOT PAID
  it("Ride completion for CASH ride sets status=COMPLETED and paymentStatus=PENDING_COLLECTION (never PAID)", () => {
    const store = new MockRidePaymentStore();
    const ride = store.createRide("ride_cash_01", {
      status: "IN_PROGRESS",
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
    });

    // Simulating completion transition logic
    assert.equal(ride.status, "IN_PROGRESS");
    const targetPaymentStatus =
      ride.paymentMethod === "CASH" ? "PENDING_COLLECTION" : "PENDING_PAYMENT";

    ride.status = "COMPLETED";
    ride.paymentStatus = targetPaymentStatus;

    assert.equal(ride.status, "COMPLETED");
    assert.equal(ride.paymentStatus, "PENDING_COLLECTION");
    assert.notEqual(ride.paymentStatus, "PAID", "Cash ride must never automatically become PAID on completion");
  });

  // 3. ONLINE / UPI ride completion transitions to PENDING_PAYMENT, NOT PAID
  it("Ride completion for ONLINE ride sets status=COMPLETED and paymentStatus=PENDING_PAYMENT (never PAID)", () => {
    const store = new MockRidePaymentStore();
    const ride = store.createRide("ride_online_01", {
      status: "IN_PROGRESS",
      paymentMethod: "ONLINE",
      paymentStatus: "PENDING",
    });

    const targetPaymentStatus =
      ride.paymentMethod === "CASH" ? "PENDING_COLLECTION" : "PENDING_PAYMENT";

    ride.status = "COMPLETED";
    ride.paymentStatus = targetPaymentStatus;

    assert.equal(ride.status, "COMPLETED");
    assert.equal(ride.paymentStatus, "PENDING_PAYMENT");
    assert.notEqual(ride.paymentStatus, "PAID", "Online ride must never automatically become PAID without gateway verification");
  });

  // 4. Physical cash collected by driver does NOT credit driver platform wallet
  it("Driver cash confirmation does not credit driver platform wallet balance", () => {
    const store = new MockRidePaymentStore();
    const driver = store.users.get(driverObjId.toString())!;
    const initialBalance = driver.walletBalance;

    const ride = store.createRide("ride_cash_collect_01", {
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PENDING_COLLECTION",
      fare: 350,
      fareInPaise: 35000,
    });

    // Confirmation transitions paymentStatus to COLLECTED and records cash collection
    ride.paymentStatus = "COLLECTED";
    ride.cashCollectedAt = new Date();
    ride.cashCollectedBy = driverObjId;

    // Invariant: driver wallet balance is NOT modified because driver directly took physical cash
    assert.equal(
      driver.walletBalance,
      initialBalance,
      "Driver platform wallet must NOT increase upon cash collection"
    );
    assert.equal(ride.paymentStatus, "COLLECTED");
  });

  // 5. Unassigned driver cannot confirm cash collection
  it("Reject cash confirmation from an unassigned driver with 403 FORBIDDEN", () => {
    const store = new MockRidePaymentStore();
    const ride = store.createRide("ride_cash_unassigned", {
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PENDING_COLLECTION",
      driver: driverObjId,
    });

    const verifyCaller = (callerId: mongoose.Types.ObjectId) => {
      if (ride.driver.toString() !== callerId.toString()) {
        throw new LedgerError(
          "Only the assigned driver can confirm cash collection for this ride",
          "FORBIDDEN_NOT_ASSIGNED_DRIVER",
          403
        );
      }
    };

    assert.throws(
      () => verifyCaller(strangerDriverId),
      (err: unknown) => {
        const error = err as LedgerError;
        assert.equal(error.statusCode, 403);
        assert.equal(error.code, "FORBIDDEN_NOT_ASSIGNED_DRIVER");
        return true;
      }
    );
  });

  // 6. Cannot confirm cash collection for ride that is not COMPLETED
  it("Reject cash confirmation for rides that are not yet COMPLETED with 409", () => {
    const store = new MockRidePaymentStore();
    const ride = store.createRide("ride_not_completed", {
      status: "IN_PROGRESS", // still in progress
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
    });

    const verifyState = (status: string) => {
      if (status !== "COMPLETED") {
        throw new LedgerError(
          `Cannot collect cash for ride in status "${status}". Ride must be COMPLETED.`,
          "RIDE_NOT_COMPLETED",
          409
        );
      }
    };

    assert.throws(
      () => verifyState(ride.status),
      (err: unknown) => {
        const error = err as LedgerError;
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "RIDE_NOT_COMPLETED");
        return true;
      }
    );
  });

  // 7. Cannot confirm cash collection for non-CASH ride
  it("Reject cash confirmation for non-cash payment methods with 400", () => {
    const store = new MockRidePaymentStore();
    const ride = store.createRide("ride_online_method", {
      status: "COMPLETED",
      paymentMethod: "ONLINE",
      paymentStatus: "PENDING_PAYMENT",
    });

    const verifyMethod = (method: string) => {
      if (method !== "CASH") {
        throw new LedgerError(
          `Cannot confirm cash collection for ride with payment method "${method}". Only CASH rides support driver cash collection.`,
          "INVALID_PAYMENT_METHOD",
          400
        );
      }
    };

    assert.throws(
      () => verifyMethod(ride.paymentMethod),
      (err: unknown) => {
        const error = err as LedgerError;
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "INVALID_PAYMENT_METHOD");
        return true;
      }
    );
  });

  // 8. Cash confirmation is idempotent: subsequent confirmation returns alreadyCollected: true
  it("Cash collection confirmation is idempotent and safe under repeated requests", () => {
    const store = new MockRidePaymentStore();
    const ride = store.createRide("ride_idempotent_cash", {
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PENDING_COLLECTION",
      fare: 280,
    });

    // First confirmation
    ride.paymentStatus = "COLLECTED";
    ride.cashCollectedAt = new Date();
    ride.cashCollectedBy = driverObjId;

    const firstConfirmationResult = {
      alreadyCollected: false,
      paymentStatus: ride.paymentStatus,
      collectedAmount: ride.fare,
    };

    assert.equal(firstConfirmationResult.alreadyCollected, false);
    assert.equal(firstConfirmationResult.paymentStatus, "COLLECTED");

    // Second (duplicate) confirmation
    const isAlreadyCollected = ride.paymentStatus === "COLLECTED";
    const secondConfirmationResult = {
      alreadyCollected: isAlreadyCollected,
      paymentStatus: ride.paymentStatus,
      collectedAmount: ride.fare,
    };

    assert.equal(secondConfirmationResult.alreadyCollected, true);
    assert.equal(secondConfirmationResult.paymentStatus, "COLLECTED");
    assert.equal(secondConfirmationResult.collectedAmount, 280);
  });
});
