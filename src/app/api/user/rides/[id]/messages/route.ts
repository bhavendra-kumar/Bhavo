import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    await dbConnect();
    const ride = await Ride.findOne({ _id: id, rider: user._id });
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

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
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Messages GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ status: "error", message: "Message text is required" }, { status: 400 });
    }

    await dbConnect();
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

    return NextResponse.json({ status: "success", data: ride.messages }, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Messages POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
