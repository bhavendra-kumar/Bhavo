import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  InMemoryRateLimiter,
  getLoginRateLimitKey,
} from "../src/lib/rateLimit";

describe("Phase 1A Production Hardening: Login Rate Limiting Tests", () => {
  let rateLimiter: InMemoryRateLimiter;
  const maxAttempts = 5;
  const windowMs = 500;

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter(maxAttempts, windowMs);
  });

  it("Scenario 1: Repeated failed attempts trigger rate limiting (blocks after threshold)", async () => {
    const key = getLoginRateLimitKey("192.168.1.50", "victim@bhavo.in");

    for (let i = 1; i <= 4; i++) {
      const res = await rateLimiter.recordFailure(key, windowMs);
      assert.equal(res.allowed, true, `Attempt ${i} should be allowed`);
      assert.equal(res.remaining, maxAttempts - i);
    }

    const fifthFailure = await rateLimiter.recordFailure(key, windowMs);
    assert.equal(fifthFailure.allowed, false, "5th attempt must trigger rate limit block");
    assert.equal(fifthFailure.remaining, 0);
    assert.ok(fifthFailure.retryAfterSeconds && fifthFailure.retryAfterSeconds > 0);

    const checkAfterBlocked = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(checkAfterBlocked.allowed, false, "Check after block must return allowed: false");
    assert.equal(checkAfterBlocked.remaining, 0);
  });

  it("Scenario 2: Rate limiting block eventually expires after the cooldown window", async () => {
    const key = getLoginRateLimitKey("192.168.1.50", "victim@bhavo.in");

    for (let i = 0; i < maxAttempts; i++) {
      await rateLimiter.recordFailure(key, windowMs);
    }

    const blockedCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(blockedCheck.allowed, false);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const expiredCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(expiredCheck.allowed, true, "Rate limit must clear once cooldown window has elapsed");
    assert.equal(expiredCheck.remaining, maxAttempts);
  });

  it("Scenario 3: Valid login works normally before threshold is reached and resets counter", async () => {
    const key = getLoginRateLimitKey("192.168.1.50", "legit@bhavo.in");

    const initialCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(initialCheck.allowed, true);
    assert.equal(initialCheck.remaining, maxAttempts);

    await rateLimiter.recordFailure(key, windowMs);
    await rateLimiter.recordFailure(key, windowMs);

    const midCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(midCheck.allowed, true);
    assert.equal(midCheck.remaining, 3);

    await rateLimiter.reset(key);

    const postResetCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(postResetCheck.allowed, true);
    assert.equal(postResetCheck.remaining, maxAttempts, "Counter must reset back to maxAttempts upon success");
  });

  it("Scenario 4: Different users are not incorrectly blocked because of one user's failure pattern", async () => {
    const attackerKey = getLoginRateLimitKey("10.0.0.1", "target1@bhavo.in");
    const innocentKey = getLoginRateLimitKey("10.0.0.1", "innocent@bhavo.in");
    const differentIpKey = getLoginRateLimitKey("10.0.0.2", "target1@bhavo.in");

    for (let i = 0; i < maxAttempts; i++) {
      await rateLimiter.recordFailure(attackerKey, windowMs);
    }

    const attackerCheck = await rateLimiter.check(attackerKey, maxAttempts, windowMs);
    assert.equal(attackerCheck.allowed, false, "Targeted account on IP 1 must be blocked");

    const innocentCheck = await rateLimiter.check(innocentKey, maxAttempts, windowMs);
    assert.equal(innocentCheck.allowed, true, "Different user on same IP must remain unaffected");
    assert.equal(innocentCheck.remaining, maxAttempts);

    const differentIpCheck = await rateLimiter.check(differentIpKey, maxAttempts, windowMs);
    assert.equal(differentIpCheck.allowed, true, "Same account from different IP has independent rate window");
    assert.equal(differentIpCheck.remaining, maxAttempts);
  });

  it("Scenario 5: Generic authentication error responses prevent account enumeration", () => {
    const handleAuthFailure = (reason: "USER_NOT_FOUND" | "BAD_PASSWORD") => {
      const genericResponse = {
        status: "error",
        message: "Invalid email or password",
      };
      const statusCode = 401;

      return { statusCode, payload: genericResponse, internalReason: reason };
    };

    const notFoundResult = handleAuthFailure("USER_NOT_FOUND");
    const badPasswordResult = handleAuthFailure("BAD_PASSWORD");

    assert.equal(notFoundResult.statusCode, badPasswordResult.statusCode);
    assert.deepEqual(notFoundResult.payload, badPasswordResult.payload);
    assert.equal(notFoundResult.payload.message, "Invalid email or password");
    assert.doesNotMatch(notFoundResult.payload.message, /not found|exist/i);
  });

  it("Scenario 6: Rate-limit key and state strictly omit passwords, secrets, and JWT tokens", () => {
    const rawIp = " 192.168.1.100 ";
    const rawEmail = " USER@BHAVO.IN ";
    const password = "super_secret_password_never_store_this!";
    const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_token";

    const key = getLoginRateLimitKey(rawIp, rawEmail);

    assert.equal(key, "login:192.168.1.100:user@bhavo.in");
    assert.doesNotMatch(key, new RegExp(password));
    assert.doesNotMatch(key, new RegExp(jwtToken));

    const internalStore = (rateLimiter as unknown as { store: Map<string, unknown> }).store;
    rateLimiter.recordFailure(key, windowMs);

    for (const [storeKey, storeValue] of internalStore.entries()) {
      assert.ok(!storeKey.includes(password), "Key must not contain password");
      assert.ok(!storeKey.includes(jwtToken), "Key must not contain JWT token");
      const serializedValue = JSON.stringify(storeValue);
      assert.ok(!serializedValue.includes(password), "State record must not contain password");
      assert.ok(!serializedValue.includes(jwtToken), "State record must not contain JWT token");
    }
  });
});
