import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import User from "@/models/User";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";
import { isLocationValidAndFresh } from "@/lib/driverEligibility";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const statusFilter = searchParams.get("status") || "ALL";
    const petFriendlyFilter = searchParams.get("petFriendly");
    const vehicleTypeFilter = searchParams.get("vehicleType") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const activeStatuses: ("SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS")[] = [
      "SEARCHING",
      "ACCEPTED",
      "ARRIVED",
      "IN_PROGRESS",
    ];
    const query: Record<string, unknown> = {
      status: { $in: activeStatuses },
    };

    if (statusFilter !== "ALL" && (activeStatuses as string[]).includes(statusFilter)) {
      query.status = statusFilter;
    }

    if (petFriendlyFilter === "true") {
      query.petFriendly = true;
    } else if (petFriendlyFilter === "false") {
      query.petFriendly = { $ne: true };
    }

    if (vehicleTypeFilter !== "ALL") {
      query.vehicleType = vehicleTypeFilter;
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = new mongoose.Types.ObjectId(search);
      } else {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        query.$or = [
          { "pickup.address": regex },
          { "dropoff.address": regex },
          { vehicleType: regex },
        ];
      }
    }

    const [
      totalMatching,
      rides,
      searchingCount,
      acceptedCount,
      arrivedCount,
      inProgressCount,
      petFriendlyActiveCount,
      onlineDriversCount,
    ] = await Promise.all([
      Ride.countDocuments(query),
      Ride.find(query)
        .select(
          "rider driver driverDetails driverCoordinates driverCoordinatesUpdatedAt pickup dropoff vehicleType fare fareInPaise status paymentMethod paymentStatus petFriendly dispatchStatus dispatchAttempts currentOffer scheduledFor commuteId autoBookingOccurrenceKey createdAt startedAt acceptedAt arrivedAt"
        )
        .populate("rider", "name email phone")
        .populate("driver", "name email phone driverVehicle driverCoordinates driverCoordinatesUpdatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Ride.countDocuments({ status: "SEARCHING" }),
      Ride.countDocuments({ status: "ACCEPTED" }),
      Ride.countDocuments({ status: "ARRIVED" }),
      Ride.countDocuments({ status: "IN_PROGRESS" }),
      Ride.countDocuments({
        status: { $in: activeStatuses },
        petFriendly: true,
      }),
      User.countDocuments({
        role: "DRIVER",
        isOnline: true,
        status: "ACTIVE",
      }),
    ]);

    const now = new Date();

    const formattedRides = rides.map((r) => {
      const rideRec = r as unknown as {
        _id: unknown;
        rider?: { _id: unknown; name: string; email: string; phone?: string };
        driver?: {
          _id: unknown;
          name: string;
          email: string;
          phone?: string;
          driverVehicle?: { model?: string; numberPlate?: string; type?: string };
          driverCoordinates?: [number, number];
          driverCoordinatesUpdatedAt?: Date | string | null;
        };
        driverDetails?: { name: string; phone: string; vehicleNumber: string; vehicleModel?: string };
        driverCoordinates?: [number, number];
        driverCoordinatesUpdatedAt?: Date | string | null;
        pickup: { address: string; landmark?: string; coordinates?: [number, number] };
        dropoff: { address: string; landmark?: string; coordinates?: [number, number] };
        vehicleType: string;
        fare: number;
        fareInPaise?: number;
        status: string;
        paymentMethod: string;
        paymentStatus: string;
        petFriendly?: boolean;
        dispatchStatus?: string;
        dispatchAttempts?: number;
        currentOffer?: {
          offerId?: string;
          driverId?: unknown;
          offeredAt?: Date;
          expiresAt?: Date;
        } | null;
        scheduledFor?: Date | null;
        commuteId?: unknown;
        autoBookingOccurrenceKey?: string | null;
        createdAt: Date;
        startedAt?: Date | null;
        acceptedAt?: Date | null;
        arrivedAt?: Date | null;
      };

      const coords = rideRec.driverCoordinates || rideRec.driver?.driverCoordinates || null;
      const coordsUpdated = rideRec.driverCoordinatesUpdatedAt || rideRec.driver?.driverCoordinatesUpdatedAt || null;

      let locationFreshness: "FRESH" | "STALE" | "UNAVAILABLE" = "UNAVAILABLE";
      if (coords && Array.isArray(coords) && coords.length === 2 && coordsUpdated) {
        const isFresh = isLocationValidAndFresh(coords, coordsUpdated, 120, now);
        locationFreshness = isFresh ? "FRESH" : "STALE";
      }

      const isCommuteOccurrence = Boolean(rideRec.commuteId || rideRec.autoBookingOccurrenceKey);

      return {
        id: rideRec._id?.toString(),
        bookingType: isCommuteOccurrence ? "COMMUTE_OCCURRENCE" : "ON_DEMAND",
        autoBookingOccurrenceKey: rideRec.autoBookingOccurrenceKey || null,
        commuteId: rideRec.commuteId ? rideRec.commuteId.toString() : null,
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
              phone: rideRec.driver.phone || "N/A",
              vehicleNumber: rideRec.driver.driverVehicle?.numberPlate || rideRec.driverDetails?.vehicleNumber || "N/A",
              vehicleModel: rideRec.driver.driverVehicle?.model || rideRec.driverDetails?.vehicleModel || "N/A",
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
        pickup: {
          address: rideRec.pickup?.address || "N/A",
          landmark: rideRec.pickup?.landmark || null,
          coordinates: rideRec.pickup?.coordinates || null,
        },
        dropoff: {
          address: rideRec.dropoff?.address || "N/A",
          landmark: rideRec.dropoff?.landmark || null,
          coordinates: rideRec.dropoff?.coordinates || null,
        },
        vehicleType: rideRec.vehicleType,
        fareInPaise: rideRec.fareInPaise || Math.round((rideRec.fare || 0) * 100),
        fareInRupees: rideRec.fareInPaise ? rideRec.fareInPaise / 100 : rideRec.fare || 0,
        status: rideRec.status,
        paymentMethod: rideRec.paymentMethod,
        paymentStatus: rideRec.paymentStatus,
        petFriendly: Boolean(rideRec.petFriendly),
        dispatch: {
          status: rideRec.dispatchStatus || (rideRec.status === "SEARCHING" ? "DISPATCHING" : "ASSIGNED"),
          attempts: rideRec.dispatchAttempts || 0,
          currentOfferExpiresAt: rideRec.currentOffer?.expiresAt || null,
        },
        telemetry: {
          coordinates: coords,
          coordinatesUpdatedAt: coordsUpdated,
          freshness: locationFreshness,
        },
        timeline: {
          createdAt: rideRec.createdAt,
          acceptedAt: rideRec.acceptedAt || null,
          arrivedAt: rideRec.arrivedAt || null,
          startedAt: rideRec.startedAt || null,
          scheduledFor: rideRec.scheduledFor || null,
        },
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        metrics: {
          totalActive: searchingCount + acceptedCount + arrivedCount + inProgressCount,
          searchingCount,
          acceptedCount,
          arrivedCount,
          inProgressCount,
          petFriendlyActiveCount,
          onlineDriversCount,
        },
        rides: formattedRides,
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
    console.error("[Admin Live Operations API Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve live operations" },
      { status: 500 }
    );
  }
}
