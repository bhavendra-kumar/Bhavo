import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import Ride from "@/models/Ride";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const statusFilter = searchParams.get("status") || "ALL";
    const typeFilter = searchParams.get("type") || "ALL";
    const search = searchParams.get("search")?.trim() || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: Record<string, unknown> = {};

    if (statusFilter !== "ALL") {
      query.status = statusFilter;
    }

    if (typeFilter !== "ALL") {
      query.type = typeFilter;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) dateFilter.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) dateFilter.$lte = e;
      }
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or = [
          { _id: new mongoose.Types.ObjectId(search) },
          { userId: new mongoose.Types.ObjectId(search) },
          { entityId: search },
        ];
      } else {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [
          { idempotencyKey: regex },
          { entityId: regex },
          { description: regex },
        ];
      }
    }

    const [
      totalMatching,
      transactions,
      settledCount,
      pendingCount,
      failedCount,
      cashRecordsCount,
      settledVolumeAgg,
      pendingCashCollectionRides,
    ] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .populate("userId", "name email phone role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ status: "SETTLED" }),
      Transaction.countDocuments({ status: "PENDING" }),
      Transaction.countDocuments({ status: { $in: ["FAILED", "REVERSED"] } }),
      Transaction.countDocuments({ type: "CASH_COLLECTED_BY_DRIVER" }),
      Transaction.aggregate([
        { $match: { status: "SETTLED", type: "FARE_PAYMENT" } },
        { $group: { _id: null, totalPaise: { $sum: "$amountInPaise" } } },
      ]),
      Ride.countDocuments({ paymentMethod: "CASH", paymentStatus: "PENDING_COLLECTION" }),
    ]);

    const settledVolumePaise = settledVolumeAgg[0]?.totalPaise || 0;

    const formattedTransactions = transactions.map((t) => {
      const tx = t as unknown as {
        _id: unknown;
        idempotencyKey: string;
        userId?: { _id: unknown; name: string; email: string; phone?: string; role: string };
        userRole: string;
        type: string;
        direction: string;
        amountInPaise: number;
        currency: string;
        entityType: string;
        entityId: string;
        eventType: string;
        sequence: number;
        status: string;
        description: string;
        metadata?: Record<string, unknown>;
        createdAt: Date;
      };

      const isCashRecord = tx.type === "CASH_COLLECTED_BY_DRIVER";

      return {
        id: tx._id?.toString(),
        idempotencyKey: tx.idempotencyKey,
        user: tx.userId
          ? {
              id: tx.userId._id?.toString(),
              name: tx.userId.name,
              email: tx.userId.email,
              phone: tx.userId.phone || "N/A",
              role: tx.userId.role,
            }
          : null,
        userRole: tx.userRole,
        type: tx.type,
        direction: tx.direction,
        amountInPaise: tx.amountInPaise,
        amountInRupees: tx.amountInPaise / 100,
        currency: tx.currency || "INR",
        entityType: tx.entityType,
        entityId: tx.entityId,
        eventType: tx.eventType,
        sequence: tx.sequence,
        status: tx.status,
        description: tx.description,
        isCashCollectionRecord: isCashRecord,
        createdAt: tx.createdAt,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          totalLedgerEntries: totalMatching,
          settledCount,
          pendingCount,
          failedCount,
          cashRecordsCount,
          pendingCashCollectionRides,
          settledVolumeRupees: settledVolumePaise / 100,
          settledVolumePaise,
        },
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total: totalMatching,
          pages: Math.ceil(totalMatching / limit),
        },
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Payments API Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve payment records" },
      { status: 500 }
    );
  }
}
