import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { verifyCronSecret } from "@/lib/cronAuth";
import { processAutoBookingBatch } from "@/lib/autoBooking";
import {
  getAutoBookingLookaheadMinutes,
  getAutoBookingBatchSize,
} from "@/lib/autoBookingConfig";

export const dynamic = "force-dynamic";

/**
 * Background Cron Worker for Auto Booking & Recurring Ride Materialization (Phase 1F)
 *
 * Security:
 * - Requires server-configured CRON_SECRET via Bearer token or x-cron-secret header.
 * - Fails closed if CRON_SECRET is unconfigured or mismatch.
 * - Enforces constant-time validation.
 *
 * Operational Cadence:
 * - Recommended cron interval: Every 1 to 5 minutes.
 * - Idempotent and concurrency-safe across multiple instances or overlapping invocations.
 */
async function handleAutoBookingCron(req: Request) {
  try {
    const isAuthorized = verifyCronSecret(req);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          status: "error",
          code: "UNAUTHORIZED",
          message: "Unauthorized: Missing, invalid, or unconfigured CRON_SECRET authorization.",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Parse optional limit and lookahead overrides from query or body
    const url = new URL(req.url);
    const limitQuery = url.searchParams.get("limit");
    const lookaheadQuery = url.searchParams.get("lookahead");

    let limit = limitQuery ? parseInt(limitQuery, 10) : undefined;
    let lookaheadMinutes = lookaheadQuery ? parseInt(lookaheadQuery, 10) : undefined;

    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.limit && typeof body.limit === "number") limit = body.limit;
        if (body.lookaheadMinutes && typeof body.lookaheadMinutes === "number") {
          lookaheadMinutes = body.lookaheadMinutes;
        }
      } catch {
        // Body is optional; query params or defaults take precedence
      }
    }

    const summary = await processAutoBookingBatch({
      limit: limit ? Math.min(Math.max(1, limit), 200) : getAutoBookingBatchSize(),
      lookaheadMinutes: lookaheadMinutes && lookaheadMinutes >= 60 ? lookaheadMinutes : getAutoBookingLookaheadMinutes(),
    });

    return NextResponse.json({
      status: "success",
      data: summary,
    });
  } catch (error: unknown) {
    console.error("[Auto Booking Cron Error]:", error);
    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_ERROR",
        message: "Internal server error during auto booking execution",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handleAutoBookingCron(req);
}

export async function GET(req: Request) {
  return handleAutoBookingCron(req);
}
