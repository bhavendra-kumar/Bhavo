import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";
import { confirmOnlinePayment, PaymentError } from "@/lib/paymentService";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { status: "error", code: "INVALID_RIDE_ID", message: "Invalid ride ID format" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        {
          status: "error",
          code: "MISSING_PAYMENT_PAYLOAD",
          message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await confirmOnlinePayment({
      rideId: id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      source: "CHECKOUT",
      riderId: user._id,
    });

    return NextResponse.json(
      {
        status: "success",
        message: result.alreadyPaid
          ? "Payment already confirmed for this ride"
          : "Payment verified and settled successfully",
        data: {
          rideId: result.ride._id,
          paymentStatus: result.ride.paymentStatus,
          paymentMethod: result.ride.paymentMethod,
          amountInRupees: result.amountInRupees,
          amountInPaise: result.amountInPaise,
          paymentId: result.paymentId,
          alreadyPaid: result.alreadyPaid,
          transactionId: result.transaction?.idempotencyKey,
          paidAt: result.ride.paymentConfirmedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { status: "error", code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Verify Payment Error]:", error);
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
