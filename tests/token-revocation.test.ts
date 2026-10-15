import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  signAuthToken,
  verifyAuthToken,
  AuthError,
  isAuthError,
} from "../src/lib/auth";

describe("Phase 1A Production Hardening: Token Revocation & Session Invalidation Tests", () => {
  const originalSecret = process.env.JWT_SECRET;

  before(() => {
    process.env.JWT_SECRET = "test_super_secure_jwt_secret_for_bhavo_auth_tests_12345";
  });

  after(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  const validateSessionAgainstUser = (
    jwtPayload: { id: string; email: string; role: string; tokenVersion?: number },
    currentUserInDb: { _id: string; status: string; tokenVersion: number }
  ) => {
    const userStatus = currentUserInDb.status || "ACTIVE";
    if (userStatus === "SUSPENDED" || userStatus === "DISABLED") {
      throw new AuthError("Access denied: Account is suspended or disabled", 403, "ACCOUNT_SUSPENDED");
    }

    const tokenVersionInJwt = jwtPayload.tokenVersion ?? 0;
    const currentDbTokenVersion = currentUserInDb.tokenVersion ?? 0;

    if (tokenVersionInJwt !== currentDbTokenVersion) {
      throw new AuthError("Unauthorized: Session has been revoked. Please log in again.", 401, "TOKEN_REVOKED");
    }

    return { valid: true, user: currentUserInDb };
  };

  it("Scenario 1: Existing valid token with matching tokenVersion succeeds authentication", async () => {
    const userDbRecord = {
      _id: "user_67041a9b4f1234567890abcd",
      status: "ACTIVE",
      tokenVersion: 0,
    };

    const token = await signAuthToken({
      id: userDbRecord._id,
      email: "rider.active@bhavo.in",
      role: "RIDER",
      tokenVersion: 0,
    });

    const payload = await verifyAuthToken(token);
    assert.equal(payload.tokenVersion, 0);

    const validation = validateSessionAgainstUser(payload as { id: string; email: string; role: string; tokenVersion: number }, userDbRecord);
    assert.equal(validation.valid, true);
    assert.equal(validation.user._id, userDbRecord._id);
  });

  it("Scenario 2: Token with incorrect/mismatched tokenVersion is rejected with TOKEN_REVOKED", async () => {
    const userDbRecord = {
      _id: "user_67041a9b4f1234567890abcd",
      status: "ACTIVE",
      tokenVersion: 2,
    };

    const staleToken = await signAuthToken({
      id: userDbRecord._id,
      email: "rider.active@bhavo.in",
      role: "RIDER",
      tokenVersion: 1,
    });

    const payload = await verifyAuthToken(staleToken);

    assert.throws(
      () => validateSessionAgainstUser(payload as { id: string; email: string; role: string; tokenVersion: number }, userDbRecord),
      (err: unknown) => {
        assert.ok(isAuthError(err));
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 401);
        assert.equal(authErr.code, "TOKEN_REVOKED");
        return true;
      }
    );
  });

  it("Scenario 3: User tokenVersion increment immediately invalidates previously issued token", async () => {
    const userDbRecord = {
      _id: "user_67041a9b4f1234567890abcd",
      status: "ACTIVE",
      tokenVersion: 0,
    };

    const initialToken = await signAuthToken({
      id: userDbRecord._id,
      email: "captain.vikram@bhavo.in",
      role: "DRIVER",
      tokenVersion: userDbRecord.tokenVersion,
    });

    const initialPayload = await verifyAuthToken(initialToken);
    assert.equal(validateSessionAgainstUser(initialPayload as { id: string; email: string; role: string; tokenVersion: number }, userDbRecord).valid, true);

    userDbRecord.tokenVersion += 1;

    assert.throws(
      () => validateSessionAgainstUser(initialPayload as { id: string; email: string; role: string; tokenVersion: number }, userDbRecord),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 401);
        assert.equal(authErr.code, "TOKEN_REVOKED");
        return true;
      }
    );
  });

  it("Scenario 4: Newly issued token with updated tokenVersion succeeds authentication", async () => {
    const userDbRecord = {
      _id: "user_67041a9b4f1234567890abcd",
      status: "ACTIVE",
      tokenVersion: 1,
    };

    const newToken = await signAuthToken({
      id: userDbRecord._id,
      email: "captain.vikram@bhavo.in",
      role: "DRIVER",
      tokenVersion: userDbRecord.tokenVersion,
    });

    const newPayload = await verifyAuthToken(newToken);
    assert.equal(newPayload.tokenVersion, 1);

    const validation = validateSessionAgainstUser(newPayload as { id: string; email: string; role: string; tokenVersion: number }, userDbRecord);
    assert.equal(validation.valid, true);
  });

  it("Scenario 5: Suspended/disabled user cannot access protected APIs even with a cryptographically valid token", async () => {
    const suspendedUser = {
      _id: "user_suspended_999",
      status: "SUSPENDED",
      tokenVersion: 0,
    };

    const disabledUser = {
      _id: "user_disabled_888",
      status: "DISABLED",
      tokenVersion: 0,
    };

    const tokenForSuspended = await signAuthToken({
      id: suspendedUser._id,
      email: "bad.actor@bhavo.in",
      role: "RIDER",
      tokenVersion: 0,
    });

    const tokenForDisabled = await signAuthToken({
      id: disabledUser._id,
      email: "deactivated@bhavo.in",
      role: "DRIVER",
      tokenVersion: 0,
    });

    const payloadSuspended = await verifyAuthToken(tokenForSuspended);
    const payloadDisabled = await verifyAuthToken(tokenForDisabled);

    assert.throws(
      () => validateSessionAgainstUser(payloadSuspended as { id: string; email: string; role: string; tokenVersion: number }, suspendedUser),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 403);
        assert.equal(authErr.code, "ACCOUNT_SUSPENDED");
        return true;
      }
    );

    assert.throws(
      () => validateSessionAgainstUser(payloadDisabled as { id: string; email: string; role: string; tokenVersion: number }, disabledUser),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 403);
        assert.equal(authErr.code, "ACCOUNT_SUSPENDED");
        return true;
      }
    );
  });
});
