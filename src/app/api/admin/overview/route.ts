import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import Ticket from "@/models/Ticket";
import Commute from "@/models/Commute";
import Transaction from "@/models/Transaction";
import AutoBookingOccurrence from "@/models/AutoBookingOccurrence";
import AdminAuditLog from "@/models/AdminAuditLog";
import { checkDriverVerification, type IDriverDoc } from "@/lib/driverCompliance";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const [
      activeRidesCount,
      searchingRidesCount,
      completedTodayCount,
      cancelledTodayCount,
      totalDrivers,
      onlineDrivers,
      activeUsers,
      suspendedUsers,
      totalRiders,
      activeCommutesCount,
      upcomingOccurrencesCount,
      unresolvedTicketsCount,
      safetyTicketsCount,
      failedTransactionsCount,
      pendingCashRidesCount,
    ] = await Promise.all([
      Ride.countDocuments({ status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] } }),
      Ride.countDocuments({ status: "SEARCHING" }),
      Ride.countDocuments({ status: "COMPLETED", updatedAt: { $gte: startOfDay } }),
      Ride.countDocuments({ status: "CANCELLED", updatedAt: { $gte: startOfDay } }),
      User.countDocuments({ role: "DRIVER" }),
      User.find({ role: "DRIVER", isOnline: true, status: "ACTIVE" })
        .select("name email phone status isOnline dutyState activeRideId driverVehicle driverDocuments")
        .lean(),
      User.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ status: { $in: ["SUSPENDED", "DISABLED"] } }),
      User.countDocuments({ role: { $in: ["RIDER", "USER"] } }),
      Commute.countDocuments({ isActive: true }),
      AutoBookingOccurrence.countDocuments({
        status: "PENDING",
        scheduledFor: { $gte: now, $lte: next24Hours },
      }),
      Ticket.countDocuments({ status: { $in: ["OPEN", "IN_PROGRESS"] } }),
      Ticket.countDocuments({
        status: { $in: ["OPEN", "IN_PROGRESS"] },
        priority: "HIGH",
      }),
      Transaction.countDocuments({ status: "FAILED" }),
      Ride.countDocuments({
        status: "COMPLETED",
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
      }),
    ]);

    interface AdminDriverRecord {
      _id: { toString(): string };
      name: string;
      email: string;
      phone?: string;
      status?: string;
      isOnline?: boolean;
      dutyState?: string;
      activeRideId?: unknown;
      driverVehicle?: { documentsVerified?: boolean };
      driverDocuments?: IDriverDoc[];
      createdAt?: Date | string;
    }

    interface OverviewDispatchRide {
      _id: { toString(): string };
      rider?: { name?: string };
      pickup?: { address?: string };
      dropoff?: { address?: string };
      vehicleType?: string;
      petFriendly?: boolean;
      scheduledFor?: Date | string | null;
      createdAt: Date | string;
      dispatchOfferCount?: number;
    }

    interface OverviewScheduledRide {
      _id: { toString(): string };
      rider?: { name?: string };
      pickup?: { address?: string };
      scheduledFor?: Date | string;
      status?: string;
      vehicleType?: string;
    }

    interface OverviewStuckOccurrence {
      _id: { toString(): string };
      occurrenceKey?: string;
      commuteId?: { title?: string };
      rider?: { name?: string };
      scheduledFor: Date | string;
      status: string;
      attemptCount?: number;
      lastError?: string;
    }

    interface OverviewPriorityTicket {
      _id: { toString(): string };
      ticketId?: string;
      user?: { name?: string; role?: string };
      subject?: string;
      category?: string;
      priority?: string;
      status?: string;
      createdAt: Date | string;
    }

    interface OverviewPaymentException {
      _id: { toString(): string };
      idempotencyKey?: string;
      userId?: { name?: string };
      amountInPaise?: number;
      type?: string;
      status?: string;
      entityId?: string;
      createdAt: Date | string;
    }

    interface OverviewAuditLog {
      _id: { toString(): string };
      actorEmail?: string;
      action?: string;
      targetType?: string;
      targetId?: string;
      reason?: string;
      createdAt: Date | string;
    }

    const onlineDriversList = onlineDrivers as unknown as AdminDriverRecord[];

    let currentlyEligibleDriversCount = 0;
    for (const d of onlineDriversList) {
      const verification = checkDriverVerification(d);
      const isAvailable = !d.activeRideId && d.dutyState !== "ON_TRIP" && d.dutyState !== "OFFLINE";
      if (verification.isVerified && isAvailable) {
        currentlyEligibleDriversCount++;
      }
    }

    const allDrivers = (await User.find({ role: "DRIVER" })
      .select("name email phone status isOnline driverVehicle driverDocuments createdAt")
      .lean()) as unknown as AdminDriverRecord[];

    let pendingDriverReviewsCount = 0;
    const pendingDriversQueue: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      pendingDocsCount: number;
      createdAt: string;
    }> = [];

    for (const d of allDrivers) {
      const v = checkDriverVerification(d);
      if (!v.isVerified) {
        pendingDriverReviewsCount++;
        if (pendingDriversQueue.length < 5) {
          pendingDriversQueue.push({
            id: d._id.toString(),
            name: d.name,
            phone: d.phone || "N/A",
            email: d.email,
            pendingDocsCount: v.pendingDocs.length,
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
          });
        }
      }
    }

    const [
      dispatchAttentionRides,
      upcomingScheduledRides,
      stuckOccurrences,
      priorityTickets,
      paymentExceptions,
      recentAuditLogs,
    ] = (await Promise.all([
      Ride.find({ status: "SEARCHING" })
        .populate("rider", "name phone email")
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
      Ride.find({
        status: { $in: ["SEARCHING", "ACCEPTED"] },
        scheduledFor: { $gte: now, $lte: next3Hours },
      })
        .populate("rider", "name phone")
        .sort({ scheduledFor: 1 })
        .limit(5)
        .lean(),
      AutoBookingOccurrence.find({
        status: { $in: ["FAILED_RETRYABLE", "FAILED_PERMANENT"] },
      })
        .populate("commuteId", "title time days")
        .populate("rider", "name phone")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Ticket.find({
        status: { $in: ["OPEN", "IN_PROGRESS"] },
      })
        .populate("user", "name role")
        .sort({ priority: -1, createdAt: 1 })
        .limit(5)
        .lean(),
      Transaction.find({
        $or: [
          { status: "FAILED" },
          { status: "PENDING", type: "FARE_PAYMENT" },
        ],
      })
        .populate("userId", "name role email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AdminAuditLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])) as [
      OverviewDispatchRide[],
      OverviewScheduledRide[],
      OverviewStuckOccurrence[],
      OverviewPriorityTicket[],
      OverviewPaymentException[],
      OverviewAuditLog[],
    ];

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          rides: {
            active: activeRidesCount,
            searching: searchingRidesCount,
            completedToday: completedTodayCount,
            cancelledToday: cancelledTodayCount,
          },
          drivers: {
            total: totalDrivers,
            online: onlineDriversList.length,
            eligible: currentlyEligibleDriversCount,
            pendingVerification: pendingDriverReviewsCount,
          },
          users: {
            totalRiders,
            activeUsers,
            suspendedUsers,
          },
          commutes: {
            activeSchedules: activeCommutesCount,
            upcomingDepartures24h: upcomingOccurrencesCount,
          },
          support: {
            unresolvedTotal: unresolvedTicketsCount,
            safetyOrUrgent: safetyTicketsCount,
          },
          financial: {
            failedTransactions: failedTransactionsCount,
            pendingCashReconciliation: pendingCashRidesCount,
            totalExceptions: failedTransactionsCount + pendingCashRidesCount,
          },
        },
        queues: {
          dispatchAttention: dispatchAttentionRides.map((r) => ({
            id: r._id.toString(),
            riderName: r.rider?.name || "Rider",
            pickupAddress: r.pickup?.address || "Pickup",
            dropoffAddress: r.dropoff?.address || "Dropoff",
            vehicleType: r.vehicleType,
            petFriendly: Boolean(r.petFriendly),
            scheduledFor: r.scheduledFor ? new Date(r.scheduledFor).toISOString() : null,
            createdAt: new Date(r.createdAt).toISOString(),
            dispatchOfferCount: r.dispatchOfferCount || 0,
          })),
          upcomingScheduled: upcomingScheduledRides.map((r) => ({
            id: r._id.toString(),
            riderName: r.rider?.name || "Rider",
            pickupAddress: r.pickup?.address || "Pickup",
            scheduledFor: r.scheduledFor ? new Date(r.scheduledFor).toISOString() : new Date().toISOString(),
            status: r.status,
            vehicleType: r.vehicleType,
          })),
          pendingDrivers: pendingDriversQueue,
          stuckOccurrences: stuckOccurrences.map((o) => ({
            id: o._id.toString(),
            occurrenceKey: o.occurrenceKey,
            commuteTitle: o.commuteId?.title || "Daily Commute",
            riderName: o.rider?.name || "Rider",
            scheduledFor: new Date(o.scheduledFor).toISOString(),
            status: o.status,
            attemptCount: o.attemptCount,
            lastError: o.lastError || "No details recorded",
          })),
          priorityTickets: priorityTickets.map((t) => ({
            id: t._id.toString(),
            ticketId: t.ticketId,
            userName: t.user?.name || "User",
            userRole: t.user?.role || "RIDER",
            subject: t.subject,
            category: t.category,
            priority: t.priority,
            status: t.status,
            createdAt: new Date(t.createdAt).toISOString(),
          })),
          paymentExceptions: paymentExceptions.map((tx) => ({
            id: tx._id.toString(),
            idempotencyKey: tx.idempotencyKey,
            userName: tx.userId?.name || "User",
            amountInPaise: tx.amountInPaise,
            type: tx.type,
            status: tx.status,
            entityId: tx.entityId,
            createdAt: new Date(tx.createdAt).toISOString(),
          })),
        },
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log._id.toString(),
          actorEmail: log.actorEmail,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          reason: log.reason,
          createdAt: new Date(log.createdAt).toISOString(),
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
