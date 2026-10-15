
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

export function parseCommuteTime(timeStr: string): IParsedTime {
  if (!timeStr || typeof timeStr !== "string") {
    throw new RecurrenceError("Commute time must be a non-empty string.", "INVALID_TIME_STRING");
  }

  const trimmed = timeStr.trim();

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

export function getCanonicalWeekdayName(dayStr: string): string {
  const index = normalizeWeekday(dayStr);
  return CANONICAL_WEEKDAY_NAMES[index];
}

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
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const weekday = istDate.getUTCDay();

  const yyyy = String(year);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  return { year, month, day, weekday, formattedDate };
}

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
    }
  }

  if (allowedWeekdays.size === 0) {
    return [];
  }

  const windowEnd = new Date(atTime.getTime() + lookaheadMinutes * 60 * 1000);
  const commuteIdStr = commute._id.toString();

  const maxDays = Math.max(2, Math.ceil(lookaheadMinutes / (24 * 60)) + 1);
  const candidates: IOccurrenceCandidate[] = [];

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

  return candidates.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
}
