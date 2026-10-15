import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import Commute from "@/models/Commute";
import Ticket from "@/models/Ticket";
import { recordAdminAudit } from "@/lib/adminAudit";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid rider ID format" },
        { status: 400 }
      );
    }

    const rider = await User.findOne({
      _id: id,
      role: { $in: ["RIDER", "USER"] },
    })
      .select("name email phone status rating walletBalance walletBalanceInPaise emergencyContacts pets createdAt updatedAt")
      .lean();

    if (!rider) {
      return NextResponse.json(
        { status: "error", message: "Rider account not found" },
        { status: 404 }
      );
    }

    const [recentRides, commutes, tickets] = await Promise.all([
      Ride.find({ rider: rider._id })
        .select("pickup.address dropoff.address fare fareInPaise vehicleType status paymentMethod paymentStatus petFriendly scheduledFor createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Commute.find({ rider: rider._id })
        .select("title pickup.address dropoff.address time days vehicleType isActive petFriendly lastMaterializedAt")
        .sort({ updatedAt: -1 })
        .lean(),
      Ticket.find({ user: rider._id })
        .select("ticketId category subject status priority createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const riderRec = rider as unknown as {
      _id: unknown;
      name: string;
      email: string;
      phone?: string;
      status?: string;
      rating?: number;
      walletBalance?: number;
      walletBalanceInPaise?: number;
      emergencyContacts?: Array<{ name: string; phone: string; relation: string }>;
      pets?: Array<{ name: string; breed: string; weight: string }>;
      createdAt: Date;
      updatedAt: Date;
    };

    return NextResponse.json({
      status: "success",
      data: {
        rider: {
          id: riderRec._id?.toString(),
          name: riderRec.name,
          email: riderRec.email,
          phone: riderRec.phone || "N/A",
          status: riderRec.status || "ACTIVE",
          rating: riderRec.rating ?? 5.0,
          walletBalanceInRupees: riderRec.walletBalanceInPaise
            ? riderRec.walletBalanceInPaise / 100
            : riderRec.walletBalance || 0,
          emergencyContacts: riderRec.emergencyContacts || [],
          pets: riderRec.pets || [],
          createdAt: riderRec.createdAt,
          updatedAt: riderRec.updatedAt,
        },
        recentRides: recentRides.map((r) => {
          const rideRec = r as unknown as {
            _id: unknown;
            pickup?: { address: string };
            dropoff?: { address: string };
            fare: number;
            fareInPaise?: number;
            vehicleType: string;
            status: string;
            paymentMethod: string;
            paymentStatus: string;
            petFriendly?: boolean;
            scheduledFor?: Date | null;
            createdAt: Date;
          };
          return {
            id: rideRec._id?.toString(),
            pickupAddress: rideRec.pickup?.address || "N/A",
            dropoffAddress: rideRec.dropoff?.address || "N/A",
            fareInRupees: rideRec.fareInPaise ? rideRec.fareInPaise / 100 : rideRec.fare || 0,
            vehicleType: rideRec.vehicleType,
            status: rideRec.status,
            paymentMethod: rideRec.paymentMethod,
            paymentStatus: rideRec.paymentStatus,
            petFriendly: Boolean(rideRec.petFriendly),
            createdAt: rideRec.createdAt,
          };
        }),
        commutes: commutes.map((c) => {
          const commuteRec = c as unknown as {
            _id: unknown;
            title: string;
            pickup?: { address: string };
            dropoff?: { address: string };
            time: string;
            days: string[];
            vehicleType: string;
            isActive: boolean;
            petFriendly?: boolean;
            lastMaterializedAt?: Date | null;
          };
          return {
            id: commuteRec._id?.toString(),
            title: commuteRec.title,
            pickupAddress: commuteRec.pickup?.address || "N/A",
            dropoffAddress: commuteRec.dropoff?.address || "N/A",
            time: commuteRec.time,
            days: commuteRec.days || [],
            vehicleType: commuteRec.vehicleType,
            isActive: commuteRec.isActive,
            petFriendly: Boolean(commuteRec.petFriendly),
            lastMaterializedAt: commuteRec.lastMaterializedAt || null,
          };
        }),
        tickets: tickets.map((t) => {
          const ticketRec = t as unknown as {
            _id: unknown;
            ticketId: string;
            category: string;
            subject: string;
            status: string;
            priority: string;
            createdAt: Date;
          };
          return {
            id: ticketRec._id?.toString(),
            ticketId: ticketRec.ticketId,
            category: ticketRec.category,
            subject: ticketRec.subject,
            status: ticketRec.status,
            priority: ticketRec.priority,
            createdAt: ticketRec.createdAt,
          };
        }),
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Rider Detail API Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve rider profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid rider ID format" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { status, reason } = body;

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json(
        { status: "error", message: "Status must be either ACTIVE or SUSPENDED" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { status: "error", message: "Administrative reason (min 5 characters) is required." },
        { status: 400 }
      );
    }

    const rider = await User.findOne({
      _id: id,
      role: { $in: ["RIDER", "USER"] },
    });

    if (!rider) {
      return NextResponse.json(
        { status: "error", message: "Rider account not found" },
        { status: 404 }
      );
    }

    const prevStatus = rider.status || "ACTIVE";
    if (prevStatus === status) {
      return NextResponse.json({
        status: "success",
        message: `Rider is already ${status}`,
        data: { rider },
      });
    }

    rider.status = status;
    if (status === "SUSPENDED") {
      rider.tokenVersion = (rider.tokenVersion || 0) + 1;
    }
    await rider.save();

    await recordAdminAudit({
      actor: adminUser.userId,
      actorEmail: adminUser.email,
      action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
      targetType: "USER",
      targetId: rider._id.toString(),
      reason: reason.trim(),
      before: { status: prevStatus, tokenVersion: rider.tokenVersion ? rider.tokenVersion - 1 : 0 },
      after: { status, tokenVersion: rider.tokenVersion || 0 },
      req,
    });

    return NextResponse.json({
      status: "success",
      message: `Rider account successfully set to ${status}`,
      data: { rider },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Rider Status Patch Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update rider status" },
      { status: 500 }
    );
  }
}
