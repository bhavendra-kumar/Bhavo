import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Commute from "@/models/Commute";
import AutoBookingOccurrence from "@/models/AutoBookingOccurrence";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";
import { recordAdminAudit } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid commute ID format" },
        { status: 400 }
      );
    }

    const commute = await Commute.findById(id)
      .populate("rider", "name email phone status walletBalanceInPaise")
      .lean();

    if (!commute) {
      return NextResponse.json(
        { status: "error", message: "Commute schedule not found" },
        { status: 404 }
      );
    }

    const occurrences = await AutoBookingOccurrence.find({ commuteId: commute._id })
      .populate("rideId", "status fare fareInPaise paymentStatus driver driverDetails createdAt")
      .sort({ scheduledFor: -1 })
      .limit(50)
      .lean();

    const formattedOccurrences = occurrences.map((occ) => {
      const o = occ as unknown as {
        _id: unknown;
        occurrenceKey: string;
        scheduledFor: Date;
        status: string;
        rideId?: {
          _id: unknown;
          status: string;
          fare: number;
          fareInPaise?: number;
          paymentStatus: string;
          driver?: unknown;
          driverDetails?: { name: string; vehicleNumber: string };
        } | null;
        attemptCount: number;
        maxAttempts: number;
        lastError?: string | null;
        lastAttemptAt?: Date | null;
        leaseExpiresAt?: Date | null;
        createdAt: Date;
      };

      return {
        id: o._id?.toString(),
        occurrenceKey: o.occurrenceKey,
        scheduledFor: o.scheduledFor,
        status: o.status,
        ride: o.rideId
          ? {
              id: o.rideId._id?.toString(),
              status: o.rideId.status,
              fare: o.rideId.fare,
              fareInPaise: o.rideId.fareInPaise,
              paymentStatus: o.rideId.paymentStatus,
              driverName: o.rideId.driverDetails?.name || null,
            }
          : null,
        attemptCount: o.attemptCount,
        maxAttempts: o.maxAttempts,
        lastError: o.lastError || null,
        lastAttemptAt: o.lastAttemptAt || null,
        leaseExpiresAt: o.leaseExpiresAt || null,
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        commute,
        occurrences: formattedOccurrences,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Commute Details Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve commute details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid commute schedule ID" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { isActive, reason } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { status: "error", message: "isActive boolean is required" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        {
          status: "error",
          message: "A meaningful administrative reason (min 5 characters) is required.",
        },
        { status: 400 }
      );
    }

    const existingCommute = await Commute.findById(id);
    if (!existingCommute) {
      return NextResponse.json(
        { status: "error", message: "Commute schedule not found" },
        { status: 404 }
      );
    }

    const prevActive = existingCommute.isActive;
    if (prevActive === isActive) {
      return NextResponse.json({
        status: "success",
        message: `Schedule is already ${isActive ? "active" : "paused"}`,
        data: { commute: existingCommute },
      });
    }

    existingCommute.isActive = isActive;
    await existingCommute.save();

    await recordAdminAudit({
      actor: adminUser.userId,
      actorEmail: adminUser.email,
      action: isActive ? "COMMUTE_RESUMED" : "COMMUTE_PAUSED",
      targetType: "SYSTEM",
      targetId: existingCommute._id.toString(),
      reason: reason.trim(),
      before: { isActive: prevActive, title: existingCommute.title, riderId: existingCommute.rider?.toString() },
      after: { isActive, title: existingCommute.title, riderId: existingCommute.rider?.toString() },
      req,
    });

    return NextResponse.json({
      status: "success",
      message: `Commute schedule successfully ${isActive ? "resumed" : "paused"}`,
      data: { commute: existingCommute },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Commute Patch Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update commute schedule status" },
      { status: 500 }
    );
  }
}
