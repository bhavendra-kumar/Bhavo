import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { checkDriverVerification, syncDriverDocuments, IDriverDoc } from "@/lib/driverCompliance";
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
        { status: "error", message: "Invalid driver ID format" },
        { status: 400 }
      );
    }

    const driver = await User.findById(id).select(
      "name email phone status isOnline dutyState rating driverVehicle driverDocuments createdAt"
    );

    if (!driver || driver.role !== "DRIVER") {
      return NextResponse.json(
        { status: "error", message: "Driver not found" },
        { status: 404 }
      );
    }

    const rawDocs = driver.driverDocuments as IDriverDoc[] | undefined;
    const syncedDocs = syncDriverDocuments(rawDocs);
    const verification = checkDriverVerification({
      driverVehicle: driver.driverVehicle,
      driverDocuments: syncedDocs,
    });

    const activeRide = await Ride.findOne({
      driver: driver._id,
      status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    })
      .select("status pickup dropoff fare fareInPaise vehicleType createdAt")
      .lean();

    const recentRides = await Ride.find({ driver: driver._id })
      .select("status pickup dropoff fare fareInPaise vehicleType createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      status: "success",
      data: {
        driver: {
          id: driver._id.toString(),
          name: driver.name,
          email: driver.email,
          phone: driver.phone || "N/A",
          status: driver.status || "ACTIVE",
          isOnline: Boolean(driver.isOnline),
          dutyState: driver.dutyState || "OFFLINE",
          rating: driver.rating ?? 5.0,
          vehicle: driver.driverVehicle || {},
          documents: syncedDocs,
          verification,
          createdAt: driver.createdAt,
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
        recentRides: recentRides.map((r) => ({
          id: (r as { _id: unknown })._id?.toString(),
          status: r.status,
          pickup: r.pickup?.address,
          dropoff: r.dropoff?.address,
          fare: r.fare,
          fareInPaise: r.fareInPaise,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Driver Detail Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to load driver details" },
      { status: 500 }
    );
  }
}
