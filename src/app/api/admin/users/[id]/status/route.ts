import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { recordAdminAudit } from "@/lib/adminAudit";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status: newStatus, reason } = body;

    if (newStatus !== "ACTIVE" && newStatus !== "SUSPENDED" && newStatus !== "DISABLED") {
      return NextResponse.json(
        { status: "error", message: "Status must be ACTIVE, SUSPENDED, or DISABLED" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { status: "error", message: "A substantive reason (minimum 5 characters) is required for account status changes" },
        { status: 400 }
      );
    }

    if (admin._id.toString() === id) {
      return NextResponse.json(
        { status: "error", message: "Administrators cannot alter their own account status" },
        { status: 403 }
      );
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { status: "error", message: "Target account not found" },
        { status: 404 }
      );
    }

    if (targetUser.role === "DRIVER" && (newStatus === "SUSPENDED" || newStatus === "DISABLED")) {
      const activeTrip = await Ride.findOne({
        driver: targetUser._id,
        status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
      }).select("status");

      if (activeTrip || targetUser.activeRideId) {
        const tripStatus = activeTrip?.status || "ASSIGNED";
        if (tripStatus === "IN_PROGRESS") {
          return NextResponse.json(
            {
              status: "error",
              code: "DRIVER_ON_ACTIVE_TRIP",
              message: "Cannot suspend driver with a ride currently in progress. Passenger is on board; the trip must reach a terminal state first.",
            },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            {
              status: "error",
              code: "DRIVER_HAS_ACCEPTED_RIDE",
              message: `Cannot suspend driver with an assigned ride in status '${tripStatus}'. Resolve or reassign the active commitment first.`,
            },
            { status: 409 }
          );
        }
      }
    }

    const beforeSnapshot = {
      status: targetUser.status || "ACTIVE",
      tokenVersion: targetUser.tokenVersion ?? 0,
      isOnline: targetUser.isOnline,
      dutyState: targetUser.dutyState,
    };

    targetUser.status = newStatus;

    if (newStatus === "SUSPENDED" || newStatus === "DISABLED") {
      targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
      if (targetUser.role === "DRIVER") {
        targetUser.isOnline = false;
        targetUser.dutyState = "OFFLINE";
      }
    }

    await targetUser.save();

    await recordAdminAudit({
      actor: admin._id,
      actorEmail: admin.email,
      action: newStatus === "ACTIVE" ? "ACCOUNT_REACTIVATE" : "ACCOUNT_SUSPEND",
      targetType: targetUser.role === "DRIVER" ? "DRIVER" : "USER",
      targetId: targetUser._id.toString(),
      reason: reason.trim(),
      before: beforeSnapshot,
      after: {
        status: targetUser.status,
        tokenVersion: targetUser.tokenVersion,
        isOnline: targetUser.isOnline,
        dutyState: targetUser.dutyState,
      },
      metadata: {
        targetEmail: targetUser.email,
        targetName: targetUser.name,
        targetRole: targetUser.role,
        requestedStatus: newStatus,
      },
      req,
    });

    return NextResponse.json({
      status: "success",
      message: `Account status updated to ${newStatus} successfully.`,
      data: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        tokenVersion: targetUser.tokenVersion,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Account Status Change Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update account status" },
      { status: 500 }
    );
  }
}
