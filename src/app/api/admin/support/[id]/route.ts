import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ticket from "@/models/Ticket";
import { recordAdminAudit } from "@/lib/adminAudit";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { ticketId: id }] } : { ticketId: id };

    const ticket = await Ticket.findOne(query).populate("user", "name email");
    if (!ticket) {
      return NextResponse.json(
        { status: "error", message: "Support ticket not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status: newStatus, priority: newPriority, resolutionNotes } = body;

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (newStatus && !allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        { status: "error", message: `Status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    if (newPriority && !allowedPriorities.includes(newPriority)) {
      return NextResponse.json(
        { status: "error", message: `Priority must be one of: ${allowedPriorities.join(", ")}` },
        { status: 400 }
      );
    }

    const beforeSnapshot = {
      status: ticket.status,
      priority: ticket.priority,
      resolutionNotes: ticket.resolutionNotes,
    };

    if (newStatus) ticket.status = newStatus;
    if (newPriority) ticket.priority = newPriority;
    if (typeof resolutionNotes === "string") ticket.resolutionNotes = resolutionNotes.trim();

    await ticket.save();

    // Record administrative audit log
    await recordAdminAudit({
      actor: admin._id,
      actorEmail: admin.email,
      action: newStatus === "RESOLVED" ? "TICKET_RESOLVE" : "TICKET_UPDATE",
      targetType: "TICKET",
      targetId: ticket._id.toString(),
      reason: resolutionNotes?.trim() || `Ticket ${ticket.ticketId} updated by admin`,
      before: beforeSnapshot,
      after: {
        status: ticket.status,
        priority: ticket.priority,
        resolutionNotes: ticket.resolutionNotes,
      },
      metadata: {
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        userEmail: (ticket.user as { email?: string })?.email,
      },
      req,
    });

    return NextResponse.json({
      status: "success",
      message: "Ticket updated successfully",
      data: {
        id: ticket._id.toString(),
        ticketId: ticket.ticketId,
        status: ticket.status,
        priority: ticket.priority,
        resolutionNotes: ticket.resolutionNotes,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Ticket Update Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update support ticket" },
      { status: 500 }
    );
  }
}
