import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType =
  | "CASH_COLLECTED_BY_DRIVER"
  | "FARE_PAYMENT"
  | "PLATFORM_COMMISSION"
  | "DRIVER_PAYOUT"
  | "DRIVER_INCENTIVE"
  | "TIP_PAYMENT"
  | "WALLET_TOPUP"
  | "WALLET_DEBIT"
  | "ADJUSTMENT";

export type TransactionDirection = "CREDIT" | "DEBIT" | "NON_MONETARY_RECORD";

export type TransactionStatus = "PENDING" | "SETTLED" | "FAILED" | "REVERSED";

export interface ITransaction extends Document {
  idempotencyKey: string;
  userId: mongoose.Types.ObjectId;
  userRole: "RIDER" | "DRIVER" | "ADMIN" | "USER";
  type: TransactionType;
  direction: TransactionDirection;
  amountInPaise: number;
  currency: "INR";
  entityType: "RIDE" | "PAYOUT" | "WALLET" | "INCENTIVE" | "ADJUSTMENT";
  entityId: string;
  eventType: string;
  sequence: number;
  status: TransactionStatus;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ["RIDER", "DRIVER", "ADMIN", "USER"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "CASH_COLLECTED_BY_DRIVER",
        "FARE_PAYMENT",
        "PLATFORM_COMMISSION",
        "DRIVER_PAYOUT",
        "DRIVER_INCENTIVE",
        "TIP_PAYMENT",
        "WALLET_TOPUP",
        "WALLET_DEBIT",
        "ADJUSTMENT",
      ],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT", "NON_MONETARY_RECORD"],
      required: true,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v >= 0,
        message: "amountInPaise must be a non-negative integer",
      },
    },
    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
      required: true,
    },
    entityType: {
      type: String,
      enum: ["RIDE", "PAYOUT", "WALLET", "INCENTIVE", "ADJUSTMENT"],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    sequence: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["PENDING", "SETTLED", "FAILED", "REVERSED"],
      default: "SETTLED",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ idempotencyKey: 1 }, { unique: true });

TransactionSchema.index(
  { entityType: 1, entityId: 1, eventType: 1, sequence: 1 },
  { unique: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
