import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ticket from "@/models/Ticket";
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
    const priorityFilter = searchParams.get("priority") || "ALL";
    const categoryFilter = searchParams.get("category") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (statusFilter !== "ALL") {
      query.status = statusFilter;
    }

    if (priorityFilter !== "ALL") {
      query.priority = priorityFilter;
    }

    if (categoryFilter !== "ALL") {
      query.category = categoryFilter;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ ticketId: regex }, { subject: regex }, { description: regex }];
    }

    const [
      totalMatching,
      tickets,
      openCount,
      inProgressCount,
      highPriorityCount,
      resolvedCount,
      closedCount,
    ] = await Promise.all([
      Ticket.countDocuments(query),
      Ticket.find(query)
        .populate("user", "name email phone role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Ticket.countDocuments({ status: "OPEN" }),
      Ticket.countDocuments({ status: "IN_PROGRESS" }),
      Ticket.countDocuments({ priority: "HIGH", status: { $in: ["OPEN", "IN_PROGRESS"] } }),
      Ticket.countDocuments({ status: "RESOLVED" }),
      Ticket.countDocuments({ status: "CLOSED" }),
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          total: openCount + inProgressCount + resolvedCount + closedCount,
          openCount,
          inProgressCount,
          highPriorityCount,
          resolvedCount,
          closedCount,
        },
        tickets: tickets.map((t) => {
          const ticketRec = t as unknown as {
            _id: unknown;
            ticketId: string;
            user?: { _id: unknown; name: string; email: string; phone?: string; role: string };
            category: string;
            subject: string;
            description: string;
            status: string;
            priority: string;
            resolutionNotes?: string;
            createdAt: Date;
            updatedAt: Date;
          };

          return {
            id: ticketRec._id?.toString(),
            ticketId: ticketRec.ticketId,
            user: ticketRec.user
              ? {
                  id: ticketRec.user._id?.toString(),
                  name: ticketRec.user.name,
                  email: ticketRec.user.email,
                  phone: ticketRec.user.phone || "N/A",
                  role: ticketRec.user.role === "USER" ? "RIDER" : ticketRec.user.role,
                }
              : null,
            category: ticketRec.category,
            subject: ticketRec.subject,
            description: ticketRec.description,
            status: ticketRec.status,
            priority: ticketRec.priority,
            resolutionNotes: ticketRec.resolutionNotes || "",
            createdAt: ticketRec.createdAt,
            updatedAt: ticketRec.updatedAt,
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
    console.error("[Admin Support List Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve support tickets" },
      { status: 500 }
    );
  }
}
