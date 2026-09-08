import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Place from "@/models/Place";
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

    let places = await Place.find({ rider: user._id }).sort({ createdAt: -1 });

    // Seed default places if none exist
    if (places.length === 0) {
      places = await Place.create([
        {
          rider: user._id,
          name: "Home",
          address: "Apt 4B, Serenity Heights, Sector 12, Delhi",
          coordinates: [28.6139, 77.2090],
          tag: "Home",
          isFavorite: true,
        },
        {
          rider: user._id,
          name: "Office",
          address: "Bhavo Headquarters, Sector 44, Cyber City, Gurgaon",
          coordinates: [28.5355, 77.3910],
          tag: "Work",
          isFavorite: true,
        },
        {
          rider: user._id,
          name: "FitPro Gym",
          address: "FitPro Fitness Center, Block C, Downtown",
          coordinates: [28.5700, 77.3200],
          tag: "Gym",
          isFavorite: false,
        },
      ]);
    }

    return NextResponse.json({ status: "success", data: places });
  } catch (error) {
    console.error("[Places GET Error]:", error);
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
    const { name, address, coordinates = [28.6139, 77.2090], tag = "Other", isFavorite = false } = body;

    if (!name || !address) {
      return NextResponse.json(
        { status: "error", message: "Place name and address are required" },
        { status: 400 }
      );
    }

    const newPlace = await Place.create({
      rider: user._id,
      name,
      address,
      coordinates,
      tag,
      isFavorite,
    });

    return NextResponse.json({ status: "success", data: newPlace }, { status: 201 });
  } catch (error) {
    console.error("[Places POST Error]:", error);
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

    const body = await req.json();
    const { id, name, address, tag, isFavorite } = body;

    if (!id) {
      return NextResponse.json({ status: "error", message: "Place ID is required" }, { status: 400 });
    }

    const updated = await Place.findOneAndUpdate(
      { _id: id, rider: user._id },
      { $set: { ...(name && { name }), ...(address && { address }), ...(tag && { tag }), ...(typeof isFavorite === "boolean" && { isFavorite }) } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ status: "error", message: "Place not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", data: updated });
  } catch (error) {
    console.error("[Places PATCH Error]:", error);
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
      return NextResponse.json({ status: "error", message: "Place ID is required" }, { status: 400 });
    }

    const deleted = await Place.findOneAndDelete({ _id: id, rider: user._id });
    if (!deleted) {
      return NextResponse.json({ status: "error", message: "Place not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "Place deleted successfully" });
  } catch (error) {
    console.error("[Places DELETE Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
