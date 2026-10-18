import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";
import { calculateAuthoritativeFare, PricingError } from "@/lib/pricingEngine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toLowerCase();

    const query: Record<string, unknown> = { rider: user._id };

    if (statusParam === "active") {
      query.status = { $in: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] };
    } else if (statusParam === "upcoming") {
      query.scheduledFor = { $gt: new Date() };
      query.status = { $nin: ["CANCELLED", "COMPLETED"] };
    } else if (statusParam === "completed") {
      query.status = "COMPLETED";
    } else if (statusParam === "cancelled") {
      query.status = "CANCELLED";
    }

    const rides = await Ride.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      status: "success",
      data: rides,
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Rides GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);

    await dbConnect();
    const body = await req.json();
    const {
      pickup,
      dropoff,
      vehicleType = "Cab Premium",
      distance = "8.5 km",
      scheduledFor = null,
      paymentMethod = "WALLET",
      petFriendly = false,
      preferredDriver = null,
    } = body;

    if (!pickup?.address || !dropoff?.address) {
      return NextResponse.json(
        { status: "error", message: "Pickup and Dropoff locations are required" },
        { status: 400 }
      );
    }

    let validPreferredDriver: mongoose.Types.ObjectId | null = null;
    if (preferredDriver) {
      if (typeof preferredDriver === "string" && mongoose.isValidObjectId(preferredDriver)) {
        validPreferredDriver = new mongoose.Types.ObjectId(preferredDriver);
      } else {
        return NextResponse.json(
          { status: "error", code: "INVALID_PREFERRED_DRIVER", message: "Invalid preferred driver identifier." },
          { status: 400 }
        );
      }
    }

    const isPetFriendly = Boolean(petFriendly);

    const existingActiveRide = await Ride.findOne({
      rider: user._id,
      status: { $in: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    });

    if (existingActiveRide && !scheduledFor) {
      return NextResponse.json(
        {
          status: "error",
          message: "You already have an active ride in progress.",
          data: existingActiveRide,
        },
        { status: 409 }
      );
    }

    const otp = crypto.randomInt(1000, 10000).toString();

    let claimedDistKm: number | null = null;
    if (typeof distance === "string") {
      const parsed = parseFloat(distance.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed) && isFinite(parsed)) claimedDistKm = parsed;
    } else if (typeof distance === "number" && isFinite(distance)) {
      claimedDistKm = distance;
    }

    const pickupCoords = pickup.coordinates || [28.6139, 77.209];
    const dropoffCoords = dropoff.coordinates || [28.5355, 77.391];

    let fareResult;
    try {
      fareResult = calculateAuthoritativeFare({
        pickupCoordinates: pickupCoords,
        dropoffCoordinates: dropoffCoords,
        vehicleType,
        petFriendly: isPetFriendly,
        claimedDistanceKm: claimedDistKm,
      });
    } catch (pricingErr) {
      if (pricingErr instanceof PricingError) {
        return NextResponse.json(
          { status: "error", code: pricingErr.code, message: pricingErr.message },
          { status: pricingErr.statusCode }
        );
      }
      throw pricingErr;
    }

    const sanitizedPaymentMethod = ["WALLET", "CASH", "UPI", "ONLINE"].includes(paymentMethod)
      ? paymentMethod
      : "CASH";

    const newRide = await Ride.create({
      rider: user._id,
      pickup: {
        address: pickup.address,
        coordinates: pickupCoords,
        landmark: pickup.landmark || "",
      },
      dropoff: {
        address: dropoff.address,
        coordinates: dropoffCoords,
        landmark: dropoff.landmark || "",
      },
      vehicleType: fareResult.rateCard.name,
      fare: fareResult.fareInRupees,
      fareInPaise: fareResult.fareInPaise,
      distance: `${fareResult.distanceKm} km`,
      duration: `${fareResult.durationMins} mins`,
      pricingSnapshot: fareResult.pricingSnapshot,
      status: "SEARCHING",
      driver: null,
      driverDetails: undefined,
      otp,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      paymentMethod: sanitizedPaymentMethod,
      paymentStatus: "PENDING",
      petFriendly: isPetFriendly,
      preferredDriver: validPreferredDriver,
      currentOffer: null,
      rejectedDrivers: [],
      dispatchAttempts: 0,
      dispatchStatus: "PENDING_DISPATCH",
      messages: [
        {
          sender: "rider",
          text: "Hi! I am at the pickup location.",
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        status: "success",
        message: scheduledFor ? "Ride scheduled successfully!" : "Ride booked! Searching for drivers...",
        data: newRide,
      },
      { status: 201 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Rides POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
