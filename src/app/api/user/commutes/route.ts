import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Commute from "@/models/Commute";
import { getSession } from "@/lib/auth";

export async function GET() {
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

    const commutes = await Commute.find({ rider: user._id }).sort({ createdAt: 1 });
    return NextResponse.json({ status: "success", data: commutes });
  } catch (error) {
    console.error("[Commutes GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

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
      title,
      pickup,
      dropoff,
      time,
      days = ["Mon", "Tue", "Wed", "Thu", "Fri"],
      vehicleType = "Cab Premium",
    } = body;

    if (!title || !pickup?.address || !dropoff?.address || !time) {
      return NextResponse.json(
        { status: "error", message: "Title, pickup, dropoff, and time are required" },
        { status: 400 }
      );
    }

    const commute = await Commute.create({
      rider: user._id,
      title,
      pickup: {
        address: pickup.address,
        coordinates: pickup.coordinates || [28.6139, 77.2090],
      },
      dropoff: {
        address: dropoff.address,
        coordinates: dropoff.coordinates || [28.5355, 77.3910],
      },
      time,
      days,
      vehicleType,
      isActive: true,
    });

    return NextResponse.json({ status: "success", data: commute }, { status: 201 });
  } catch (error) {
    console.error("[Commutes POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

    const { id, isActive } = await req.json();
    if (!id) {
      return NextResponse.json({ status: "error", message: "Commute ID required" }, { status: 400 });
    }

    const commute = await Commute.findOneAndUpdate(
      { _id: id, rider: user._id },
      { $set: { isActive } },
      { new: true }
    );

    return NextResponse.json({ status: "success", data: commute });
  } catch (error) {
    console.error("[Commutes PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: "error", message: "Commute ID required" }, { status: 400 });
    }

    const deleted = await Commute.findOneAndDelete({ _id: id, rider: user._id });
    if (!deleted) {
      return NextResponse.json({ status: "error", message: "Commute not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "Commute schedule deleted" });
  } catch (error) {
    console.error("[Commutes DELETE Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

