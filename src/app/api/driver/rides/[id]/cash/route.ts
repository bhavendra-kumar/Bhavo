import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";
import { confirmCashCollection, LedgerError } from "@/lib/ledgerService";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { status: "error", code: "INVALID_RIDE_ID", message: "Invalid ride ID format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const driverUser = await getDriverUser(req);

    const result = await confirmCashCollection({
      rideId: id,
      driverId: driverUser._id,
      driverName: driverUser.name,
    });

    return NextResponse.json(
      {
        status: "success",
        message: result.alreadyCollected
          ? "Cash collection already confirmed"
          : "Cash collection confirmed successfully",
        data: {
          rideId: result.ride._id,
          paymentStatus: result.ride.paymentStatus,
          collectedAmount: result.collectedAmountInRupees,
          collectedAmountInPaise: result.collectedAmountInPaise,
          alreadyCollected: result.alreadyCollected,
          cashCollectedAt: result.ride.cashCollectedAt,
          transactionId: result.transaction?.idempotencyKey,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    if (error instanceof LedgerError) {
      return NextResponse.json(
        { status: "error", code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Cash Collection Confirmation Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
