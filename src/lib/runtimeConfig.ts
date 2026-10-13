/**
 * Centralized Runtime Configuration & Secret Validation (Phase 1I)
 *
 * Rules:
 * - Server-side authoritative validation of all critical environment settings.
 * - Enforces minimum 32-character secret entropy in production for JWT and Cron secrets.
 * - Fails fast with clear, non-leaking diagnostic errors if security-critical secrets are missing.
 * - Never returns or exposes raw secret values to callers, clients, or logs.
 * - Validates numeric operational settings (rejects negatives, NaN, non-integers where required).
 * - Distinguishes required dependencies from optional integrations (e.g. SMTP, live payment gateway).
 * - Enforces that live payments remain disabled unless approved provider integration exists.
 */

export interface RuntimeConfigStatus {
  nodeEnv: "production" | "development" | "test";
  databaseConfigured: boolean;
  jwtConfigured: boolean;
  cronConfigured: boolean;
  smtpConfigured: boolean;
  livePaymentsEnabled: boolean;
  operationalDefaults: {
    dispatchLeadTimeMinutes: number;
    dispatchOfferTtlSeconds: number;
    dispatchMaxRadiusKm: number;
    dispatchMaxAttempts: number;
    driverLocationMaxAgeSeconds: number;
    autoBookingLookaheadMinutes: number;
    autoBookingBatchSize: number;
  };
}

export class ConfigurationError extends Error {
  public readonly setting: string;

  constructor(setting: string, message: string) {
    super(`[ConfigurationError] ${setting}: ${message}`);
    this.name = "ConfigurationError";
    this.setting = setting;
  }
}

/**
 * Validates whether a secret string meets minimum length requirements.
 */
function validateSecretString(
  value: string | undefined,
  name: string,
  minLen = 32,
  isProduction = false
): string {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new ConfigurationError(
      name,
      `Secret is not configured or is empty. Security-critical operations cannot proceed.`
    );
  }

  const trimmed = value.trim();

  // In production, enforce minimum 32 characters of entropy
  if (isProduction && trimmed.length < minLen) {
    throw new ConfigurationError(
      name,
      `Secret has insufficient length (${trimmed.length} chars). Production requires at least ${minLen} characters.`
    );
  }

  // Reject known dangerous fallback placeholders
  const dangerousFallbacks = [
    "your-secret-here",
    "secret",
    "changeme",
    "default-secret",
    "1234567890",
    "your-jwt-secret-min-32-chars",
    "your-auth-secret-min-32-chars",
    "your-dispatch-cron-secret-min-32-chars",
  ];
  if (isProduction && dangerousFallbacks.includes(trimmed.toLowerCase())) {
    throw new ConfigurationError(
      name,
      `Secret matches an insecure default placeholder. Set a unique, cryptographically random value in production.`
    );
  }

  return trimmed;
}

/**
 * Validates a positive integer configuration variable.
 */
export function validatePositiveInteger(
  raw: string | number | undefined,
  name: string,
  defaultValue: number,
  min = 1,
  max = Number.MAX_SAFE_INTEGER
): number {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
    return defaultValue;
  }

  const trimmed = typeof raw === "string" ? raw.trim() : String(raw);
  if (!/^\d+$/.test(trimmed)) {
    throw new ConfigurationError(name, `Value must be a positive integer without decimals or symbols.`);
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ConfigurationError(name, `Value must be an integer between ${min} and ${max}.`);
  }

  return parsed;
}

/**
 * Validates a positive numeric configuration variable (allowing decimals, e.g. km).
 */
export function validatePositiveNumber(
  raw: string | number | undefined,
  name: string,
  defaultValue: number,
  min = 0.1,
  max = 1000
): number {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
    return defaultValue;
  }

  const parsed = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ConfigurationError(name, `Value must be a finite number between ${min} and ${max}.`);
  }

  return parsed;
}

/**
 * Validates database connection string.
 */
export function validateDatabaseUrl(
  raw = process.env.DATABASE_URL,
  isProduction = process.env.NODE_ENV === "production"
): string {
  const effectiveRaw = raw || (!isProduction ? "mongodb://localhost:27017/bhavo" : undefined);
  if (!effectiveRaw || typeof effectiveRaw !== "string" || effectiveRaw.trim() === "") {
    throw new ConfigurationError("DATABASE_URL", "MongoDB connection string is missing or empty.");
  }
  const trimmed = effectiveRaw.trim();
  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) {
    throw new ConfigurationError(
      "DATABASE_URL",
      "MongoDB connection string must start with 'mongodb://' or 'mongodb+srv://'."
    );
  }
  return trimmed;
}

/**
 * Validates authentication JWT secret.
 */
export function validateJwtSecret(isProduction = process.env.NODE_ENV === "production"): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || (!isProduction ? "dev-jwt-auth-secret-key-32-chars-long" : undefined);
  return validateSecretString(secret, "JWT_SECRET/AUTH_SECRET", 32, isProduction);
}

