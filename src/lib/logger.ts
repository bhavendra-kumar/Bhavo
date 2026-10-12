/**
 * Privacy-Safe Structured Logger for Bhavo (Phase 1I)
 *
 * Rules:
 * - Emits structured JSON logs suitable for cloud logging, containers, or stdout aggregation.
 * - Recursively redacts sensitive keys: password, token, otp, secret, authorization, creditCard, apiKey.
 * - Formats timestamps in ISO 8601.
 * - Never logs full environment objects or client secrets.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "jwt",
  "secret",
  "otp",
  "resetotp",
  "authorization",
  "cookie",
  "creditcard",
  "cardnumber",
  "cvv",
  "apikey",
  "authsecret",
  "jwtsecret",
  "cronsecret",
]);

/**
 * Recursively redacts sensitive values from objects before logging
 */
export function sanitizeLogPayload(data: unknown, depth = 0): unknown {
  if (depth > 6) return "[Truncated: Max Depth]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Basic heuristics to mask tokens/secrets if passed as naked strings
    if (data.startsWith("eyJ") && data.length > 40) {
      return "[REDACTED_JWT]";
    }
    return data;
  }

  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogPayload(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeLogPayload(val, depth + 1);
    }
  }

  return sanitized;
}

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: unknown;
  error?: {
    name?: string;
    message?: string;
    code?: string;
  };
}

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, context?: string, data?: unknown, err?: unknown): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      entry.data = sanitizeLogPayload(data);
    }

    if (err instanceof Error) {
      entry.error = {
        name: err.name,
        message: err.message,
        code: (err as unknown as { code?: string }).code,
      };
    } else if (err) {
      entry.error = { message: String(err) };
    }

    return entry;
  }

  public info(message: string, context?: string, data?: unknown) {
    const entry = this.formatLog("INFO", message, context, data);
    console.log(JSON.stringify(entry));
  }

  public warn(message: string, context?: string, data?: unknown) {
    const entry = this.formatLog("WARN", message, context, data);
    console.warn(JSON.stringify(entry));
  }

  public error(message: string, context?: string, err?: unknown, data?: unknown) {
    const entry = this.formatLog("ERROR", message, context, data, err);
    console.error(JSON.stringify(entry));
  }

  public debug(message: string, context?: string, data?: unknown) {
    if (process.env.NODE_ENV !== "production") {
      const entry = this.formatLog("DEBUG", message, context, data);
      console.debug(JSON.stringify(entry));
    }
  }
}

export const logger = new StructuredLogger();
export default logger;
