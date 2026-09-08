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

    return NextResponse.json({ status: "success", data: ride });
  } catch (error) {
    console.error("[Ride GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { action } = body; // "cancel" or "advance_status"

    await dbConnect();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const ride = await Ride.findOne({ _id: id, rider: user._id });
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
        return NextResponse.json(
          { status: "error", message: `Cannot cancel a ride that is already ${ride.status}` },
          { status: 400 }
        );
      }
      ride.status = "CANCELLED";
      await ride.save();
      return NextResponse.json({ status: "success", message: "Ride cancelled successfully", data: ride });
    }

    // Interactive Demo / Testing: advance through statuses
    if (action === "advance_status") {
      const order: Array<"SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED"> = [
        "SEARCHING",
        "ACCEPTED",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
      ];
      const currentIndex = order.indexOf(ride.status as (typeof order)[number]);
      if (currentIndex !== -1 && currentIndex < order.length - 1) {
        ride.status = order[currentIndex + 1];
        if (ride.status === "COMPLETED") {
          ride.paymentStatus = "PAID";
        }
        await ride.save();
      }
      return NextResponse.json({ status: "success", message: `Status updated to ${ride.status}`, data: ride });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Ride PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
