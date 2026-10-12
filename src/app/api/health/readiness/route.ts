import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

/**
 * Readiness Probe: Verifies whether essential dependencies (MongoDB) are ready to accept user requests.
 * - Returns 200 when database connectivity is healthy.
 * - Returns 503 Service Unavailable when database connection is degraded or disconnected.
 * - Never leaks connection strings, cluster credentials, or internal infrastructure hostnames.
 */
export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  if (!dbHealth.ok) {
    return NextResponse.json(
      {
        status: "unready",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: "ready",
      database: "connected",
      latencyMs: dbHealth.latencyMs,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
