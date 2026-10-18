import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { sweepExpiredOffers } from "@/lib/dispatchRanking";
import { verifyCronSecret } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

async function handleMaintenance(req: Request) {
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

    const { sweptCount, exhaustedCount } = await sweepExpiredOffers(100);

    return NextResponse.json({
      status: "success",
      data: {
        sweptCount,
        exhaustedCount,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Dispatches Maintenance Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handleMaintenance(req);
}

export async function GET(req: Request) {
  return handleMaintenance(req);
}
