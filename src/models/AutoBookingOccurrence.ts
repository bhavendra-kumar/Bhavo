import mongoose, { Schema, Document, Model } from "mongoose";

export type AutoBookingOccurrenceStatus =
  | "PENDING"
  | "CLAIMED"
  | "MATERIALIZED"
  | "FAILED_RETRYABLE"
  | "FAILED_PERMANENT"
  | "SKIPPED_PAST"
  | "SKIPPED_PAUSED";

export interface IAutoBookingOccurrence extends Document {
  occurrenceKey: string;
  commuteId: mongoose.Types.ObjectId;
  rider: mongoose.Types.ObjectId;
  scheduledFor: Date;
  status: AutoBookingOccurrenceStatus;
  rideId?: mongoose.Types.ObjectId | null;
  leaseId?: string | null;
  leaseExpiresAt?: Date | null;
  attemptCount: number;
  maxAttempts: number;
  lastError?: string | null;
  lastAttemptAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AutoBookingOccurrenceSchema = new Schema<IAutoBookingOccurrence>(
  {
    occurrenceKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    commuteId: {
      type: Schema.Types.ObjectId,
      ref: "Commute",
      required: true,
      index: true,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CLAIMED",
        "MATERIALIZED",
        "FAILED_RETRYABLE",
        "FAILED_PERMANENT",
        "SKIPPED_PAST",
        "SKIPPED_PAUSED",
      ],
      default: "PENDING",
      index: true,
    },
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
      index: true,
    },
    leaseId: {
      type: String,
      default: null,
    },
    leaseExpiresAt: {
      type: Date,
      default: null,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    lastError: {
      type: String,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

AutoBookingOccurrenceSchema.index({ status: 1, scheduledFor: 1 });
AutoBookingOccurrenceSchema.index({ commuteId: 1, scheduledFor: 1 });
AutoBookingOccurrenceSchema.index({ rider: 1, scheduledFor: 1 });

const AutoBookingOccurrence: Model<IAutoBookingOccurrence> =
  mongoose.models.AutoBookingOccurrence ||
  mongoose.model<IAutoBookingOccurrence>("AutoBookingOccurrence", AutoBookingOccurrenceSchema);

export default AutoBookingOccurrence;
