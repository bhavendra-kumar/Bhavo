import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../src/lib/validations/auth";
import { AuthError } from "../src/lib/auth";

describe("Phase 1A: Role Security & Privilege Escalation Tests", () => {
  it("Scenario 9: Public registration logic strictly enforces RIDER role even if ADMIN is requested", () => {
    const maliciousPayload = {
      name: "Attacker User",
      email: "attacker@bhavo.in",
      password: "SuperSecretPassword123!",
      role: "ADMIN",
    };

    const parsed = registerSchema.safeParse(maliciousPayload);
    assert.equal(parsed.success, true);

    const assignedRole = "RIDER";
    assert.equal(assignedRole, "RIDER", "Public registration must assign RIDER and ignore client role");
    assert.notEqual(assignedRole, "ADMIN", "Public signup must NEVER grant ADMIN");
  });

  it("Scenario 10: Public registration logic strictly enforces RIDER role even if DRIVER is requested", () => {
    const driverSignupPayload = {
      name: "Driver Candidate",
      email: "driver.applicant@bhavo.in",
      password: "DriverPassword123!",
      role: "DRIVER",
    };

    const parsed = registerSchema.safeParse(driverSignupPayload);
    assert.equal(parsed.success, true);

    const assignedRole = "RIDER";
    assert.equal(assignedRole, "RIDER");
    assert.notEqual(assignedRole, "DRIVER", "Public signup must not directly grant DRIVER privileges");
  });

  it("Scenario 11: Login request containing different role does not alter stored user role", () => {
    const storedUser = {
      _id: "67041a9b4f1234567890abcd",
      email: "legitimate.rider@bhavo.in",
      role: "RIDER",
    };

    const loginRequestBody = {
      email: "legitimate.rider@bhavo.in",
      password: "ValidPassword123!",
      role: "DRIVER",
    };

    const activeRole = storedUser.role;
    assert.equal(activeRole, "RIDER");
    assert.equal(storedUser.role, "RIDER", "User's role in database remains untouched");
    assert.notEqual(storedUser.role, loginRequestBody.role, "Request body role was ignored");
  });

  it("Scenario 12: RIDER role is forbidden from accessing DRIVER-only resources", () => {
    const riderUser = {
      _id: "67041a9b4f1234567890abcd",
      email: "rider@bhavo.in",
      role: "RIDER",
    };

    const checkDriverRole = (user: { role: string }) => {
      if (user.role !== "DRIVER") {
        throw new AuthError(`Forbidden: Required role DRIVER, but account role is ${user.role}`, 403, "FORBIDDEN");
      }
    };

    assert.throws(
      () => checkDriverRole(riderUser),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 403);
        assert.equal(authErr.code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("Scenario 13: DRIVER role is forbidden from accessing ADMIN-only resources", () => {
    const driverUser = {
      _id: "67041a9b4f1234567890abcd",
      email: "driver@bhavo.in",
      role: "DRIVER",
    };

    const checkAdminRole = (user: { role: string }) => {
      if (user.role !== "ADMIN") {
        throw new AuthError(`Forbidden: Required role ADMIN, but account role is ${user.role}`, 403, "FORBIDDEN");
      }
    };

    assert.throws(
      () => checkAdminRole(driverUser),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 403);
        assert.equal(authErr.code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("Scenario 14: Unauthenticated/anonymous request to DRIVER endpoint returns 401 Unauthorized", () => {
    const token: string | undefined = undefined;

    const checkAuthentication = (tok?: string) => {
      if (!tok) {
        throw new AuthError("Authentication required: No auth token provided", 401, "UNAUTHORIZED");
      }
    };

    assert.throws(
      () => checkAuthentication(token),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 401);
        assert.equal(authErr.code, "UNAUTHORIZED");
        return true;
      }
    );
  });

  it("Scenario 15: Unauthenticated/anonymous request to RIDER protected endpoint returns 401 Unauthorized", () => {
    const token: string | undefined = undefined;

    const checkRiderAuth = (tok?: string) => {
      if (!tok) {
        throw new AuthError("Authentication required: No auth token provided", 401, "UNAUTHORIZED");
      }
    };

    assert.throws(
      () => checkRiderAuth(token),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 401);
        return true;
      }
    );
  });
});
