import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/mongoose";
import { isLivePaymentEnabled } from "@/lib/runtimeConfig";

export const dynamic = "force-dynamic";

/**
 * Operational Health & System Telemetry Endpoint
 *
 * Provides safe operational indicators for platform operators:
 * - Process uptime and execution runtime.
 * - Database connectivity status without credentials.
 * - Configuration presence flags.
 * - Live payment gate indicator (confirming online collection is currently disabled).
 * - Never returns raw secret keys, connection strings, or internal infrastructure details.
 */
export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  const isHealthy = dbHealth.ok;

  const payload = {
    status: isHealthy ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbHealth.ok ? "connected" : "disconnected",
        latencyMs: dbHealth.latencyMs,
      },
      auth: {
        configured: Boolean(process.env.JWT_SECRET || process.env.AUTH_SECRET),
      },
      cronScheduler: {
        configured: Boolean(process.env.CRON_SECRET),
      },
      livePayments: {
        enabled: isLivePaymentEnabled(),
        provider: "none",
        mode: "CASH_AND_WALLET_ONLY",
      },
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
