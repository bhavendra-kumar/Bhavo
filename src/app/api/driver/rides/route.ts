import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rideId, otp } = body;

    await dbConnect();
    const session = await getSession();
    let driverUser = null;
    if (session?.email) {
      driverUser = await User.findOne({ email: session.email });
    }

    if (!rideId) {
      return NextResponse.json({ status: "error", message: "Ride ID is required" }, { status: 400 });
    }

    // Check if ride exists in DB if valid ObjectId (supports simulated demo dispatches)
    const ride = mongoose.isValidObjectId(rideId) ? await Ride.findById(rideId) : null;

    if (action === "ACCEPT") {
      if (ride) {
        ride.status = "ACCEPTED";
        if (driverUser) {
          ride.driver = driverUser._id;
          ride.driverDetails = {
            name: driverUser.name,
            phone: driverUser.phone || "+91 98765 43210",
            rating: driverUser.rating || 4.9,
            vehicleNumber: "DL-01-EV-4429",
            vehicleModel: "Tata Tigor EV",
            avatar: driverUser.avatar || null,
          };
        }
        await ride.save();
      }
      return NextResponse.json({ status: "success", message: "Ride accepted" });
    }

    if (action === "ARRIVED") {
      if (ride) {
        ride.status = "ARRIVED";
        await ride.save();
      }
      return NextResponse.json({ status: "success", message: "Driver marked as arrived" });
    }

    if (action === "START") {
      if (ride) {
        if (ride.otp && otp && ride.otp !== otp.trim()) {
          return NextResponse.json({ status: "error", message: "Invalid OTP code" }, { status: 400 });
        }
        ride.status = "IN_PROGRESS";
        await ride.save();
      }
      return NextResponse.json({ status: "success", message: "Ride started" });
    }

    if (action === "COMPLETE") {
      if (ride) {
        ride.status = "COMPLETED";
        ride.paymentStatus = "PAID";
        await ride.save();
      }
      if (driverUser && ride) {
        driverUser.walletBalance = (driverUser.walletBalance || 0) + (ride.fare || 250);
        await driverUser.save();
      }
      return NextResponse.json({ status: "success", message: "Ride completed successfully" });
    }

    if (action === "CANCEL") {
      if (ride) {
        ride.status = "CANCELLED";
        await ride.save();
      }
      return NextResponse.json({ status: "success", message: "Ride cancelled" });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Driver Ride Action Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
