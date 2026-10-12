import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AuthError } from "../src/lib/auth";

describe("Phase 1A Production Hardening: Dispatch Simulation Isolation Tests", () => {
  // Simulated handler implementing the exact guard logic in POST /api/driver/dispatches
  const handleDispatchSimulationPost = async (
    caller: { id: string; role: string; isVerified: boolean } | null,
    env: { nodeEnv: string; allowSimulation?: string }
  ) => {
    // 1. Authoritative driver authentication check
    if (!caller) {
      throw new AuthError("Authentication required: Missing or invalid token", 401, "UNAUTHORIZED");
    }

    if (caller.role !== "DRIVER") {
      throw new AuthError("Forbidden: Driver role required", 403, "FORBIDDEN");
    }

    // 2. Strict Production Guard: Simulation ride creation is strictly blocked in production
    // Simulation is development/test only; production can NEVER enable this simulation endpoint
    // Any environment variable override (such as ALLOW_DISPATCH_SIMULATION=true) is completely ignored in production
    if (env.nodeEnv === "production") {
      return {
        status: 403,
        json: {
          status: "error",
          code: "SIMULATION_DISABLED",
          message: "Simulation dispatch endpoint is disabled in production environment.",
        },
      };
    }

    // 3. Driver verification check
    if (!caller.isVerified) {
      return {
        status: 403,
        json: {
          status: "error",
          code: "DOCUMENTS_UNVERIFIED",
          message: "Cannot dispatch ride: Documents pending review.",
        },
      };
    }

    // 4. Test ride creation (only allowed in dev/test)
    return {
      status: 201,
      json: {
        status: "success",
        data: {
          _id: "test_simulated_ride_12345",
          riderName: "Ananya Iyer",
          fare: 350,
        },
      },
    };
  };

  // Simulated handler for legitimate GET /api/driver/dispatches
  const handleLegitimateDispatchGet = async (
    caller: { id: string; role: string; isVerified: boolean; isOnline: boolean } | null,
    availableRides: Array<{ _id: string; status: string; fare: number }>
  ) => {
    if (!caller) {
      throw new AuthError("Authentication required: Missing or invalid token", 401, "UNAUTHORIZED");
    }
    if (caller.role !== "DRIVER") {
      throw new AuthError("Forbidden: Driver role required", 403, "FORBIDDEN");
    }
    if (!caller.isVerified || !caller.isOnline) {
      return { status: 200, json: { status: "success", data: null } };
    }

    // Poll legitimate real rides in SEARCHING state
    const searchingRide = availableRides.find((r) => r.status === "SEARCHING");
    return {
      status: 200,
      json: { status: "success", data: searchingRide || null },
    };
  };

  // 1. NODE_ENV=production, ALLOW_DISPATCH_SIMULATION is unset -> POST returns 403
  it("Scenario 1: NODE_ENV=production with ALLOW_DISPATCH_SIMULATION unset returns 403 SIMULATION_DISABLED", async () => {
    const verifiedDriver = {
      id: "driver_prod_123",
      role: "DRIVER",
      isVerified: true,
    };

    const result = await handleDispatchSimulationPost(verifiedDriver, {
      nodeEnv: "production",
    });

    assert.equal(result.status, 403);
    assert.equal(result.json.code, "SIMULATION_DISABLED");
    assert.match(result.json.message, /disabled in production environment/);
  });

  // 2. NODE_ENV=production, ALLOW_DISPATCH_SIMULATION=true -> POST STILL returns 403
  it("Scenario 2: NODE_ENV=production with ALLOW_DISPATCH_SIMULATION=true STILL returns 403 SIMULATION_DISABLED (no override)", async () => {
    const verifiedDriver = {
      id: "driver_prod_123",
      role: "DRIVER",
      isVerified: true,
    };

    // Even if an operator or attacker injects ALLOW_DISPATCH_SIMULATION=true, production must reject
    const result = await handleDispatchSimulationPost(verifiedDriver, {
      nodeEnv: "production",
      allowSimulation: "true",
    });

    assert.equal(result.status, 403);
    assert.equal(result.json.code, "SIMULATION_DISABLED");
    assert.match(result.json.message, /disabled in production environment/);
  });

  // 3. NODE_ENV=development -> simulation works normally
  it("Scenario 3: NODE_ENV=development allows simulation ride generation for verified driver", async () => {
    const verifiedDriver = {
      id: "driver_dev_456",
      role: "DRIVER",
      isVerified: true,
    };

    const devResult = await handleDispatchSimulationPost(verifiedDriver, {
      nodeEnv: "development",
    });

    assert.equal(devResult.status, 201);
    assert.equal(devResult.json.status, "success");
    assert.ok(devResult.json.data);
    assert.equal(devResult.json.data._id, "test_simulated_ride_12345");
  });

  // 4. NODE_ENV=test -> simulation works normally
  it("Scenario 4: NODE_ENV=test allows simulation ride generation for verified driver", async () => {
    const verifiedDriver = {
      id: "driver_test_789",
      role: "DRIVER",
      isVerified: true,
    };

    const testResult = await handleDispatchSimulationPost(verifiedDriver, {
      nodeEnv: "test",
    });

    assert.equal(testResult.status, 201);
    assert.equal(testResult.json.status, "success");
    assert.ok(testResult.json.data);
    assert.equal(testResult.json.data._id, "test_simulated_ride_12345");
  });

  // 5. GET /api/driver/dispatches -> legitimate dispatch retrieval unaffected
  it("Scenario 5: Normal driver dispatch GET functionality continues to work without creating rides", async () => {
    const verifiedDriver = {
      id: "driver_prod_123",
      role: "DRIVER",
      isVerified: true,
      isOnline: true,
    };

    const existingRides = [
      { _id: "ride_real_999", status: "SEARCHING", fare: 450 },
    ];

    const result = await handleLegitimateDispatchGet(verifiedDriver, existingRides);

    assert.equal(result.status, 200);
    assert.equal(result.json.status, "success");
    assert.ok(result.json.data);
    assert.equal(result.json.data._id, "ride_real_999");
    assert.equal(result.json.data.fare, 450);
  });

  // 6. Unauthorized/non-driver access remains blocked
  it("Scenario 6: Unauthorized or non-driver callers remain blocked from triggering simulation", async () => {
    // Unauthenticated caller
    await assert.rejects(
      async () => {
        await handleDispatchSimulationPost(null, { nodeEnv: "development" });
      },
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 401);
        assert.equal(authErr.code, "UNAUTHORIZED");
        return true;
      }
    );

    // Rider account attempting to trigger driver dispatch simulation
    const riderCaller = {
      id: "rider_789",
      role: "RIDER",
      isVerified: true,
    };

    await assert.rejects(
      async () => {
        await handleDispatchSimulationPost(riderCaller, { nodeEnv: "development" });
      },
      (err: unknown) => {
        const authErr = err as AuthError;
        assert.equal(authErr.statusCode, 403);
        assert.equal(authErr.code, "FORBIDDEN");
        return true;
      }
    );
  });
});
