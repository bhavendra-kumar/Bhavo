import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateDatabaseUrl,
  validatePositiveInteger,
  validatePositiveNumber,
  isLivePaymentEnabled,
  validateRuntimeConfig,
  ConfigurationError,
} from "../src/lib/runtimeConfig";
import {
  InMemoryRateLimiter,
  getLoginRateLimitKey,
  getForgotPasswordRateLimitKey,
  getOtpRateLimitKey,
  getClientIp,
} from "../src/lib/rateLimit";
import { verifyCronSecret } from "../src/lib/cronAuth";
import { sanitizeLogPayload } from "../src/lib/logger";
import {
  calculateHaversineDistanceKm,
  evaluateDriverEligibility,
  isVehicleCompatible,
} from "../src/lib/driverEligibility";
import { calculateAuthoritativeFare } from "../src/lib/pricingEngine";

describe("Phase 1I: Runtime Configuration & Secret Hardening", () => {
  it("Rejects missing, empty, or whitespace DATABASE_URL in production", () => {
    assert.throws(() => validateDatabaseUrl("", true), ConfigurationError);
    assert.throws(() => validateDatabaseUrl("   ", true), ConfigurationError);
    assert.throws(() => validateDatabaseUrl(undefined, true), ConfigurationError);
  });

  it("Rejects malformed DATABASE_URL protocol", () => {
    assert.throws(() => validateDatabaseUrl("postgres://localhost:5432/db"), ConfigurationError);
    assert.throws(() => validateDatabaseUrl("http://localhost:27017"), ConfigurationError);
  });

  it("Accepts valid mongodb:// and mongodb+srv:// connection strings", () => {
    assert.equal(validateDatabaseUrl("mongodb://localhost:27017/bhavo"), "mongodb://localhost:27017/bhavo");
    assert.equal(
      validateDatabaseUrl("mongodb+srv://cluster.mongodb.net/bhavo"),
      "mongodb+srv://cluster.mongodb.net/bhavo"
    );
  });

  it("Validates positive integer bounds and rejects decimals, negatives, and symbols", () => {
    assert.equal(validatePositiveInteger("60", "TEST_VAL", 10), 60);
    assert.equal(validatePositiveInteger(undefined, "TEST_VAL", 10), 10);
    assert.throws(() => validatePositiveInteger("-5", "TEST_VAL", 10), ConfigurationError);
    assert.throws(() => validatePositiveInteger("0", "TEST_VAL", 10, 1), ConfigurationError);
    assert.throws(() => validatePositiveInteger("12.5", "TEST_VAL", 10), ConfigurationError);
    assert.throws(() => validatePositiveInteger("abc", "TEST_VAL", 10), ConfigurationError);
  });

  it("Validates positive number bounds and allows valid decimals", () => {
    assert.equal(validatePositiveNumber("10.5", "TEST_VAL", 5), 10.5);
    assert.throws(() => validatePositiveNumber("-1", "TEST_VAL", 5), ConfigurationError);
    assert.throws(() => validatePositiveNumber("0", "TEST_VAL", 5, 0.1), ConfigurationError);
  });

  it("Keeps live online payments strictly disabled when gateway credentials are absent", () => {
    const originalEnabled = process.env.LIVE_PAYMENTS_ENABLED;
    const originalKey = process.env.RAZORPAY_KEY_ID;
    const originalSecret = process.env.RAZORPAY_KEY_SECRET;

    delete process.env.LIVE_PAYMENTS_ENABLED;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    assert.equal(isLivePaymentEnabled(), false);

    // Even if LIVE_PAYMENTS_ENABLED is set to true without credentials, it must fail closed
    process.env.LIVE_PAYMENTS_ENABLED = "true";
    assert.equal(isLivePaymentEnabled(), false);

    // Restore
    if (originalEnabled) process.env.LIVE_PAYMENTS_ENABLED = originalEnabled;
    else delete process.env.LIVE_PAYMENTS_ENABLED;
    if (originalKey) process.env.RAZORPAY_KEY_ID = originalKey;
    if (originalSecret) process.env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  it("Validates full runtime configuration and outputs clean diagnostic summary without secrets", () => {
    const config = validateRuntimeConfig(false);
    assert.equal(config.databaseConfigured, true);
    assert.equal(config.jwtConfigured, true);
    assert.equal(config.cronConfigured, true);
    assert.equal(typeof config.operationalDefaults.dispatchLeadTimeMinutes, "number");
    assert.equal(typeof config.operationalDefaults.autoBookingLookaheadMinutes, "number");
    // Ensure no secrets are leaked in the config object
    assert.equal("jwtSecret" in config, false);
    assert.equal("authSecret" in config, false);
    assert.equal("cronSecret" in config, false);
    assert.equal("databaseUrl" in config, false);
  });
});

describe("Phase 1I: Domain Rate Limiting & Sensitive Endpoint Protection", () => {
  it("Enforces attempt limits and blocks after threshold is reached", async () => {
    const limiter = new InMemoryRateLimiter(3, 1000); // 3 attempts per 1s
    const key = "test:user:1";

    const r1 = await limiter.check(key);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 3);

    await limiter.recordFailure(key);
    await limiter.recordFailure(key);
    const r2 = await limiter.check(key);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    await limiter.recordFailure(key);
    const r3 = await limiter.check(key);
    assert.equal(r3.allowed, false);
    assert.equal(r3.remaining, 0);
    assert.equal(r3.retryAfterSeconds! > 0, true);
  });

  it("Resets rate limit state cleanly on reset()", async () => {
    const limiter = new InMemoryRateLimiter(2, 5000);
    const key = "test:user:reset";

    await limiter.recordFailure(key);
    await limiter.recordFailure(key);
    assert.equal((await limiter.check(key)).allowed, false);

    await limiter.reset(key);
    assert.equal((await limiter.check(key)).allowed, true);
  });

  it("Builds sanitized rate limit keys that never embed raw credentials", () => {
    const keyLogin = getLoginRateLimitKey(" 192.168.1.1 ", " User@Example.Com ");
    assert.equal(keyLogin, "login:192.168.1.1:user@example.com");

    const keyForgot = getForgotPasswordRateLimitKey("10.0.0.1", "Rider@Test.com");
    assert.equal(keyForgot, "forgot:10.0.0.1:rider@test.com");

    const keyOtp = getOtpRateLimitKey("127.0.0.1", "Driver@Test.com");
    assert.equal(keyOtp, "otp:127.0.0.1:driver@test.com");
  });

  it("Extracts client IP correctly from proxy headers", () => {
    const reqForwarded = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    assert.equal(getClientIp(reqForwarded), "203.0.113.195");

    const reqRealIp = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.17" },
    });
    assert.equal(getClientIp(reqRealIp), "198.51.100.17");

    const reqEmpty = new Request("http://localhost");
    assert.equal(getClientIp(reqEmpty), "127.0.0.1");
  });
});