/**
 * Validates cron maintenance secret.
 */
export function validateCronSecret(isProduction = process.env.NODE_ENV === "production"): string {
  const secret = process.env.CRON_SECRET || (!isProduction ? "dev-cron-maintenance-secret-32-chars-long" : undefined);
  return validateSecretString(secret, "CRON_SECRET", 32, isProduction);
}

/**
 * Authoritatively determines whether live online payments are permitted.
 * In Phase 1I, Razorpay integration is absent and live payment collection remains DISABLED.
 */
export function isLivePaymentEnabled(): boolean {
  // Live online gateway payments are disabled by default
  const flag = process.env.LIVE_PAYMENTS_ENABLED;
  if (flag !== "true") {
    return false;
  }

  // If someone explicitly attempts to turn on live payments, require approved provider credentials
  const razorpayKey = process.env.RAZORPAY_KEY_ID?.trim();
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!razorpayKey || !razorpaySecret) {
    return false;
  }

  return true;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

/**
 * Validates and retrieves server-side Razorpay configuration.
 * Fails closed if online payments are disabled or credentials are missing.
 */
export function getRazorpayConfig(): RazorpayConfig {
  if (!isLivePaymentEnabled()) {
    throw new ConfigurationError(
      "RAZORPAY",
      "Online payments are disabled. Set LIVE_PAYMENTS_ENABLED=true with valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new ConfigurationError(
      "RAZORPAY",
      "Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing or empty."
    );
  }

  return {
    keyId,
    keySecret,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || undefined,
  };
}

/**
 * Validates and returns the Razorpay webhook secret.
 * Fails closed if missing or empty.
 */
export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new ConfigurationError(
      "RAZORPAY_WEBHOOK_SECRET",
      "Razorpay webhook secret (RAZORPAY_WEBHOOK_SECRET) is missing or unconfigured."
    );
  }
  return secret;
}

/**
 * Validates the entire platform runtime configuration.
 * Returns safe diagnostic summary (free of secrets) on success.
 * Throws ConfigurationError if any required setting fails validation.
 */
export function validateRuntimeConfig(isProduction = process.env.NODE_ENV === "production"): RuntimeConfigStatus {
  const nodeEnv = (process.env.NODE_ENV || "development") as "production" | "development" | "test";

  // Validate core secrets
  validateDatabaseUrl(process.env.DATABASE_URL, isProduction);
  validateJwtSecret(isProduction);
  validateCronSecret(isProduction);

  // Validate operational numeric defaults
  const dispatchLeadTimeMinutes = validatePositiveInteger(
    process.env.RIDE_DISPATCH_LEAD_TIME_MINUTES,
    "RIDE_DISPATCH_LEAD_TIME_MINUTES",
    60,
    1,
    1440
  );

  const dispatchOfferTtlSeconds = validatePositiveInteger(
    process.env.DISPATCH_OFFER_TTL_SECONDS,
    "DISPATCH_OFFER_TTL_SECONDS",
    25,
    5,
    300
  );

  const dispatchMaxRadiusKm = validatePositiveNumber(
    process.env.DISPATCH_MAX_RADIUS_KM,
    "DISPATCH_MAX_RADIUS_KM",
    10,
    1,
    100
  );

  const dispatchMaxAttempts = validatePositiveInteger(
    process.env.DISPATCH_MAX_ATTEMPTS,
    "DISPATCH_MAX_ATTEMPTS",
    8,
    1,
    50
  );

  const driverLocationMaxAgeSeconds = validatePositiveInteger(
    process.env.DRIVER_LOCATION_MAX_AGE_SECONDS,
    "DRIVER_LOCATION_MAX_AGE_SECONDS",
    120,
    10,
    3600
  );

  const autoBookingLookaheadMinutes = validatePositiveInteger(
    process.env.AUTO_BOOKING_LOOKAHEAD_MINUTES,
    "AUTO_BOOKING_LOOKAHEAD_MINUTES",
    180,
    dispatchLeadTimeMinutes,
    10080
  );

  const autoBookingBatchSize = validatePositiveInteger(
    process.env.AUTO_BOOKING_BATCH_SIZE,
    "AUTO_BOOKING_BATCH_SIZE",
    50,
    1,
    200
  );

  const smtpConfigured = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  return {
    nodeEnv,
    databaseConfigured: true,
    jwtConfigured: true,
    cronConfigured: true,
    smtpConfigured,
    livePaymentsEnabled: isLivePaymentEnabled(),
    operationalDefaults: {
      dispatchLeadTimeMinutes,
      dispatchOfferTtlSeconds,
      dispatchMaxRadiusKm,
      dispatchMaxAttempts,
      driverLocationMaxAgeSeconds,
      autoBookingLookaheadMinutes,
      autoBookingBatchSize,
    },
  };
}
