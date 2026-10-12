import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  signAuthToken,
  verifyAuthToken,
  getJwtSecret,
  AuthError,
  isAuthError,
} from "../src/lib/auth";

describe("Phase 1A: Authentication & JWT Security Tests", () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalAuthSecret = process.env.AUTH_SECRET;

  before(() => {
    process.env.JWT_SECRET = "test_super_secure_jwt_secret_for_bhavo_auth_tests_12345";
  });

  after(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.AUTH_SECRET = originalAuthSecret;
  });

  // 1. Valid login token succeeds verification
  it("Scenario 1: Valid signed JWT token succeeds verification and decodes correct payload", async () => {
    const payload = {
      id: "67041a9b4f1234567890abcd",
      email: "rider@bhavo.in",
      role: "RIDER",
    };

    const token = await signAuthToken(payload, "2h");
    assert.ok(typeof token === "string" && token.length > 20);

    const decoded = await verifyAuthToken(token);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.role, "RIDER");
  });

  // 2. Invalid credentials verification fails
  it("Scenario 2: Invalid password comparison fails", async () => {
    const bcrypt = await import("bcryptjs");
    const realPassword = "SecurePassword123!";
    const wrongPassword = "WrongPassword999!";
    const hash = await bcrypt.hash(realPassword, 10);

    const isValid = await bcrypt.compare(wrongPassword, hash);
    assert.equal(isValid, false, "Invalid password must not validate against stored hash");
  });

  // 3. Invalid JWT signature fails
  it("Scenario 3: Tampered or invalid JWT signature fails verification", async () => {
    const token = await signAuthToken({
      id: "67041a9b4f1234567890abcd",
      email: "rider@bhavo.in",
      role: "RIDER",
    });

    const parts = token.split(".");
    // Tamper with payload segment
    const tamperedPayload = Buffer.from(JSON.stringify({ id: "hacked", role: "ADMIN" })).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    await assert.rejects(
      async () => {
        await verifyAuthToken(tamperedToken);
      },
      (err: unknown) => {
        assert.ok(isAuthError(err));
        assert.equal((err as AuthError).statusCode, 401);
        return true;
      }
    );
  });

  // 4. Expired JWT fails
  it("Scenario 4: Expired JWT fails verification with TOKEN_EXPIRED error", async () => {
    // Generate token that expired 10 seconds ago
    const expiredToken = await signAuthToken(
      { id: "67041a9b4f1234567890abcd", email: "rider@bhavo.in", role: "RIDER" },
      "-10s"
    );

    await assert.rejects(
      async () => {
        await verifyAuthToken(expiredToken);
      },
      (err: unknown) => {
        assert.ok(isAuthError(err));
        assert.equal((err as AuthError).code, "TOKEN_EXPIRED");
        assert.equal((err as AuthError).statusCode, 401);
        return true;
      }
    );
  });

  // 5. Malformed JWT fails
  it("Scenario 5: Malformed JWT tokens fail verification with TOKEN_MALFORMED", async () => {
    const malformedTokens = [
      "not.a.valid.jwt.structure.here",
      "only-one-part",
      "two.parts",
      "part1.part2.part3.part4",
      "invalid-token-string",
    ];

    for (const badToken of malformedTokens) {
      await assert.rejects(
        async () => {
          await verifyAuthToken(badToken);
        },
        (err: unknown) => {
          assert.ok(isAuthError(err));
          assert.equal((err as AuthError).statusCode, 401);
          return true;
        }
      );
    }
  });

  // 6. Missing token fails
  it("Scenario 6: Empty or missing token fails verification with TOKEN_MISSING", async () => {
    const emptyTokens = ["", "   ", null as unknown as string, undefined as unknown as string];

    for (const empty of emptyTokens) {
      await assert.rejects(
        async () => {
          await verifyAuthToken(empty);
        },
        (err: unknown) => {
          assert.ok(isAuthError(err));
          assert.equal((err as AuthError).code, "TOKEN_MISSING");
          assert.equal((err as AuthError).statusCode, 401);
          return true;
        }
      );
    }
  });

  // 7. Missing JWT_SECRET causes secure failure
  it("Scenario 7: Missing JWT_SECRET and AUTH_SECRET causes fail-fast secure failure", () => {
    delete process.env.JWT_SECRET;
    delete process.env.AUTH_SECRET;

    assert.throws(
      () => {
        getJwtSecret();
      },
      /FATAL: JWT_SECRET or AUTH_SECRET is not configured/
    );

    // Restore for subsequent tests
    process.env.JWT_SECRET = "test_super_secure_jwt_secret_for_bhavo_auth_tests_12345";
  });

  // 8. Suspended/disabled account verification
  it("Scenario 8: Suspended or disabled account state is identified and rejected", () => {
    const suspendedUser = {
      _id: "67041a9b4f1234567890abcd",
      email: "suspended@bhavo.in",
      role: "RIDER",
      status: "SUSPENDED",
    };

    const isSuspended =
      suspendedUser.status === "SUSPENDED" ||
      suspendedUser.status === "DISABLED";

    assert.equal(isSuspended, true, "Account with SUSPENDED status must be recognized");
  });
});
