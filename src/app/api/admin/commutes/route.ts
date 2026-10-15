import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Commute from "@/models/Commute";
import AutoBookingOccurrence from "@/models/AutoBookingOccurrence";
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
    const weekdayFilter = searchParams.get("weekday") || "ALL";
    const petFriendlyFilter = searchParams.get("petFriendly");
    const search = searchParams.get("search")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (statusFilter === "ACTIVE") {
      query.isActive = true;
    } else if (statusFilter === "PAUSED") {
      query.isActive = false;
    }

    if (weekdayFilter !== "ALL") {
      query.days = weekdayFilter;
    }

    if (petFriendlyFilter === "true") {
      query.petFriendly = true;
    } else if (petFriendlyFilter === "false") {
      query.petFriendly = { $ne: true };
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = new mongoose.Types.ObjectId(search);
      } else {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        query.$or = [
          { title: regex },
          { "pickup.address": regex },
          { "dropoff.address": regex },
          { vehicleType: regex },
        ];
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalMatching,
      commutes,
      totalSchedules,
      activeSchedules,
      pausedSchedules,
      petFriendlySchedules,
      occurrencesToday,
    ] = await Promise.all([
      Commute.countDocuments(query),
      Commute.find(query)
        .populate("rider", "name email phone")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Commute.countDocuments(),
      Commute.countDocuments({ isActive: true }),
      Commute.countDocuments({ isActive: false }),
      Commute.countDocuments({ petFriendly: true }),
      AutoBookingOccurrence.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const occurrencesTodayMap = (occurrencesToday || []).reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    const commuteIds = commutes.map((c) => c._id);
    const recentOccurrences = await AutoBookingOccurrence.find({
      commuteId: { $in: commuteIds },
    })
      .sort({ scheduledFor: -1 })
      .limit(200)
      .lean();

    const occurrenceMap = new Map<string, typeof recentOccurrences>();
    for (const occ of recentOccurrences) {
      const cid = occ.commuteId.toString();
      if (!occurrenceMap.has(cid)) {
        occurrenceMap.set(cid, []);
      }
      occurrenceMap.get(cid)?.push(occ);
    }

    const formattedCommutes = commutes.map((c) => {
      const commuteRec = c as unknown as {
        _id: unknown;
        rider?: { _id: unknown; name: string; email: string; phone?: string };
        title: string;
        pickup: { address: string; coordinates?: [number, number] };
        dropoff: { address: string; coordinates?: [number, number] };
        time: string;
        days: string[];
        vehicleType: string;
        isActive: boolean;
        paymentMethod?: string;
        petFriendly?: boolean;
        lastMaterializedAt?: Date | null;
        lastGeneratedRideId?: unknown;
        createdAt: Date;
        updatedAt: Date;
      };

      const cid = commuteRec._id?.toString() || "";
      const occurrences = occurrenceMap.get(cid) || [];
      const materializedCount = occurrences.filter((o) => o.status === "MATERIALIZED").length;
      const failedCount = occurrences.filter(
        (o) => o.status === "FAILED_RETRYABLE" || o.status === "FAILED_PERMANENT"
      ).length;

      const upcoming = occurrences
        .filter((o) => new Date(o.scheduledFor).getTime() >= Date.now())
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0];

      return {
        id: cid,
        title: commuteRec.title,
        rider: commuteRec.rider
          ? {
              id: commuteRec.rider._id?.toString(),
              name: commuteRec.rider.name,
              email: commuteRec.rider.email,
              phone: commuteRec.rider.phone || "N/A",
            }
          : null,
        pickup: commuteRec.pickup,
        dropoff: commuteRec.dropoff,
        time: commuteRec.time,
        days: commuteRec.days || [],
        vehicleType: commuteRec.vehicleType,
        isActive: commuteRec.isActive,
        paymentMethod: commuteRec.paymentMethod || "CASH",
        petFriendly: Boolean(commuteRec.petFriendly),
        lastMaterializedAt: commuteRec.lastMaterializedAt || null,
        stats: {
          recentOccurrencesCount: occurrences.length,
          materializedCount,
          failedCount,
          nextOccurrenceScheduledFor: upcoming ? upcoming.scheduledFor : null,
          nextOccurrenceStatus: upcoming ? upcoming.status : null,
        },
        createdAt: commuteRec.createdAt,
        updatedAt: commuteRec.updatedAt,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          totalSchedules,
          activeSchedules,
          pausedSchedules,
          petFriendlySchedules,
          materializedToday: occurrencesTodayMap["MATERIALIZED"] || 0,
          failedToday:
            (occurrencesTodayMap["FAILED_RETRYABLE"] || 0) +
            (occurrencesTodayMap["FAILED_PERMANENT"] || 0),
        },
        commutes: formattedCommutes,
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
    console.error("[Admin Commutes API Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve recurring commutes" },
      { status: 500 }
    );
  }
}
