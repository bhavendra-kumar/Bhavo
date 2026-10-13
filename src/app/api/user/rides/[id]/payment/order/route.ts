import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";
import { createRidePaymentOrder, PaymentError } from "@/lib/paymentService";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/rides/[id]/payment/order
 * 
 * Server-authoritative Razorpay Order Creation
 * - Requires authenticated rider who owns the ride.
 * - Only permitted for completed, outstanding rides.
 * - Authoritative fare from server storage (never client).
 * - Fails closed if live payments disabled.
 * - Returns only public checkout details (keyId, orderId, amount). Never leaks secret.
 */
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

    await dbConnect();

    const orderDetails = await createRidePaymentOrder({
      rideId: id,
      riderId: user._id,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Payment order created successfully",
        data: orderDetails,
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
    console.error("[Create Payment Order Error]:", error);
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
