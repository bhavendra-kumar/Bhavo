import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getSession } from "@/lib/auth";

// GET /api/user/rides - List rides with optional filter
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

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
    console.error("[Rides GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/user/rides - Book an instant or scheduled ride
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      pickup,
      dropoff,
      vehicleType = "Cab Premium",
      fare = 350,
      distance = "8.5 km",
      duration = "25 mins",
      scheduledFor = null,
      paymentMethod = "WALLET",
    } = body;

    if (!pickup?.address || !dropoff?.address) {
      return NextResponse.json(
        { status: "error", message: "Pickup and Dropoff locations are required" },
        { status: 400 }
      );
    }

    // Check if rider already has an active ride
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

    // Generate 4 digit OTP for driver verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newRide = await Ride.create({
      rider: user._id,
      pickup: {
        address: pickup.address,
        coordinates: pickup.coordinates || [28.6139, 77.2090],
        landmark: pickup.landmark || "",
      },
      dropoff: {
        address: dropoff.address,
        coordinates: dropoff.coordinates || [28.5355, 77.3910],
        landmark: dropoff.landmark || "",
      },
      vehicleType,
      fare: Number(typeof fare === "string" ? fare.replace(/[^0-9.]/g, "") : fare) || 250,
      distance,
      duration,
      status: "SEARCHING",
      driver: null,
      driverDetails: undefined,
      otp,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      paymentMethod,
      paymentStatus: "PENDING",
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
    console.error("[Rides POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