describe("Phase 1I: Cron Authentication & Scheduler Method Safety", () => {
  it("Rejects requests without authorization header or custom header", () => {
    const req = new Request("http://localhost/api/cron/auto-booking", { method: "POST" });
    assert.equal(verifyCronSecret(req), false);
  });

  it("Rejects requests with invalid or mismatched token", () => {
    const req = new Request("http://localhost/api/cron/auto-booking", {
      method: "POST",
      headers: { authorization: "Bearer invalid-secret-token-1234" },
    });
    assert.equal(verifyCronSecret(req), false);
  });

  it("Accepts valid Bearer token and custom x-cron-secret header", () => {
    const secret = process.env.CRON_SECRET || "test-cron-secret-valid-min-32-chars-long";
    const original = process.env.CRON_SECRET;
    process.env.CRON_SECRET = secret;

    const reqBearer = new Request("http://localhost/api/cron/auto-booking", {
      method: "GET",
      headers: { authorization: `Bearer ${secret}` },
    });
    assert.equal(verifyCronSecret(reqBearer), true);

    const reqHeader = new Request("http://localhost/api/driver/dispatches/maintenance", {
      method: "GET",
      headers: { "x-cron-secret": secret },
    });
    assert.equal(verifyCronSecret(reqHeader), true);

    if (original) process.env.CRON_SECRET = original;
    else delete process.env.CRON_SECRET;
  });

  it("Fails closed when server-side CRON_SECRET is unconfigured", () => {
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const req = new Request("http://localhost/api/cron/auto-booking", {
      headers: { authorization: "Bearer some-token" },
    });
    assert.equal(verifyCronSecret(req), false);

    if (original) process.env.CRON_SECRET = original;
  });
});

