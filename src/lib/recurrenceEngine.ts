/**
 * Timezone-Authoritative Recurrence Engine (Phase 1F)
 *
 * Rules:
 * - Authoritative timezone is strictly Asia/Kolkata (IST = UTC+05:30).
 * - Calculation is completely independent of the Node.js process timezone.
 * - Deterministic occurrence keys: `${commuteId}:${yyyyMMdd}_${hhmm}`.
 * - Handles both 12-hour ("8:45 AM") and 24-hour ("08:45") time formats.
 * - Evaluates occurrences within a lookahead window (default 180 minutes).
 * - Identifies past occurrences so they are never scheduled retroactively.
 */

import { IST_OFFSET_MS } from "@/lib/autoBookingConfig";

export class RecurrenceError extends Error {
  public readonly code: string;

  constructor(message: string, code = "INVALID_RECURRENCE") {
    super(message);
    this.name = "RecurrenceError";
    this.code = code;
  }
}

export interface IParsedTime {
  hours: number;
  minutes: number;
}

export interface IOccurrenceCandidate {
  occurrenceKey: string;
  scheduledFor: Date;
  isPast: boolean;
  dateKey: string;
}

export interface ICommuteRecurrenceInput {
  _id: { toString(): string };
  time: string;
  days: string[];
  isActive?: boolean;
}

/**
 * Normalizes and parses commute time string into hours (0-23) and minutes (0-59).
 * Supports:
 * - 12-hour format: "8:45 AM", "08:45 AM", "6:30 PM", "12:00 PM", "12:00 AM"
 * - 24-hour format: "08:45", "18:30", "00:00", "23:59"
 */
export function parseCommuteTime(timeStr: string): IParsedTime {
  if (!timeStr || typeof timeStr !== "string") {
    throw new RecurrenceError("Commute time must be a non-empty string.", "INVALID_TIME_STRING");
  }

  const trimmed = timeStr.trim();

  // Try 12-hour format with AM/PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new RecurrenceError(
        `Invalid 12-hour time value: "${timeStr}". Hours must be 1-12 and minutes 0-59.`,
        "TIME_OUT_OF_RANGE"
      );
    }

    if (meridiem === "AM") {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    return { hours, minutes };
  }

  // Try 24-hour format
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new RecurrenceError(
        `Invalid 24-hour time value: "${timeStr}". Hours must be 0-23 and minutes 0-59.`,
        "TIME_OUT_OF_RANGE"
      );
    }

    return { hours, minutes };
  }

  throw new RecurrenceError(
    `Unsupported time format: "${timeStr}". Expected "HH:MM AM/PM" or "HH:MM".`,
    "UNSUPPORTED_TIME_FORMAT"
  );
}

/**
 * Normalizes weekday string to standard numeric day (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
export function normalizeWeekday(dayStr: string): number {
  if (!dayStr || typeof dayStr !== "string") {
    throw new RecurrenceError("Weekday must be a string.", "INVALID_WEEKDAY");
  }

  const normalized = dayStr.trim().toLowerCase();
  switch (normalized) {
    case "sun":
    case "sunday":
      return 0;
    case "mon":
    case "monday":
      return 1;
    case "tue":
    case "tues":
    case "tuesday":
      return 2;
    case "wed":
    case "wednesday":
      return 3;
    case "thu":
    case "thur":
    case "thurs":
    case "thursday":
      return 4;
    case "fri":
    case "friday":
      return 5;
    case "sat":
    case "saturday":
      return 6;
    default:
      throw new RecurrenceError(`Unknown weekday name: "${dayStr}".`, "INVALID_WEEKDAY_NAME");
  }
}

export const CANONICAL_WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Returns the canonical 3-letter capitalized weekday name for any supported representation.
 */
export function getCanonicalWeekdayName(dayStr: string): string {
  const index = normalizeWeekday(dayStr);
  return CANONICAL_WEEKDAY_NAMES[index];
}

