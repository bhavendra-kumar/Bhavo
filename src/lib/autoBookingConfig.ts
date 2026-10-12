/**
 * Operational Configuration Defaults for Auto Booking & Recurring Ride Generation (Phase 1F)
 *
 * All values are server-side authoritative and validated against environment variables.
 */

import { getDispatchLeadTimeMinutes } from "@/lib/rideStateMachine";

export const DEFAULT_AUTO_BOOKING_LOOKAHEAD_MINUTES = 180;
export const DEFAULT_AUTO_BOOKING_BATCH_SIZE = 50;
export const DEFAULT_AUTO_BOOKING_LEASE_DURATION_MS = 60000; // 60 seconds lease
export const DEFAULT_AUTO_BOOKING_MAX_ATTEMPTS = 3;
export const CANONICAL_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MINUTES = 330; // UTC+05:30
export const IST_OFFSET_MS = 330 * 60 * 1000; // 19,800,000 ms

/**
 * Validates and retrieves the configured auto-booking materialization lookahead in minutes.
 * - Default: 180 minutes.
 * - Must be a positive integer without decimals.
 * - Must be greater than or equal to RIDE_DISPATCH_LEAD_TIME_MINUTES (default 60m)
 *   so rides materialize before the scheduled driver confirmation window.
 */
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

/**
 * Validates and retrieves the configured batch size limit for auto booking executions.
 * - Default: 50.
 * - Upper bound: 200 to prevent unbounded execution loops.
 */
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
