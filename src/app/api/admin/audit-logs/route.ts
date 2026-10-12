import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import AdminAuditLog from "@/models/AdminAuditLog";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const actionFilter = searchParams.get("action") || "ALL";
    const targetTypeFilter = searchParams.get("targetType") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (actionFilter !== "ALL") {
      query.action = actionFilter;
    }

    if (targetTypeFilter !== "ALL") {
      query.targetType = targetTypeFilter;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ actorEmail: regex }, { targetId: regex }, { reason: regex }];
    }

    const totalMatching = await AdminAuditLog.countDocuments(query);
    const logs = await AdminAuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: "success",
      data: {
        logs: logs.map((log) => ({
          id: log._id.toString(),
          actor: log.actor.toString(),
          actorEmail: log.actorEmail,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          reason: log.reason,
          before: log.before || null,
          after: log.after || null,
          metadata: log.metadata || null,
          ip: log.ip || null,
          userAgent: log.userAgent || null,
          createdAt: log.createdAt,
        })),
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
    console.error("[Admin Audit Logs Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve administrative audit logs" },
      { status: 500 }
    );
  }
}
