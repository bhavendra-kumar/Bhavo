import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rideId, otp, riderRating, riderCompliments, reason, coordinates } = body;

    await dbConnect();
    const driverUser = await getDriverUser();

    if (!rideId && action !== "UPDATE_LOCATION") {
      return NextResponse.json({ status: "error", message: "Ride ID is required" }, { status: 400 });
    }

    // Check if ride exists in DB if valid ObjectId
    const ride = rideId && mongoose.isValidObjectId(rideId) ? await Ride.findById(rideId) : null;

    if (action === "ACCEPT") {
      if (ride) {
        ride.status = "ACCEPTED";
        ride.driver = driverUser._id;
        ride.driverDetails = {
          name: driverUser.name,
          phone: driverUser.phone || "+91 98765 43210",
          rating: driverUser.rating || 4.94,
          vehicleNumber: driverUser.driverVehicle?.numberPlate || "DL-01-EV-4429",
          vehicleModel: driverUser.driverVehicle?.model || "Tata Tigor EV",
          avatar: driverUser.avatar || null,
        };
        ride.driverCoordinates = driverUser.driverCoordinates || [28.6139, 77.2090];
        await ride.save();
      }

      driverUser.dutyState = "ON_TRIP";
      await driverUser.save();

      return NextResponse.json({ status: "success", message: "Ride accepted", data: ride });
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
        const cleanOtp = String(otp || "").trim();
        // Allow actual ride OTP, or universal test bypass codes
        if (ride.otp && cleanOtp && ride.otp !== cleanOtp && cleanOtp !== "1234" && cleanOtp !== "4826") {
          return NextResponse.json({ status: "error", message: "Invalid OTP code" }, { status: 400 });
        }
        ride.status = "IN_PROGRESS";
        await ride.save();
      }
      return NextResponse.json({ status: "success", message: "Ride started" });
    }

    if (action === "COMPLETE") {
      const tipAmount = 25;
      if (ride) {
        ride.status = "COMPLETED";
        ride.paymentStatus = "PAID";
        ride.tip = tipAmount;
        if (riderRating) ride.riderRating = riderRating;
        if (riderCompliments && Array.isArray(riderCompliments)) {
          ride.riderCompliments = riderCompliments;
        }
        await ride.save();
      }

      const creditedAmount = (ride?.fare || 250) + tipAmount;
      driverUser.walletBalance = (driverUser.walletBalance || 0) + creditedAmount;
      driverUser.dutyState = driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      await driverUser.save();

      return NextResponse.json({
        status: "success",
        message: "Ride completed successfully",
        data: { walletBalance: driverUser.walletBalance, creditedAmount },
      });
    }

    if (action === "CANCEL") {
      if (ride) {
        ride.status = "CANCELLED";
        ride.cancellationReason = reason || "Driver requested cancellation";
        await ride.save();
      }
      driverUser.dutyState = driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      await driverUser.save();

      return NextResponse.json({ status: "success", message: "Ride cancelled" });
    }

    if (action === "UPDATE_LOCATION") {
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        driverUser.driverCoordinates = coordinates as [number, number];
        await driverUser.save();
        if (ride) {
          ride.driverCoordinates = coordinates as [number, number];
          await ride.save();
        }
      }
      return NextResponse.json({ status: "success", message: "Location updated" });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Driver Ride Action Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
