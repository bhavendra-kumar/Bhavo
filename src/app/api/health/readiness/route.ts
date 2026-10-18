import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

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