/**
 * Extracts Indian Standard Time (Asia/Kolkata) calendar components from any UTC Date.
 * Pure mathematical offset calculation, immune to host system timezone.
 */
export function getIstDateComponents(utcDate: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  formattedDate: string;
} {
  const istEpoch = utcDate.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istEpoch);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth(); // 0-indexed
  const day = istDate.getUTCDate();
  const weekday = istDate.getUTCDay(); // 0 = Sunday

  const yyyy = String(year);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  return { year, month, day, weekday, formattedDate };
}

/**
 * Constructs an exact UTC Date corresponding to a specific local IST calendar date and time.
 */
export function buildIstTimestamp(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): Date {
  const utcMillis = Date.UTC(year, month, day, hours, minutes, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMillis);
}

/**
 * Generates a stable, canonical occurrence key.
 * Format: `${commuteId}:${yyyy-MM-dd}_${HHmm}`
 */
export function generateOccurrenceKey(
  commuteId: string | { toString(): string },
  occurrenceDate: Date
): string {
  const idStr = typeof commuteId === "string" ? commuteId : commuteId.toString();
  const istComponents = getIstDateComponents(occurrenceDate);
  const istEpoch = occurrenceDate.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istEpoch);
  const hh = String(istDate.getUTCHours()).padStart(2, "0");
  const min = String(istDate.getUTCMinutes()).padStart(2, "0");

  return `${idStr}:${istComponents.formattedDate}_${hh}${min}`;
}

/**
 * Calculates upcoming occurrences for a commute schedule within the lookahead window.
 *
 * @param commute Commute object with _id, time, days, isActive
 * @param atTime Current evaluation timestamp (defaults to new Date())
 * @param lookaheadMinutes Window lookahead in minutes (defaults to 180m)
 * @returns Array of candidate occurrences within [atTime, atTime + lookaheadMinutes]
 */
export function calculateUpcomingOccurrences(
  commute: ICommuteRecurrenceInput,
  atTime = new Date(),
  lookaheadMinutes = 180
): IOccurrenceCandidate[] {
  if (commute.isActive === false) {
    return [];
  }

  if (!Array.isArray(commute.days) || commute.days.length === 0) {
    return [];
  }

  const { hours, minutes } = parseCommuteTime(commute.time);
  const allowedWeekdays = new Set<number>();
  for (const dayStr of commute.days) {
    try {
      allowedWeekdays.add(normalizeWeekday(dayStr));
    } catch {
      // Ignore unrecognized day strings safely
    }
  }

  if (allowedWeekdays.size === 0) {
    return [];
  }

  const windowEnd = new Date(atTime.getTime() + lookaheadMinutes * 60 * 1000);
  const commuteIdStr = commute._id.toString();

  // Dynamically calculate scanning horizon based on lookahead window (defaults to at least 2 days ahead)
  const maxDays = Math.max(2, Math.ceil(lookaheadMinutes / (24 * 60)) + 1);
  const candidates: IOccurrenceCandidate[] = [];

  // Scan across the window horizon in IST calendar dates
  for (let dayOffset = 0; dayOffset <= maxDays; dayOffset++) {
    const candidateUtc = new Date(atTime.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const comps = getIstDateComponents(candidateUtc);

    if (!allowedWeekdays.has(comps.weekday)) {
      continue;
    }

    const scheduledDate = buildIstTimestamp(comps.year, comps.month, comps.day, hours, minutes);
    const occurrenceKey = generateOccurrenceKey(commuteIdStr, scheduledDate);

    const isPast = scheduledDate.getTime() <= atTime.getTime();
    const isWithinWindow = scheduledDate.getTime() > atTime.getTime() && scheduledDate.getTime() <= windowEnd.getTime();

    if (isWithinWindow || (dayOffset === 0 && isPast)) {
      candidates.push({
        occurrenceKey,
        scheduledFor: scheduledDate,
        isPast,
        dateKey: comps.formattedDate,
      });
    }
  }

  // Sort ascending by scheduled pickup time
  return candidates.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
}
