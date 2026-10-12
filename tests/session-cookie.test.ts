import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAuthCookieOptions, getClearAuthCookieOptions, AUTH_COOKIE_NAME } from "../src/lib/auth";

describe("Phase 1A: Cookie & Session Security Configuration Tests", () => {
  // 30. Auth cookie is HTTP-only
  it("Scenario 30: Auth session cookie is strictly configured with httpOnly: true", () => {
    const cookie = getAuthCookieOptions("mock_jwt_token_123");

    assert.equal(cookie.name, AUTH_COOKIE_NAME);
    assert.equal(cookie.httpOnly, true, "Session cookie MUST be httpOnly to prevent XSS exfiltration");
  });

  // 31. Secure flag is used in production
  it("Scenario 31: Secure flag is enforced when NODE_ENV is production", () => {
    const envObj = process.env as Record<string, string | undefined>;
    const originalEnv = envObj.NODE_ENV;
    try {
      envObj.NODE_ENV = "production";
      const prodCookie = getAuthCookieOptions("mock_jwt_token_123");
      assert.equal(prodCookie.secure, true, "Session cookie MUST have secure: true in production");

      envObj.NODE_ENV = "development";
      const devCookie = getAuthCookieOptions("mock_jwt_token_123");
      assert.equal(devCookie.secure, false, "Dev cookie allows secure: false for local HTTP testing");
    } finally {
      envObj.NODE_ENV = originalEnv;
    }
  });

  // 32. Appropriate SameSite policy is used
  it("Scenario 32: Appropriate SameSite policy (lax) is configured to mitigate CSRF", () => {
    const cookie = getAuthCookieOptions("mock_jwt_token_123");

    assert.equal(cookie.sameSite, "lax", "Session cookie MUST use SameSite lax policy");
    assert.equal(cookie.path, "/", "Session cookie path must be root /");
  });

  // 33. Session expiration is enforced
  it("Scenario 33: Session expiration maxAge and clear options are properly enforced", () => {
    const sevenDaysInSeconds = 60 * 60 * 24 * 7;
    const cookie = getAuthCookieOptions("mock_jwt_token_123");

    assert.equal(cookie.maxAge, sevenDaysInSeconds, "Session maxAge must be 7 days (604,800 seconds)");

    const clearCookie = getClearAuthCookieOptions();
    assert.equal(clearCookie.value, "");
    assert.equal(clearCookie.maxAge, 0, "Clear cookie must immediately expire with maxAge: 0");
    assert.ok(clearCookie.expires instanceof Date);
    assert.equal(clearCookie.expires.getTime(), 0, "Clear cookie must have epoch expiry date");
  });
});
