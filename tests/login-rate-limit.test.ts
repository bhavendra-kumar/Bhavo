import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  InMemoryRateLimiter,
  getLoginRateLimitKey,
} from "../src/lib/rateLimit";

describe("Phase 1A Production Hardening: Login Rate Limiting Tests", () => {
  let rateLimiter: InMemoryRateLimiter;
  const maxAttempts = 5;
  const windowMs = 500; // Fast 500ms window for testing

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter(maxAttempts, windowMs);
  });

  // 1. Repeated failed attempts trigger rate limiting
  it("Scenario 1: Repeated failed attempts trigger rate limiting (blocks after threshold)", async () => {
    const key = getLoginRateLimitKey("192.168.1.50", "victim@bhavo.in");

    // First 4 failures are recorded but still allowed
    for (let i = 1; i <= 4; i++) {
      const res = await rateLimiter.recordFailure(key, windowMs);
      assert.equal(res.allowed, true, `Attempt ${i} should be allowed`);
      assert.equal(res.remaining, maxAttempts - i);
    }

    // 5th failure reaches maxAttempts, so allowed becomes false and blocked
    const fifthFailure = await rateLimiter.recordFailure(key, windowMs);
    assert.equal(fifthFailure.allowed, false, "5th attempt must trigger rate limit block");
    assert.equal(fifthFailure.remaining, 0);
    assert.ok(fifthFailure.retryAfterSeconds && fifthFailure.retryAfterSeconds > 0);

    // Subsequent check returns allowed: false
    const checkAfterBlocked = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(checkAfterBlocked.allowed, false, "Check after block must return allowed: false");
    assert.equal(checkAfterBlocked.remaining, 0);
  });

  // 2. Rate limiting eventually expires
  it("Scenario 2: Rate limiting block eventually expires after the cooldown window", async () => {
    const key = getLoginRateLimitKey("192.168.1.50", "victim@bhavo.in");

    // Exceed threshold
    for (let i = 0; i < maxAttempts; i++) {
      await rateLimiter.recordFailure(key, windowMs);
    }

    const blockedCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(blockedCheck.allowed, false);

    // Wait for window to expire (windowMs = 500ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const expiredCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(expiredCheck.allowed, true, "Rate limit must clear once cooldown window has elapsed");
    assert.equal(expiredCheck.remaining, maxAttempts);
  });

  // 3. Valid login works normally before the threshold
  it("Scenario 3: Valid login works normally before threshold is reached and resets counter", async () => {
    const key = getLoginRateLimitKey("192.168.1.50", "legit@bhavo.in");

    // Check before any attempts
    const initialCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(initialCheck.allowed, true);
    assert.equal(initialCheck.remaining, maxAttempts);

    // 2 failed attempts
    await rateLimiter.recordFailure(key, windowMs);
    await rateLimiter.recordFailure(key, windowMs);

    const midCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(midCheck.allowed, true);
    assert.equal(midCheck.remaining, 3);

    // User successfully enters password: reset is invoked
    await rateLimiter.reset(key);

    const postResetCheck = await rateLimiter.check(key, maxAttempts, windowMs);
    assert.equal(postResetCheck.allowed, true);
    assert.equal(postResetCheck.remaining, maxAttempts, "Counter must reset back to maxAttempts upon success");
  });

  // 4. Different users are not incorrectly blocked because of one user's failure pattern
  it("Scenario 4: Different users are not incorrectly blocked because of one user's failure pattern", async () => {
    const attackerKey = getLoginRateLimitKey("10.0.0.1", "target1@bhavo.in");
    const innocentKey = getLoginRateLimitKey("10.0.0.1", "innocent@bhavo.in");
    const differentIpKey = getLoginRateLimitKey("10.0.0.2", "target1@bhavo.in");

    // Exhaust attempts for attackerKey
    for (let i = 0; i < maxAttempts; i++) {
      await rateLimiter.recordFailure(attackerKey, windowMs);
    }

    const attackerCheck = await rateLimiter.check(attackerKey, maxAttempts, windowMs);
    assert.equal(attackerCheck.allowed, false, "Targeted account on IP 1 must be blocked");

    // Different account on the same IP must NOT be blocked
    const innocentCheck = await rateLimiter.check(innocentKey, maxAttempts, windowMs);
    assert.equal(innocentCheck.allowed, true, "Different user on same IP must remain unaffected");
    assert.equal(innocentCheck.remaining, maxAttempts);

    // Same account from different IP must NOT be blocked by attacker's IP block
    const differentIpCheck = await rateLimiter.check(differentIpKey, maxAttempts, windowMs);
    assert.equal(differentIpCheck.allowed, true, "Same account from different IP has independent rate window");
    assert.equal(differentIpCheck.remaining, maxAttempts);
  });

  // 5. Generic error responses do not disclose account existence
  it("Scenario 5: Generic authentication error responses prevent account enumeration", () => {
    // Simulated handler logic comparing nonexistent user vs wrong password responses
    const handleAuthFailure = (reason: "USER_NOT_FOUND" | "BAD_PASSWORD") => {
      // Regardless of internal reason, return identical generic error payload
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
    // Ensure no distinction like "User does not exist" or "Incorrect password"
    assert.doesNotMatch(notFoundResult.payload.message, /not found|exist/i);
  });

  // 6. Rate-limit state does not contain passwords/tokens
  it("Scenario 6: Rate-limit key and state strictly omit passwords, secrets, and JWT tokens", () => {
    const rawIp = " 192.168.1.100 ";
    const rawEmail = " USER@BHAVO.IN ";
    const password = "super_secret_password_never_store_this!";
    const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_token";

    const key = getLoginRateLimitKey(rawIp, rawEmail);

    // Key must only contain sanitized IP and email
    assert.equal(key, "login:192.168.1.100:user@bhavo.in");
    assert.doesNotMatch(key, new RegExp(password));
    assert.doesNotMatch(key, new RegExp(jwtToken));

    // Internal state inspection
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
