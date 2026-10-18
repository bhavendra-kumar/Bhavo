import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import Commute from "@/models/Commute";
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
    const petFilter = searchParams.get("hasPets") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const query: Record<string, unknown> = {
      role: { $in: ["RIDER", "USER"] },
    };

    if (statusFilter !== "ALL") {
      query.status = statusFilter;
    }

    if (petFilter === "true") {
      query["pets.0"] = { $exists: true };
    } else if (petFilter === "false") {
      query.$or = [{ pets: { $size: 0 } }, { pets: { $exists: false } }];
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = new mongoose.Types.ObjectId(search);
      } else {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
      }
    }

    const [
      totalMatching,
      riders,
      totalRiders,
      activeRiders,
      suspendedRiders,
      ridersWithPets,
    ] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("name email phone status rating walletBalance walletBalanceInPaise pets createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: { $in: ["RIDER", "USER"] } }),
      User.countDocuments({ role: { $in: ["RIDER", "USER"] }, status: "ACTIVE" }),
      User.countDocuments({ role: { $in: ["RIDER", "USER"] }, status: "SUSPENDED" }),
      User.countDocuments({ role: { $in: ["RIDER", "USER"] }, "pets.0": { $exists: true } }),
    ]);

    const riderIds = riders.map((r) => r._id);

    const [rideCounts, commuteCounts] = await Promise.all([
      Ride.aggregate([
        { $match: { rider: { $in: riderIds } } },
        { $group: { _id: "$rider", count: { $sum: 1 } } },
      ]),
      Commute.aggregate([
        { $match: { rider: { $in: riderIds } } },
        { $group: { _id: "$rider", count: { $sum: 1 } } },
      ]),
    ]);

    const rideCountMap = new Map(rideCounts.map((rc) => [rc._id.toString(), rc.count]));
    const commuteCountMap = new Map(commuteCounts.map((cc) => [cc._id.toString(), cc.count]));

    const formattedRiders = riders.map((r) => {
      const riderRec = r as unknown as {
        _id: unknown;
        name: string;
        email: string;
        phone?: string;
        status?: string;
        rating?: number;
        walletBalance?: number;
        walletBalanceInPaise?: number;
        pets?: Array<{ name: string; breed: string; weight: string }>;
        createdAt: Date;
      };

      const rid = riderRec._id?.toString() || "";

      return {
        id: rid,
        name: riderRec.name,
        email: riderRec.email,
        phone: riderRec.phone || "N/A",
        status: riderRec.status || "ACTIVE",
        rating: riderRec.rating ?? 5.0,
        walletBalanceInRupees: riderRec.walletBalanceInPaise
          ? riderRec.walletBalanceInPaise / 100
          : riderRec.walletBalance || 0,
        pets: riderRec.pets || [],
        hasPets: Boolean(riderRec.pets && riderRec.pets.length > 0),
        rideCount: rideCountMap.get(rid) || 0,
        commuteCount: commuteCountMap.get(rid) || 0,
        createdAt: riderRec.createdAt,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          totalRiders,
          activeRiders,
          suspendedRiders,
          ridersWithPets,
        },
        riders: formattedRiders,
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
    console.error("[Admin Riders API Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve riders directory" },
      { status: 500 }
    );
  }
}
