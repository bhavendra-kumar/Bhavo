import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import Ticket from "@/models/Ticket";
import AdminAuditLog from "@/models/AdminAuditLog";
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
        { status: "error", message: "Invalid ride ID format" },
        { status: 400 }
      );
    }

    const [ride, relatedAuditLogs] = await Promise.all([
      Ride.findById(id)
        .populate("rider", "name email phone rating status")
        .populate("driver", "name email phone rating status isOnline dutyState driverVehicle")
        .lean(),
      AdminAuditLog.find({ targetId: id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    if (!ride) {
      return NextResponse.json(
        { status: "error", message: "Ride not found" },
        { status: 404 }
      );
    }

    const rideRec = ride as unknown as {
      _id: unknown;
      rider?: { _id: unknown; name: string; email: string; phone?: string; rating?: number; status?: string };
      driver?: {
        _id: unknown;
        name: string;
        email: string;
        phone?: string;
        rating?: number;
        status?: string;
        isOnline?: boolean;
        dutyState?: string;
        driverVehicle?: { model?: string; numberPlate?: string; type?: string };
      };
      driverDetails?: { name: string; phone: string; vehicleNumber: string; vehicleModel?: string };
      pickup: { address: string; landmark?: string; coordinates?: [number, number] };
      dropoff: { address: string; landmark?: string; coordinates?: [number, number] };
      vehicleType: string;
      distance?: string;
      duration?: string;
      fare: number;
      fareInPaise?: number;
      pricingSnapshot?: Record<string, unknown>;
      status: string;
      paymentMethod: string;
      paymentStatus: string;
      cashCollectedAt?: Date | null;
      cashCollectedBy?: unknown;
      razorpayOrderId?: string | null;
      razorpayPaymentId?: string | null;
      paymentConfirmedAt?: Date | null;
      petFriendly?: boolean;
      cancellationReason?: string | null;
      cancelledBy?: string | null;
      acceptedAt?: Date | null;
      arrivedAt?: Date | null;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      scheduledFor?: Date | null;
      commuteId?: unknown;
      autoBookingOccurrenceKey?: string | null;
      dispatchStatus?: string;
      dispatchAttempts?: number;
      currentOffer?: unknown;
      createdAt: Date;
      updatedAt: Date;
    };

    let relatedTickets: unknown[] = [];
    if (rideRec.rider?._id) {
      relatedTickets = await Ticket.find({ user: rideRec.rider._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("ticketId category subject status priority createdAt")
        .lean();
    }

    const isCommute = Boolean(rideRec.commuteId || rideRec.autoBookingOccurrenceKey);

    return NextResponse.json({
      status: "success",
      data: {
        ride: {
          id: rideRec._id?.toString(),
          rider: rideRec.rider
            ? {
                id: rideRec.rider._id?.toString(),
                name: rideRec.rider.name,
                email: rideRec.rider.email,
                phone: rideRec.rider.phone || "N/A",
                rating: rideRec.rider.rating,
                status: rideRec.rider.status,
              }
            : null,
          driver: rideRec.driver
            ? {
                id: rideRec.driver._id?.toString(),
                name: rideRec.driver.name,
                email: rideRec.driver.email,
                phone: rideRec.driver.phone || "N/A",
                rating: rideRec.driver.rating,
                status: rideRec.driver.status,
                isOnline: rideRec.driver.isOnline,
                dutyState: rideRec.driver.dutyState,
                vehicleNumber: rideRec.driver.driverVehicle?.numberPlate || "N/A",
                vehicleModel: rideRec.driver.driverVehicle?.model || "N/A",
              }
            : rideRec.driverDetails
            ? {
                id: null,
                name: rideRec.driverDetails.name,
                phone: rideRec.driverDetails.phone,
                vehicleNumber: rideRec.driverDetails.vehicleNumber,
                vehicleModel: rideRec.driverDetails.vehicleModel || "N/A",
              }
            : null,
          pickup: rideRec.pickup,
          dropoff: rideRec.dropoff,
          vehicleType: rideRec.vehicleType,
          distance: rideRec.distance || "N/A",
          duration: rideRec.duration || "N/A",
          fare: rideRec.fare,
          fareInPaise: rideRec.fareInPaise || Math.round((rideRec.fare || 0) * 100),
          fareInRupees: rideRec.fareInPaise ? rideRec.fareInPaise / 100 : rideRec.fare || 0,
          pricingSnapshot: rideRec.pricingSnapshot || null,
          status: rideRec.status,
          paymentMethod: rideRec.paymentMethod,
          paymentStatus: rideRec.paymentStatus,
          cashCollectedAt: rideRec.cashCollectedAt || null,
          razorpayOrderId: rideRec.razorpayOrderId || null,
          razorpayPaymentId: rideRec.razorpayPaymentId || null,
          paymentConfirmedAt: rideRec.paymentConfirmedAt || null,
          petFriendly: Boolean(rideRec.petFriendly),
          bookingType: isCommute ? "COMMUTE" : "ON_DEMAND",
          commuteId: rideRec.commuteId ? rideRec.commuteId.toString() : null,
          autoBookingOccurrenceKey: rideRec.autoBookingOccurrenceKey || null,
          scheduledFor: rideRec.scheduledFor || null,
          cancellation: {
            reason: rideRec.cancellationReason || null,
            by: rideRec.cancelledBy || null,
            cancelledAt: rideRec.cancelledAt || null,
          },
          dispatch: {
            status: rideRec.dispatchStatus || "N/A",
            attempts: rideRec.dispatchAttempts || 0,
          },
          timeline: {
            createdAt: rideRec.createdAt,
            acceptedAt: rideRec.acceptedAt || null,
            arrivedAt: rideRec.arrivedAt || null,
            startedAt: rideRec.startedAt || null,
            completedAt: rideRec.completedAt || null,
            cancelledAt: rideRec.cancelledAt || null,
          },
          updatedAt: rideRec.updatedAt,
        },
        relatedTickets,
        relatedAuditLogs,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Ride Detail Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve ride details" },
      { status: 500 }
    );
  }
}
