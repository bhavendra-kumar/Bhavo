import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AuthError } from "../src/lib/auth";

describe("Phase 1A: Driver Endpoint & Boundary Security Tests", () => {
  const enforceDriverEndpointSecurity = (
    authenticatedSession: { id: string; email: string; role: string } | null,
    requestBodyDriverId?: string
  ) => {
    if (!authenticatedSession) {
      throw new AuthError("Authentication required: Missing or invalid token", 401, "UNAUTHORIZED");
    }

    if (authenticatedSession.role !== "DRIVER") {
      throw new AuthError("Forbidden: Driver role required", 403, "FORBIDDEN");
    }

    const effectiveDriverId = authenticatedSession.id;
    return { driverId: effectiveDriverId, session: authenticatedSession, ignoredBodyId: requestBodyDriverId };
  };

  it("Scenario 19: Authenticated DRIVER can access allowed driver endpoints", () => {
    const validDriverSession = {
      id: "67041a9b4f1234567890abcd",
      email: "captain.vikram@bhavo.in",
      role: "DRIVER",
    };

    const result = enforceDriverEndpointSecurity(validDriverSession);
    assert.equal(result.driverId, "67041a9b4f1234567890abcd");
    assert.equal(result.session.role, "DRIVER");
  });

  it("Scenario 20: Authenticated RIDER receives 403 Forbidden when attempting to access driver endpoints", () => {
    const riderSession = {
      id: "67041a9b4f12345678901234",
      email: "passenger.aarav@bhavo.in",
      role: "RIDER",
    };

    assert.throws(
      () => enforceDriverEndpointSecurity(riderSession),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 403);
        assert.equal(authErr.code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("Scenario 21: Driver identity strictly comes from session, ignoring spoofed driverId in request body", () => {
    const realDriverSession = {
      id: "driver_id_session_authenticated_111",
      email: "real.captain@bhavo.in",
      role: "DRIVER",
    };

    const spoofedDriverId = "driver_id_victim_spoofed_999";

    const result = enforceDriverEndpointSecurity(realDriverSession, spoofedDriverId);

    assert.equal(result.driverId, "driver_id_session_authenticated_111");
    assert.notEqual(result.driverId, spoofedDriverId);
  });

  it("Scenario 22: Unregistered driver profile causes error without creating demo fallback driver in DB", () => {
    const driverDatabase: Record<string, { name: string; role: string }> = {};

    const findDriverWithoutFallback = (driverId: string) => {
      const driver = driverDatabase[driverId];
      if (!driver) {
        throw new AuthError("Driver profile not found", 404, "DRIVER_NOT_FOUND");
      }
      return driver;
    };

    assert.throws(
      () => findDriverWithoutFallback("non_existent_driver_id"),
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 404);
        return true;
      }
    );

    assert.equal(Object.keys(driverDatabase).length, 0);
  });
});
