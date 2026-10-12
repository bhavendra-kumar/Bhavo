import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness Probe: Verifies the Next.js Node process is running and responding to HTTP requests.
 * Instantaneous, bounded response. Does not query external dependencies or database.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
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
