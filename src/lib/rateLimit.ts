
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

export interface IRateLimiter {
  check(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult>;
  recordFailure(key: string, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  clearAll?(): void;
}

interface AttemptRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

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

    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        retryAfterSeconds,
      };
    }

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

export const loginRateLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);
export const forgotPasswordRateLimiter = new InMemoryRateLimiter(3, 15 * 60 * 1000);
export const otpRateLimiter = new InMemoryRateLimiter(5, 10 * 60 * 1000);
export const driverLocationRateLimiter = new InMemoryRateLimiter(60, 60 * 1000);
export const contactRateLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);
export const ticketRateLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);
export const sseRateLimiter = new InMemoryRateLimiter(15, 60 * 1000);

export function getLoginRateLimitKey(ip: string, email: string): string {
  const cleanIp = (ip || "127.0.0.1").trim().toLowerCase();
  const cleanEmail = (email || "").trim().toLowerCase();
  return `login:${cleanIp}:${cleanEmail}`;
}

export function getForgotPasswordRateLimitKey(ip: string, email: string): string {
  const cleanIp = (ip || "127.0.0.1").trim().toLowerCase();
  const cleanEmail = (email || "").trim().toLowerCase();
  return `forgot:${cleanIp}:${cleanEmail}`;
}

export function getOtpRateLimitKey(ip: string, email: string): string {
  const cleanIp = (ip || "127.0.0.1").trim().toLowerCase();
  const cleanEmail = (email || "").trim().toLowerCase();
  return `otp:${cleanIp}:${cleanEmail}`;
}

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

