import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const ride = await Ride.findOne({ _id: id, rider: user._id });
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    // If no messages yet, seed an initial friendly driver message
    if (!ride.messages || ride.messages.length === 0) {
      const driverName = ride.driverDetails?.name || "Your Driver";
      const initialGreeting = {
        sender: "driver" as const,
        text: `Hi! I am ${driverName}. I have accepted your ride request and am on my way to your pickup location.`,
        timestamp: new Date(),
      };
      ride.messages = [initialGreeting];
      await ride.save();
    }

    return NextResponse.json({ status: "success", data: ride.messages });
  } catch (error) {
    console.error("[Messages GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ status: "error", message: "Message text is required" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const ride = await Ride.findOne({ _id: id, rider: user._id });
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    const riderMsg = {
      sender: "rider" as const,
      text: text.trim(),
      timestamp: new Date(),
    };

    ride.messages.push(riderMsg);
    await ride.save();

    // Trigger realistic contextual driver response after 1.5 seconds in background
    setTimeout(async () => {
      try {
        const currentRide = await Ride.findById(id);
        if (!currentRide) return;

        let reply = "Got it! Thanks for letting me know.";
        const lower = text.toLowerCase();
        if (lower.includes("where") || lower.includes("reach") || lower.includes("far") || lower.includes("time")) {
          reply = "I'm just 2 minutes away, arriving at the pickup point shortly!";
        } else if (lower.includes("ac") || lower.includes("cool")) {
          reply = "Sure, AC is turned on for you!";
        } else if (lower.includes("wait") || lower.includes("gate") || lower.includes("standing")) {
          reply = "Understood, please look for my vehicle with hazards on!";
        } else if (lower.includes("traffic") || lower.includes("slow")) {
          reply = "Yes, taking the fastest alternative route to reach you quickly.";
        }

        currentRide.messages.push({
          sender: "driver",
          text: reply,
          timestamp: new Date(),
        });
        await currentRide.save();
      } catch (e) {
        console.error("[Driver auto-reply error]:", e);
      }
    }, 1500);

    return NextResponse.json({ status: "success", data: ride.messages }, { status: 201 });
  } catch (error) {
    console.error("[Messages POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
