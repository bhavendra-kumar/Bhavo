import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const driverUser = await getDriverUser(req);

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({
        status: "success",
        data: [
          {
            sender: "rider",
            text: "Hi! I am waiting near the main gate.",
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    if (ride.driver && ride.driver.toString() !== driverUser._id.toString()) {
      return NextResponse.json({ status: "error", message: "Forbidden: Not assigned to this ride" }, { status: 403 });
    }

    if (!ride.messages || ride.messages.length === 0) {
      ride.messages = [
        {
          sender: "rider",
          text: "Hi Captain! I am waiting near the main security gate.",
          timestamp: new Date(),
        },
      ];
      await ride.save();
    }

    return NextResponse.json({ status: "success", data: ride.messages });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Messages GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ status: "error", message: "Message text is required" }, { status: 400 });
    }

    await dbConnect();
    const driverUser = await getDriverUser(req);

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({
        status: "success",
        data: [
          { sender: "driver", text: text.trim(), timestamp: new Date().toISOString() },
          { sender: "rider", text: "Got it! Thanks Captain.", timestamp: new Date().toISOString() },
        ],
      });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    if (ride.driver && ride.driver.toString() !== driverUser._id.toString()) {
      return NextResponse.json({ status: "error", message: "Forbidden: Not assigned to this ride" }, { status: 403 });
    }

    const driverMsg = {
      sender: "driver" as const,
      text: text.trim(),
      timestamp: new Date(),
    };

    ride.messages.push(driverMsg);
    await ride.save();

    setTimeout(async () => {
      try {
        const currentRide = await Ride.findById(id);
        if (!currentRide || currentRide.status === "COMPLETED" || currentRide.status === "CANCELLED") return;

        let reply = "Got it! Thanks for the update Captain.";
        const lower = text.toLowerCase();
        if (lower.includes("arrived") || lower.includes("reach") || lower.includes("outside") || lower.includes("gate")) {
          reply = "Perfect, walking to your car right now!";
        } else if (lower.includes("traffic") || lower.includes("jam") || lower.includes("delay")) {
          reply = "No problem at all, take your time!";
        } else if (lower.includes("hazard") || lower.includes("look")) {
          reply = "I see your vehicle with hazards on, heading over!";
        }

        currentRide.messages.push({
          sender: "rider",
          text: reply,
          timestamp: new Date(),
        });
        await currentRide.save();
      } catch (e) {
        console.error("[Passenger Auto-Reply Error]:", e);
      }
    }, 1500);

    return NextResponse.json({ status: "success", data: ride.messages }, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Messages POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
