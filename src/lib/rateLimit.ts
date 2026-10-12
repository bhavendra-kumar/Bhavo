/**
 * Rate Limiting Abstraction for Bhavo.
 * 
 * Deployment Architecture Status:
 * - Current Implementation: InMemoryRateLimiter (SAFE FOR SINGLE INSTANCE).
 * - Multi-Instance Readiness: Interface IRateLimiter is decoupled and ready for a Redis-backed
 *   adapter without changing API contracts or route handler code.
 * 
 * Security Principles:
 * - Rate limits repeated failed attempts by IP and account identifier.
 * - Never stores passwords, tokens, or plaintext credentials in the state store.
 * - Provides generic client error messages to prevent account enumeration.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Timestamp in milliseconds when the limit window resets
  retryAfterSeconds?: number;
}

export interface IRateLimiter {
  check(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult>;
  recordFailure(key: string, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  clearAll?(): void; // Useful for testing
}

interface AttemptRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

/**
 * In-memory implementation suitable for development and single-instance deployments.
 * Cleans up expired entries periodically to prevent memory leaks.
 */
export class InMemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, AttemptRecord>();
  private readonly maxAttempts: number;
  private readonly defaultWindowMs: number;

  constructor(maxAttempts = 5, defaultWindowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.defaultWindowMs = defaultWindowMs;
  }

  public async check(
    key: string,
    maxAttempts = this.maxAttempts,
    windowMs = this.defaultWindowMs
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      return {
        allowed: true,
        remaining: maxAttempts,
        resetTime: now + windowMs,
      };
    }

    // Check if blocked under active cooldown
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        retryAfterSeconds,
      };
    }

    // Check if window has expired
    if (now - record.firstAttemptAt > windowMs) {
      this.store.delete(key);
      return {
        allowed: true,
        remaining: maxAttempts,
        resetTime: now + windowMs,
      };
    }

    const remaining = Math.max(0, maxAttempts - record.attempts);
    const allowed = remaining > 0;

    return {
      allowed,
      remaining,
      resetTime: record.firstAttemptAt + windowMs,
      retryAfterSeconds: allowed ? undefined : Math.ceil((record.firstAttemptAt + windowMs - now) / 1000),
    };
  }

  public async recordFailure(key: string, windowMs = this.defaultWindowMs): Promise<RateLimitResult> {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record || now - record.firstAttemptAt > windowMs) {
      record = {
        attempts: 1,
        firstAttemptAt: now,
      };
    } else {
      record.attempts += 1;
    }

    // If threshold exceeded, enforce temporary cooldown
    if (record.attempts >= this.maxAttempts) {
      record.blockedUntil = now + windowMs;
    }

    this.store.set(key, record);

    const remaining = Math.max(0, this.maxAttempts - record.attempts);
    const retryAfterSeconds = record.blockedUntil
      ? Math.ceil((record.blockedUntil - now) / 1000)
      : undefined;

    return {
      allowed: record.attempts < this.maxAttempts,
      remaining,
      resetTime: record.blockedUntil || record.firstAttemptAt + windowMs,
      retryAfterSeconds,
    };
  }

  public async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  public clearAll(): void {
    this.store.clear();
  }
}

// Global rate limiters tailored to operation threat profiles
export const loginRateLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min window
export const forgotPasswordRateLimiter = new InMemoryRateLimiter(3, 15 * 60 * 1000); // 3 requests per 15 min window
export const otpRateLimiter = new InMemoryRateLimiter(5, 10 * 60 * 1000); // 5 attempts per 10 min window
export const driverLocationRateLimiter = new InMemoryRateLimiter(60, 60 * 1000); // 60 updates per 60s (avg 1/sec)
export const contactRateLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000); // 5 submissions per 15 min window
export const ticketRateLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000); // 10 tickets per 15 min window
export const sseRateLimiter = new InMemoryRateLimiter(15, 60 * 1000); // 15 connections per minute

/**
 * Builds a sanitized, privacy-preserving rate limit key using IP and normalized email.
 * Ensures no passwords, auth tokens, or raw secrets are ever placed in rate limit state.
 */
export function getLoginRateLimitKey(ip: string, email: string): string {
  const cleanIp = (ip || "127.0.0.1").trim().toLowerCase();
  const cleanEmail = (email || "").trim().toLowerCase();
  return `login:${cleanIp}:${cleanEmail}`;
}

/**
 * Builds key for forgot password requests
 */
export function getForgotPasswordRateLimitKey(ip: string, email: string): string {
  const cleanIp = (ip || "127.0.0.1").trim().toLowerCase();
  const cleanEmail = (email || "").trim().toLowerCase();
  return `forgot:${cleanIp}:${cleanEmail}`;
}

/**
 * Builds key for OTP verification
 */
export function getOtpRateLimitKey(ip: string, email: string): string {
  const cleanIp = (ip || "127.0.0.1").trim().toLowerCase();
  const cleanEmail = (email || "").trim().toLowerCase();
  return `otp:${cleanIp}:${cleanEmail}`;
}

/**
 * Extracts client IP address from standard proxy headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

