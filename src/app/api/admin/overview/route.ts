import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import Ticket from "@/models/Ticket";
import AutoBookingOccurrence from "@/models/AutoBookingOccurrence";
import AdminAuditLog from "@/models/AdminAuditLog";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    // 1. User & Driver Demographics
    const [totalRiders, totalDrivers, activeUsers, suspendedUsers] = await Promise.all([
      User.countDocuments({ role: { $in: ["RIDER", "USER"] } }),
      User.countDocuments({ role: "DRIVER" }),
      User.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ status: { $in: ["SUSPENDED", "DISABLED"] } }),
    ]);

    // 2. Driver Verification Pipeline
    // A driver has pending verification if they have any document with status PENDING or REJECTED
    const driversPendingVerification = await User.countDocuments({
      role: "DRIVER",
      $or: [
        { "driverDocuments.status": { $in: ["PENDING", "REJECTED"] } },
        { "driverVehicle.documentsVerified": false },
      ],
    });

    // 3. Live Ride Operations
    const [ridesSearching, ridesActive, ridesCompleted, ridesCancelled] = await Promise.all([
      Ride.countDocuments({ status: "SEARCHING" }),
      Ride.countDocuments({ status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] } }),
      Ride.countDocuments({ status: "COMPLETED" }),
      Ride.countDocuments({ status: "CANCELLED" }),
    ]);

    // 4. Support Tickets
    const [openTickets, pendingTickets, resolvedTickets] = await Promise.all([
      Ticket.countDocuments({ status: "OPEN" }),
      Ticket.countDocuments({ status: "IN_PROGRESS" }),
      Ticket.countDocuments({ status: { $in: ["RESOLVED", "CLOSED"] } }),
    ]);

    // 5. Auto Booking Operational Metrics
    const [materializedOccurrences, failedOccurrences, skippedOccurrences] = await Promise.all([
      AutoBookingOccurrence.countDocuments({ status: "MATERIALIZED" }),
      AutoBookingOccurrence.countDocuments({ status: { $in: ["FAILED_PERMANENT", "FAILED_RETRYABLE"] } }),
      AutoBookingOccurrence.countDocuments({ status: { $in: ["SKIPPED_PAST", "SKIPPED_PAUSED"] } }),
    ]);

    // 6. Recent Audit Events (Bounded)
    const recentAuditLogs = await AdminAuditLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          users: {
            totalRiders,
            totalDrivers,
            activeUsers,
            suspendedUsers,
            driversPendingVerification,
          },
          rides: {
            searching: ridesSearching,
            active: ridesActive,
            completed: ridesCompleted,
            cancelled: ridesCancelled,
          },
          support: {
            open: openTickets,
            inProgress: pendingTickets,
            resolved: resolvedTickets,
            totalActive: openTickets + pendingTickets,
          },
          autoBooking: {
            materialized: materializedOccurrences,
            failed: failedOccurrences,
            skipped: skippedOccurrences,
          },
        },
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log._id.toString(),
          actorEmail: log.actorEmail,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          reason: log.reason,
          createdAt: log.createdAt,
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Overview API Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to load platform operational overview" },
      { status: 500 }
    );
  }
}
