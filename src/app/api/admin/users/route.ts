import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const roleFilter = searchParams.get("role") || "ALL";
    const statusFilter = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (roleFilter !== "ALL") {
      if (roleFilter === "RIDER") {
        query.role = { $in: ["RIDER", "USER"] };
      } else {
        query.role = roleFilter;
      }
    }

    if (statusFilter !== "ALL") {
      query.status = statusFilter;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const totalMatching = await User.countDocuments(query);
    const users = await User.find(query)
      .select("name email phone role status rating walletBalance tokenVersion isOnline dutyState createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: "success",
      data: {
        users: users.map((u) => {
          const userRec = u as {
            _id: unknown;
            name: string;
            email: string;
            phone?: string;
            role: string;
            status?: string;
            rating?: number;
            walletBalance?: number;
            tokenVersion?: number;
            isOnline?: boolean;
            dutyState?: string;
            createdAt?: Date;
          };

          return {
            id: userRec._id?.toString(),
            name: userRec.name,
            email: userRec.email,
            phone: userRec.phone || "N/A",
            role: userRec.role === "USER" ? "RIDER" : userRec.role,
            status: userRec.status || "ACTIVE",
            rating: userRec.rating ?? 5.0,
            walletBalance: userRec.walletBalance ?? 0,
            tokenVersion: userRec.tokenVersion ?? 0,
            isOnline: Boolean(userRec.isOnline),
            dutyState: userRec.dutyState || "OFFLINE",
            createdAt: userRec.createdAt,
          };
        }),
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
    console.error("[Admin Users List Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve user accounts" },
      { status: 500 }
    );
  }
}
