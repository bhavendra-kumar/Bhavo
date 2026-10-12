/**
 * Financial Ledger & Transaction Service (Phase 1C)
 * 
 * Rules:
 * - Immutable ledger records for all financial events.
 * - Idempotency enforced via unique database constraints and composite keys.
 * - Physical cash collected by driver does NOT credit driver platform wallet.
 * - Commission deduction remains disabled until approved.
 * - All amounts strictly in integer paise.
 */

import mongoose from "mongoose";
import Transaction, {
  ITransaction,
  TransactionType,
  TransactionDirection,
} from "@/models/Transaction";
import Ride, { IRide } from "@/models/Ride";
import { rupeesToPaise } from "@/lib/pricingEngine";

export class LedgerError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = "LEDGER_ERROR", statusCode = 400) {
    super(message);
    this.name = "LedgerError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface RecordEventInput {
  userId: mongoose.Types.ObjectId;
  userRole: "RIDER" | "DRIVER" | "ADMIN" | "USER";
  type: TransactionType;
  direction: TransactionDirection;
  amountInPaise: number;
  entityType: "RIDE" | "PAYOUT" | "WALLET" | "INCENTIVE" | "ADJUSTMENT";
  entityId: string;
  eventType: string;
  sequence?: number;
  idempotencyKey?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ConfirmCashCollectionInput {
  rideId: string;
  driverId: mongoose.Types.ObjectId;
  driverName?: string;
}

export interface ConfirmCashCollectionResult {
  ride: IRide;
  transaction: ITransaction;
  alreadyCollected: boolean;
  collectedAmountInRupees: number;
  collectedAmountInPaise: number;
}

/**
 * Generates canonical idempotency key for financial events
 */
export function generateLedgerIdempotencyKey(
  entityType: string,
  entityId: string,
  eventType: string,
  sequence = 1
): string {
  return `ledger_${entityType.toLowerCase()}_${entityId}_${eventType.toLowerCase()}_seq${sequence}`;
}

/**
 * Records an immutable financial transaction in the ledger.
 * Handles duplicate idempotency keys safely by returning existing transaction.
 */
export async function recordFinancialEvent(
  input: RecordEventInput
): Promise<{ transaction: ITransaction; isDuplicate: boolean }> {
  if (!input.amountInPaise || input.amountInPaise < 0 || !Number.isInteger(input.amountInPaise)) {
    throw new LedgerError(
      "Transaction amount must be a non-negative integer in paise",
      "INVALID_AMOUNT",
      400
    );
  }

  const sequence = input.sequence ?? 1;
  const idempotencyKey =
    input.idempotencyKey ||
    generateLedgerIdempotencyKey(input.entityType, input.entityId, input.eventType, sequence);

  // Check if transaction already exists under this idempotency key
  const existing = await Transaction.findOne({ idempotencyKey });
  if (existing) {
    return { transaction: existing, isDuplicate: true };
  }

  try {
    const transaction = await Transaction.create({
      idempotencyKey,
      userId: input.userId,
      userRole: input.userRole,
      type: input.type,
      direction: input.direction,
      amountInPaise: input.amountInPaise,
      currency: "INR",
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      sequence,
      status: "SETTLED",
      description: input.description,
      metadata: input.metadata || {},
    });

    return { transaction, isDuplicate: false };
  } catch (error: unknown) {
    // Handle MongoDB duplicate key collision (11000) under concurrent retry
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      const existingAfterRace = await Transaction.findOne({
        $or: [
          { idempotencyKey },
          {
            entityType: input.entityType,
            entityId: input.entityId,
            eventType: input.eventType,
            sequence,
          },
        ],
      });

      if (existingAfterRace) {
        return { transaction: existingAfterRace, isDuplicate: true };
      }
    }
    throw error;
  }
}

/**
 * Confirms cash collection by the assigned driver for a completed cash ride.
 * Invariant: Physical cash collected directly by the driver is NOT credited
 * to the driver's platform wallet balance (that would be double payment).
 */
