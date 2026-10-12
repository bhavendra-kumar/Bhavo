import dbConnect from "@/lib/mongoose";
import AdminAuditLog, { IAdminAuditLog } from "@/models/AdminAuditLog";
import mongoose from "mongoose";

export interface ICreateAuditLogParams {
  actor: mongoose.Types.ObjectId | string;
  actorEmail: string;
  action: string;
  targetType: "DRIVER" | "USER" | "RIDE" | "TICKET" | "SYSTEM";
  targetId: string;
  reason: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  req?: Request;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "resetOtp",
  "token",
  "jwt",
  "secret",
  "authorization",
  "cookie",
  "otp",
]);

/**
 * Recursively sanitizes payloads to ensure sensitive credentials, tokens,
 * and secrets are never persisted in the administrative audit log.
 */
function sanitizePayload(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item, depth + 1));
  }
  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizePayload(val, depth + 1);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * Creates an append-only audit log entry for administrative actions.
 */
export async function recordAdminAudit(params: ICreateAuditLogParams): Promise<IAdminAuditLog> {
  await dbConnect();

  let ip: string | null = null;
  let userAgent: string | null = null;

  if (params.req) {
    ip =
      params.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      params.req.headers.get("x-real-ip") ||
      null;
    userAgent = params.req.headers.get("user-agent") || null;
  }

  const cleanBefore = params.before ? (sanitizePayload(params.before) as Record<string, unknown>) : null;
  const cleanAfter = params.after ? (sanitizePayload(params.after) as Record<string, unknown>) : null;
  const cleanMetadata = params.metadata ? (sanitizePayload(params.metadata) as Record<string, unknown>) : null;

  const entry = await AdminAuditLog.create({
    actor: new mongoose.Types.ObjectId(params.actor.toString()),
    actorEmail: params.actorEmail,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    reason: params.reason,
    before: cleanBefore,
    after: cleanAfter,
    metadata: cleanMetadata,
    ip,
    userAgent,
  });

  return entry;
}
