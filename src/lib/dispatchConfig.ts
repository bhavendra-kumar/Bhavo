
export const DEFAULT_DISPATCH_OFFER_TTL_SECONDS = 25;
export const DEFAULT_DISPATCH_MAX_RADIUS_KM = 10;
export const DEFAULT_DISPATCH_MAX_ATTEMPTS = 8;
export const DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS = 120;
export const DEFAULT_RIDE_DISPATCH_LEAD_TIME_MINUTES = 60;

function parsePositiveInteger(raw: string | undefined, defaultVal: number, configName: string): number {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
    return defaultVal;
  }
  const trimmed = typeof raw === "string" ? raw.trim() : String(raw);
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${configName} configuration: "${raw}". Value must be a positive integer.`);
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${configName} configuration: "${raw}". Value must be a positive integer greater than zero.`);
  }
  return parsed;
}

function parsePositiveNumber(raw: string | undefined, defaultVal: number, configName: string): number {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
    return defaultVal;
  }
  const trimmed = typeof raw === "string" ? raw.trim() : String(raw);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${configName} configuration: "${raw}". Value must be a positive number greater than zero.`);
  }
  return parsed;
}

export function getDispatchOfferTtlSeconds(raw = process.env.DISPATCH_OFFER_TTL_SECONDS): number {
  return parsePositiveInteger(raw, DEFAULT_DISPATCH_OFFER_TTL_SECONDS, "DISPATCH_OFFER_TTL_SECONDS");
}

export function getDispatchOfferTtlMs(raw = process.env.DISPATCH_OFFER_TTL_SECONDS): number {
  return getDispatchOfferTtlSeconds(raw) * 1000;
}

export function getDispatchMaxRadiusKm(raw = process.env.DISPATCH_MAX_RADIUS_KM): number {
  return parsePositiveNumber(raw, DEFAULT_DISPATCH_MAX_RADIUS_KM, "DISPATCH_MAX_RADIUS_KM");
}

export function getDispatchMaxAttempts(raw = process.env.DISPATCH_MAX_ATTEMPTS): number {
  return parsePositiveInteger(raw, DEFAULT_DISPATCH_MAX_ATTEMPTS, "DISPATCH_MAX_ATTEMPTS");
}

export function getDriverLocationMaxAgeSeconds(raw = process.env.DRIVER_LOCATION_MAX_AGE_SECONDS): number {
  return parsePositiveInteger(raw, DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS, "DRIVER_LOCATION_MAX_AGE_SECONDS");
}

export function getDriverLocationMaxAgeMs(raw = process.env.DRIVER_LOCATION_MAX_AGE_SECONDS): number {
  return getDriverLocationMaxAgeSeconds(raw) * 1000;
}