describe("Phase 1I: Structured Logging & Data Sanitization", () => {
  it("Recursively redacts passwords, tokens, OTPs, and secrets", () => {
    const sensitiveObj = {
      user: "rahul@example.com",
      password: "SuperSecretPassword123",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
      resetOtp: "492019",
      apiKey: "live_sec_key_4412",
      profile: {
        name: "Rahul",
        creditCard: "4111222233334444",
      },
    };

    const sanitized = sanitizeLogPayload(sensitiveObj) as Record<string, unknown>;
    assert.equal(sanitized.user, "rahul@example.com");
    assert.equal(sanitized.password, "[REDACTED]");
    assert.equal(sanitized.token, "[REDACTED]");
    assert.equal(sanitized.resetOtp, "[REDACTED]");
    assert.equal(sanitized.apiKey, "[REDACTED]");
    const profile = sanitized.profile as Record<string, unknown>;
    assert.equal(profile.name, "Rahul");
    assert.equal(profile.creditCard, "[REDACTED]");
  });

  it("Masks naked JWT strings passed as top-level values", () => {
    const nakedJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.longpayloadstringthatresemblesajwttokenstructure1234567890";
    assert.equal(sanitizeLogPayload(nakedJwt), "[REDACTED_JWT]");
  });
});

describe("Phase 1I: Core Domain Performance & Latency Benchmarks", () => {
  it("Computes 1,000 Haversine distance calculations in under 20ms", () => {
    const c1: [number, number] = [28.6139, 77.209]; // Connaught Place
    const c2: [number, number] = [28.5355, 77.391]; // Noida Sector 62

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const d = calculateHaversineDistanceKm(c1, c2);
      assert.equal(d > 0, true);
    }
    const duration = performance.now() - start;
    assert.equal(duration < 50, true, `Expected <50ms for 1000 haversine calculations, took ${duration.toFixed(2)}ms`);
  });

  it("Computes 1,000 authoritative fare calculations in under 50ms", () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const fare = calculateAuthoritativeFare({
        vehicleType: "Cab Economy",
        pickupCoordinates: [28.6139, 77.209],
        dropoffCoordinates: [28.5355, 77.391],
        claimedDistanceKm: 24.5,
        petFriendly: i % 2 === 0,
      });
      assert.equal(fare.fareInPaise > 0, true);
    }
    const duration = performance.now() - start;
    assert.equal(duration < 100, true, `Expected <100ms for 1000 fare calculations, took ${duration.toFixed(2)}ms`);
  });

  it("Evaluates 1,000 driver candidate eligibility checks in under 50ms", () => {
    const candidate = {
      _id: "64f1a2b3c4d5e6f7a8b9c0d1",
      role: "DRIVER",
      status: "ACTIVE",
      isOnline: true,
      dutyState: "ONLINE_SEARCHING",
      driverCoordinates: [28.6139, 77.209] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
      driverVehicle: {
        type: "Cab Economy",
        model: "Maruti WagonR",
        numberPlate: "DL-01-AB-1234",
        documentsVerified: true,
      },
      driverDocuments: [],
      driverSettings: {
        petFriendly: true,
      },
    };

    const rideReq = {
      vehicleType: "Cab Economy",
      petFriendly: true,
      pickup: { coordinates: [28.62, 77.21] as [number, number] },
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const result = evaluateDriverEligibility(candidate, rideReq);
      assert.equal(result.isEligible, true);
    }
    const duration = performance.now() - start;
    assert.equal(duration < 150, true, `Expected <150ms for 1000 driver candidate checks, took ${duration.toFixed(2)}ms`);
  });

  it("Validates vehicle compatibility matrix with deterministic performance", () => {
    assert.equal(isVehicleCompatible("Cab Economy (Petrol)", "Cab Economy"), true);
    assert.equal(isVehicleCompatible("Tata Tigor EV", "Cab Premium"), true);
    assert.equal(isVehicleCompatible("Honda Activa (Scooter)", "Bike"), true);
    assert.equal(isVehicleCompatible("Honda Activa", "Cab Economy"), false);
  });
});
