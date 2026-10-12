import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
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
    const paymentStatusFilter = searchParams.get("paymentStatus") || "ALL";
    const riderId = searchParams.get("riderId");
    const driverId = searchParams.get("driverId");
    const search = searchParams.get("search")?.trim() || "";

    const query: Record<string, unknown> = {};

    if (statusFilter !== "ALL") {
      query.status = statusFilter;
    }

    if (paymentStatusFilter !== "ALL") {
      query.paymentStatus = paymentStatusFilter;
    }

    if (riderId && mongoose.Types.ObjectId.isValid(riderId)) {
      query.rider = new mongoose.Types.ObjectId(riderId);
    }

    if (driverId && mongoose.Types.ObjectId.isValid(driverId)) {
      query.driver = new mongoose.Types.ObjectId(driverId);
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = new mongoose.Types.ObjectId(search);
      } else {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [
          { "pickup.address": regex },
          { "dropoff.address": regex },
          { vehicleType: regex },
        ];
      }
    }

    const totalMatching = await Ride.countDocuments(query);
    const rides = await Ride.find(query)
      .select(
        "rider driver driverDetails pickup.address dropoff.address fare fareInPaise vehicleType status paymentMethod paymentStatus scheduledFor autoBookingOccurrenceKey createdAt"
      )
      .populate("rider", "name email phone")
      .populate("driver", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      status: "success",
      data: {
        rides: rides.map((r) => {
          const rideRec = r as unknown as {
            _id: unknown;
            rider?: { _id: unknown; name: string; email: string; phone?: string };
            driver?: { _id: unknown; name: string; email: string; phone?: string };
            driverDetails?: { name: string; phone: string; vehicleNumber: string };
            pickup?: { address: string };
            dropoff?: { address: string };
            fare: number;
            fareInPaise?: number;
            vehicleType: string;
            status: string;
            paymentMethod: string;
            paymentStatus: string;
            scheduledFor?: Date | null;
            autoBookingOccurrenceKey?: string | null;
            createdAt: Date;
          };

          return {
            id: rideRec._id?.toString(),
            rider: rideRec.rider
              ? {
                  id: rideRec.rider._id?.toString(),
                  name: rideRec.rider.name,
                  email: rideRec.rider.email,
                  phone: rideRec.rider.phone || "N/A",
                }
              : null,
            driver: rideRec.driver
              ? {
                  id: rideRec.driver._id?.toString(),
                  name: rideRec.driver.name,
                  email: rideRec.driver.email,
                  phone: rideRec.driver.phone || "N/A",
                }
              : null,
            pickupAddress: rideRec.pickup?.address || "N/A",
            dropoffAddress: rideRec.dropoff?.address || "N/A",
            fare: rideRec.fare,
            fareInPaise: rideRec.fareInPaise,
            vehicleType: rideRec.vehicleType,
            status: rideRec.status,
            paymentMethod: rideRec.paymentMethod,
            paymentStatus: rideRec.paymentStatus,
            scheduledFor: rideRec.scheduledFor || null,
            isAutoBooked: Boolean(rideRec.autoBookingOccurrenceKey),
            createdAt: rideRec.createdAt,
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
    console.error("[Admin Rides List Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve ride records" },
      { status: 500 }
    );
  }
}
