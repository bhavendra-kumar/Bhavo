import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { checkDriverVerification, syncDriverDocuments } from "@/lib/driverCompliance";
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
        { status: "error", message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select(
      "-password -resetOtp"
    );

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User account not found" },
        { status: 404 }
      );
    }

    // Check for active rides
    const activeRide = await Ride.findOne({
      $or: [{ rider: user._id }, { driver: user._id }],
      status: { $in: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    })
      .select("status pickup dropoff fare fareInPaise vehicleType createdAt")
      .lean();

    // Lifetime ride stats
    const totalRidesAsRider = await Ride.countDocuments({ rider: user._id });
    const totalRidesAsDriver =
      user.role === "DRIVER" ? await Ride.countDocuments({ driver: user._id }) : 0;

    let driverCompliance = null;
    if (user.role === "DRIVER") {
      const syncedDocs = syncDriverDocuments(user.driverDocuments);
      const verification = checkDriverVerification({
        driverVehicle: user.driverVehicle,
        driverDocuments: syncedDocs,
      });
      driverCompliance = {
        verification,
        vehicle: user.driverVehicle || null,
        documents: syncedDocs,
      };
    }

    return NextResponse.json({
      status: "success",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "N/A",
          role: user.role === "USER" ? "RIDER" : user.role,
          status: user.status || "ACTIVE",
          rating: user.rating ?? 5.0,
          walletBalance: user.walletBalance ?? 0,
          tokenVersion: user.tokenVersion ?? 0,
          isOnline: Boolean(user.isOnline),
          dutyState: user.dutyState || "OFFLINE",
          activeRideId: user.activeRideId?.toString() || null,
          savedPlaces: user.savedPlaces || [],
          driverCompliance,
          stats: {
            totalRidesAsRider,
            totalRidesAsDriver,
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        activeRide: activeRide
          ? {
              id: (activeRide as { _id: unknown })._id?.toString(),
              status: activeRide.status,
              pickup: activeRide.pickup?.address,
              dropoff: activeRide.dropoff?.address,
              fare: activeRide.fare,
              fareInPaise: activeRide.fareInPaise,
              createdAt: activeRide.createdAt,
            }
          : null,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin User Detail Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve user details" },
      { status: 500 }
    );
  }
}
