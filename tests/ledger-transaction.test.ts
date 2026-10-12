import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  generateLedgerIdempotencyKey,
  LedgerError,
} from "../src/lib/ledgerService";

interface IMockTx {
  _id: mongoose.Types.ObjectId;
  idempotencyKey: string;
  userId: mongoose.Types.ObjectId;
  userRole: "RIDER" | "DRIVER" | "ADMIN" | "USER";
  type: string;
  direction: string;
  amountInPaise: number;
  currency: "INR";
  entityType: string;
  entityId: string;
  eventType: string;
  sequence: number;
  status: "SETTLED";
  description: string;
  createdAt: Date;
}

describe("Phase 1C: Financial Ledger & Transaction Invariant Tests", () => {
  const testUserId = new mongoose.Types.ObjectId();

  // In-memory Ledger simulator for verifying invariants and concurrency
  class MockLedgerStore {
    public transactions: Map<string, IMockTx> = new Map();
    public compositeIndex: Set<string> = new Set();

    public async recordEvent(input: {
      userId: mongoose.Types.ObjectId;
      userRole: "RIDER" | "DRIVER" | "ADMIN" | "USER";
      type: string;
      direction: string;
      amountInPaise: number;
      entityType: string;
      entityId: string;
      eventType: string;
      sequence?: number;
      idempotencyKey?: string;
      description: string;
    }) {
      if (!Number.isInteger(input.amountInPaise) || input.amountInPaise < 0) {
        throw new LedgerError(
          "Transaction amount must be a non-negative integer in paise",
          "INVALID_AMOUNT",
          400
        );
      }

      const seq = input.sequence ?? 1;
      const key =
        input.idempotencyKey ||
        generateLedgerIdempotencyKey(input.entityType, input.entityId, input.eventType, seq);

      const compositeKey = `${input.entityType}:${input.entityId}:${input.eventType}:${seq}`;

      // 1. Idempotency check
      if (this.transactions.has(key)) {
        return { transaction: this.transactions.get(key), isDuplicate: true };
      }

      // 2. Composite uniqueness check
      if (this.compositeIndex.has(compositeKey)) {
        for (const tx of this.transactions.values()) {
          if (
            tx.entityType === input.entityType &&
            tx.entityId === input.entityId &&
            tx.eventType === input.eventType &&
            tx.sequence === seq
          ) {
            return { transaction: tx, isDuplicate: true };
          }
        }
      }

      const tx = {
        _id: new mongoose.Types.ObjectId(),
        idempotencyKey: key,
        userId: input.userId,
        userRole: input.userRole,
        type: input.type,
        direction: input.direction,
        amountInPaise: input.amountInPaise,
        currency: "INR" as const,
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: input.eventType,
        sequence: seq,
        status: "SETTLED" as const,
        description: input.description,
        createdAt: new Date(),
      };

      this.transactions.set(key, tx);
      this.compositeIndex.add(compositeKey);

      return { transaction: tx, isDuplicate: false };
    }
  }

  // 1. Rejects invalid, negative, or non-integer amounts in ledger
  it("Rejects non-integer, negative, or NaN transaction amounts in paise", async () => {
    const ledger = new MockLedgerStore();

    await assert.rejects(
      async () =>
        ledger.recordEvent({
          userId: testUserId,
          userRole: "DRIVER",
          type: "CASH_COLLECTED_BY_DRIVER",
          direction: "NON_MONETARY_RECORD",
          amountInPaise: -500, // Negative
          entityType: "RIDE",
          entityId: "ride_123",
          eventType: "CASH_COLLECTION",
          description: "Test invalid negative amount",
        }),
      (err: unknown) => (err as LedgerError).code === "INVALID_AMOUNT"
    );

    await assert.rejects(
      async () =>
        ledger.recordEvent({
          userId: testUserId,
          userRole: "DRIVER",
          type: "CASH_COLLECTED_BY_DRIVER",
          direction: "NON_MONETARY_RECORD",
          amountInPaise: 450.75, // Fractional
          entityType: "RIDE",
          entityId: "ride_123",
          eventType: "CASH_COLLECTION",
          description: "Test invalid decimal amount",
        }),
      (err: unknown) => (err as LedgerError).code === "INVALID_AMOUNT"
    );
  });

  // 2. Canonical idempotency key generation is deterministic
  it("Generates canonical idempotency keys with entity, event, and sequence", () => {
    const key1 = generateLedgerIdempotencyKey("RIDE", "65f123abc456", "CASH_COLLECTION", 1);
    const key2 = generateLedgerIdempotencyKey("RIDE", "65f123abc456", "CASH_COLLECTION", 1);
    assert.equal(key1, key2);
    assert.equal(key1, "ledger_ride_65f123abc456_cash_collection_seq1");

    const keySeq2 = generateLedgerIdempotencyKey("RIDE", "65f123abc456", "CASH_COLLECTION", 2);
    assert.notEqual(key1, keySeq2);
  });

  // 3. Idempotent recording: duplicate attempt returns existing transaction without duplicating ledger
  it("Duplicate transaction write with same idempotency key returns existing transaction without side effects", async () => {
    const ledger = new MockLedgerStore();
    const rideId = "ride_unique_001";

    const res1 = await ledger.recordEvent({
      userId: testUserId,
      userRole: "DRIVER",
      type: "CASH_COLLECTED_BY_DRIVER",
      direction: "NON_MONETARY_RECORD",
      amountInPaise: 35000, // ₹350
      entityType: "RIDE",
      entityId: rideId,
      eventType: "CASH_COLLECTION",
      description: "Cash collected for ride_unique_001",
    });

    assert.equal(res1.isDuplicate, false);
    assert.ok(res1.transaction);
    assert.equal(res1.transaction.amountInPaise, 35000);
    assert.equal(ledger.transactions.size, 1);

    // Second write with identical event
    const res2 = await ledger.recordEvent({
      userId: testUserId,
      userRole: "DRIVER",
      type: "CASH_COLLECTED_BY_DRIVER",
      direction: "NON_MONETARY_RECORD",
      amountInPaise: 35000,
      entityType: "RIDE",
      entityId: rideId,
      eventType: "CASH_COLLECTION",
      description: "Cash collected for ride_unique_001 retry",
    });

    assert.equal(res2.isDuplicate, true);
    assert.ok(res2.transaction);
    assert.equal(res2.transaction.idempotencyKey, res1.transaction.idempotencyKey);
    assert.equal(ledger.transactions.size, 1, "Ledger size must strictly remain 1");
  });

  // 4. Physical cash collected by driver is recorded as NON_MONETARY_RECORD
  it("Driver-collected cash is recorded with direction NON_MONETARY_RECORD", async () => {
    const ledger = new MockLedgerStore();
    const res = await ledger.recordEvent({
      userId: testUserId,
      userRole: "DRIVER",
      type: "CASH_COLLECTED_BY_DRIVER",
      direction: "NON_MONETARY_RECORD",
      amountInPaise: 42000,
      entityType: "RIDE",
      entityId: "ride_cash_rec_1",
      eventType: "CASH_COLLECTION",
      description: "Cash collection record",
    });

    assert.ok(res.transaction);
    assert.equal(res.transaction.direction, "NON_MONETARY_RECORD");
    assert.equal(res.transaction.type, "CASH_COLLECTED_BY_DRIVER");
    assert.equal(res.transaction.currency, "INR");
    assert.equal(res.transaction.status, "SETTLED");
  });

  // 5. Distinct event types on the same ride can be recorded independently
  it("Allows distinct event types on the same ride without collision", async () => {
    const ledger = new MockLedgerStore();
    const rideId = "ride_multi_events";

    const cashCollect = await ledger.recordEvent({
      userId: testUserId,
      userRole: "DRIVER",
      type: "CASH_COLLECTED_BY_DRIVER",
      direction: "NON_MONETARY_RECORD",
      amountInPaise: 50000,
      entityType: "RIDE",
      entityId: rideId,
      eventType: "CASH_COLLECTION",
      sequence: 1,
      description: "Initial cash collection",
    });

    const adjustment = await ledger.recordEvent({
      userId: testUserId,
      userRole: "ADMIN",
      type: "ADJUSTMENT",
      direction: "DEBIT",
      amountInPaise: 5000,
      entityType: "RIDE",
      entityId: rideId,
      eventType: "DISPUTE_ADJUSTMENT",
      sequence: 1,
      description: "Approved audit adjustment",
    });

    assert.equal(cashCollect.isDuplicate, false);
    assert.equal(adjustment.isDuplicate, false);
    assert.equal(ledger.transactions.size, 2);
  });
});
