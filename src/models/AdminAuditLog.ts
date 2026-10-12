import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  actorEmail: string;
  action: string;
  targetType: "DRIVER" | "USER" | "RIDE" | "TICKET" | "SYSTEM";
  targetId: string;
  reason: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["DRIVER", "USER", "RIDE", "TICKET", "SYSTEM"],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for bounded operational queries
AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ actor: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });

const AdminAuditLog: Model<IAdminAuditLog> =
  mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLog>("AdminAuditLog", AdminAuditLogSchema);

export default AdminAuditLog;
