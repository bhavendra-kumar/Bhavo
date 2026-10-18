import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";
import { checkDriverVerification } from "@/lib/driverCompliance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);
    const verification = checkDriverVerification(user);

    if (!verification.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();
    }

    return NextResponse.json({
      status: "success",
      data: {
        isOnline: verification.isVerified ? (user.isOnline ?? false) : false,
        dutyState: verification.isVerified && user.isOnline ? (user.dutyState || "ONLINE_SEARCHING") : "OFFLINE",
        driverCoordinates: user.driverCoordinates || [28.6139, 77.2090],
        verification,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Duty GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { isOnline } = body;

    await dbConnect();
    const user = await getDriverUser(req);
    const verification = checkDriverVerification(user);

    if (Boolean(isOnline) && !verification.isVerified) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();

      return NextResponse.json(
        {
          status: "error",
          code: "DOCUMENTS_UNVERIFIED",
          message:
            verification.reason ||
            "All driver and vehicle documents must be verified before coming online.",
          data: {
            isOnline: false,
            dutyState: "OFFLINE",
            verification,
          },
        },
        { status: 403 }
      );
    }

    const Ride = (await import("@/models/Ride")).default;
    const activeRide = await Ride.findOne({
      driver: user._id,
      status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    });

    if (activeRide) {
      user.isOnline = Boolean(isOnline);
      user.dutyState = "ON_TRIP";
      user.activeRideId = activeRide._id;
      await user.save();
    } else {
      user.isOnline = Boolean(isOnline);
      user.dutyState = isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      user.activeRideId = null;
      await user.save();
    }

    return NextResponse.json({
      status: "success",
      data: {
        isOnline: user.isOnline,
        dutyState: user.dutyState,
        verification,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Duty POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
