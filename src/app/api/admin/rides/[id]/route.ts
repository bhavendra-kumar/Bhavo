import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
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

    const ride = await Ride.findById(id)
      .populate("rider", "name email phone rating status")
      .populate("driver", "name email phone rating status isOnline dutyState")
      .lean();

    if (!ride) {
      return NextResponse.json(
        { status: "error", message: "Ride not found" },
        { status: 404 }
      );
    }

    const rideRec = ride as unknown as {
      _id: unknown;
      rider?: { _id: unknown; name: string; email: string; phone?: string; rating?: number; status?: string };
      driver?: { _id: unknown; name: string; email: string; phone?: string; rating?: number; status?: string; isOnline?: boolean; dutyState?: string };
      driverDetails?: Record<string, unknown>;
      pickup: { address: string; landmark?: string };
      dropoff: { address: string; landmark?: string };
      vehicleType: string;
      distance?: string;
      duration?: string;
      fare: number;
      fareInPaise?: number;
      pricingSnapshot?: Record<string, unknown>;
      status: string;
      paymentMethod: string;
      paymentStatus: string;
      cashCollectedAt?: Date;
      scheduledFor?: Date | null;
      autoBookingOccurrenceKey?: string | null;
      otp?: string;
      dispatchOffers?: Array<{ driverId: unknown; offeredAt: Date; expiresAt: Date }>;
      createdAt: Date;
      updatedAt: Date;
    };

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
              }
            : null,
          driverDetails: rideRec.driverDetails || null,
          pickup: {
            address: rideRec.pickup.address,
            landmark: rideRec.pickup.landmark || null,
          },
          dropoff: {
            address: rideRec.dropoff.address,
            landmark: rideRec.dropoff.landmark || null,
          },
          vehicleType: rideRec.vehicleType,
          distance: rideRec.distance || "N/A",
          duration: rideRec.duration || "N/A",
          fare: rideRec.fare,
          fareInPaise: rideRec.fareInPaise,
          pricingSnapshot: rideRec.pricingSnapshot || null,
          status: rideRec.status,
          paymentMethod: rideRec.paymentMethod,
          paymentStatus: rideRec.paymentStatus,
          cashCollectedAt: rideRec.cashCollectedAt || null,
          scheduledFor: rideRec.scheduledFor || null,
          isAutoBooked: Boolean(rideRec.autoBookingOccurrenceKey),
          autoBookingOccurrenceKey: rideRec.autoBookingOccurrenceKey || null,
          dispatchOfferCount: Array.isArray(rideRec.dispatchOffers) ? rideRec.dispatchOffers.length : 0,
          createdAt: rideRec.createdAt,
          updatedAt: rideRec.updatedAt,
        },
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
