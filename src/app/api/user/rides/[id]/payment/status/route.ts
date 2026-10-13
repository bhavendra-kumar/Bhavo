import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";
import { getRidePaymentStatus, PaymentError } from "@/lib/paymentService";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/rides/[id]/payment/status
 * 
 * Authenticated Payment Status Check
 * - Restricts access to the owning rider, assigned driver, or admin.
 * - Protects against IDOR.
 * - Returns current payment state and capability status without exposing secrets.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER", "DRIVER", "ADMIN"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { status: "error", code: "INVALID_RIDE_ID", message: "Invalid ride ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    const statusData = await getRidePaymentStatus({
      rideId: id,
      userId: user._id,
      userRole: user.role,
    });

    return NextResponse.json(
      {
        status: "success",
        data: statusData,
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
    console.error("[Get Payment Status Error]:", error);
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