export async function confirmCashCollection(
  input: ConfirmCashCollectionInput
): Promise<ConfirmCashCollectionResult> {
  const { rideId, driverId, driverName } = input;

  if (!mongoose.isValidObjectId(rideId)) {
    throw new LedgerError("Invalid ride ID format", "INVALID_RIDE_ID", 400);
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new LedgerError("Ride not found", "RIDE_NOT_FOUND", 404);
  }

  // Enforce driver assignment
  if (!ride.driver || ride.driver.toString() !== driverId.toString()) {
    throw new LedgerError(
      "Only the assigned driver can confirm cash collection for this ride",
      "FORBIDDEN_NOT_ASSIGNED_DRIVER",
      403
    );
  }

  // Enforce completed state
  if (ride.status !== "COMPLETED") {
    throw new LedgerError(
      `Cannot collect cash for ride in status "${ride.status}". Ride must be COMPLETED.`,
      "RIDE_NOT_COMPLETED",
      409
    );
  }

  // Enforce payment method
  if (ride.paymentMethod !== "CASH") {
    throw new LedgerError(
      `Cannot confirm cash collection for ride with payment method "${ride.paymentMethod}". Only CASH rides support driver cash collection.`,
      "INVALID_PAYMENT_METHOD",
      400
    );
  }

  // Idempotency check: already collected
  if (ride.paymentStatus === "COLLECTED") {
    const existingTx = await Transaction.findOne({
      entityType: "RIDE",
      entityId: ride._id.toString(),
      eventType: "CASH_COLLECTION",
    });

    return {
      ride,
      transaction: existingTx as ITransaction,
      alreadyCollected: true,
      collectedAmountInRupees: ride.fare,
      collectedAmountInPaise: ride.fareInPaise || rupeesToPaise(ride.fare),
    };
  }

  // Reject if settled under another status (e.g. PAID)
  if (ride.paymentStatus === "PAID") {
    throw new LedgerError(
      "Payment for this ride has already been marked as PAID",
      "ALREADY_PAID",
      409
    );
  }

  const fareInPaise = ride.fareInPaise && ride.fareInPaise > 0
    ? ride.fareInPaise
    : rupeesToPaise(ride.fare);

  const now = new Date();

  // Atomic state transition: PENDING_COLLECTION or PENDING -> COLLECTED
  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: ride._id,
      paymentStatus: { $in: ["PENDING", "PENDING_COLLECTION"] },
      driver: driverId,
      status: "COMPLETED",
    },
    {
      $set: {
        paymentStatus: "COLLECTED",
        cashCollectedAt: now,
        cashCollectedBy: driverId,
      },
    },
    { new: true }
  );

  if (!updatedRide) {
    // Re-check why findOneAndUpdate failed
    const checkRide = await Ride.findById(rideId);
    if (checkRide && checkRide.paymentStatus === "COLLECTED") {
      const existingTx = await Transaction.findOne({
        entityType: "RIDE",
        entityId: checkRide._id.toString(),
        eventType: "CASH_COLLECTION",
      });
      return {
        ride: checkRide,
        transaction: existingTx as ITransaction,
        alreadyCollected: true,
        collectedAmountInRupees: checkRide.fare,
        collectedAmountInPaise: fareInPaise,
      };
    }
    throw new LedgerError("Failed to update cash collection status", "UPDATE_FAILED", 409);
  }

  // Record non-monetary immutable transaction in ledger
  const { transaction } = await recordFinancialEvent({
    userId: driverId,
    userRole: "DRIVER",
    type: "CASH_COLLECTED_BY_DRIVER",
    direction: "NON_MONETARY_RECORD",
    amountInPaise: fareInPaise,
    entityType: "RIDE",
    entityId: updatedRide._id.toString(),
    eventType: "CASH_COLLECTION",
    sequence: 1,
    description: `Cash payment of ₹${updatedRide.fare} collected directly in person by driver ${driverName || driverId.toString()}`,
    metadata: {
      fareInRupees: updatedRide.fare,
      riderId: updatedRide.rider ? updatedRide.rider.toString() : null,
      collectedAt: now.toISOString(),
      commissionSettlementPending: true, // Platform commission policy unresolved in V1
    },
  });

  return {
    ride: updatedRide,
    transaction,
    alreadyCollected: false,
    collectedAmountInRupees: updatedRide.fare,
    collectedAmountInPaise: fareInPaise,
  };
}
