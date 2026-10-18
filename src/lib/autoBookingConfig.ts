
import { getDispatchLeadTimeMinutes } from "@/lib/rideStateMachine";

export const DEFAULT_AUTO_BOOKING_LOOKAHEAD_MINUTES = 180;
export const DEFAULT_AUTO_BOOKING_BATCH_SIZE = 50;
export const DEFAULT_AUTO_BOOKING_LEASE_DURATION_MS = 60000;
export const DEFAULT_AUTO_BOOKING_MAX_ATTEMPTS = 3;
export const CANONICAL_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MINUTES = 330;
export const IST_OFFSET_MS = 330 * 60 * 1000;

export function getAutoBookingLookaheadMinutes(
  rawVal: string | undefined = process.env.AUTO_BOOKING_LOOKAHEAD_MINUTES
): number {
  if (rawVal === undefined || rawVal === null || (typeof rawVal === "string" && rawVal.trim() === "")) {
    return DEFAULT_AUTO_BOOKING_LOOKAHEAD_MINUTES;
  }

  const trimmed = typeof rawVal === "string" ? rawVal.trim() : String(rawVal);
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES configuration: "${rawVal}". Value must be a positive integer without decimals or symbols.`
    );
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES configuration: "${rawVal}". Value must be a positive integer greater than zero.`
    );
  }

  const dispatchLeadMinutes = getDispatchLeadTimeMinutes();
  if (parsed < dispatchLeadMinutes) {
    throw new Error(
      `Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES configuration: ${parsed}. Value must be at least equal to RIDE_DISPATCH_LEAD_TIME_MINUTES (${dispatchLeadMinutes}m) to allow driver dispatch confirmation.`
    );
  }

  return parsed;
}

export function getAutoBookingBatchSize(
  rawVal: string | undefined = process.env.AUTO_BOOKING_BATCH_SIZE
): number {
  if (rawVal === undefined || rawVal === null || (typeof rawVal === "string" && rawVal.trim() === "")) {
    return DEFAULT_AUTO_BOOKING_BATCH_SIZE;
  }

  const trimmed = typeof rawVal === "string" ? rawVal.trim() : String(rawVal);
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid AUTO_BOOKING_BATCH_SIZE configuration: "${rawVal}". Value must be a positive integer without decimals or symbols.`
    );
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0 || parsed > 200) {
    throw new Error(
      `Invalid AUTO_BOOKING_BATCH_SIZE configuration: "${rawVal}". Value must be a positive integer between 1 and 200.`
    );
  }

  return parsed;
}
