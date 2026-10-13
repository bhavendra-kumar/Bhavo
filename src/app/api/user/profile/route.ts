import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authenticatedUser = await requireRole(["RIDER", "USER"], req);

    await dbConnect();
    const user = await User.findById(authenticatedUser._id).select(
      "name email avatar role rating walletBalance phone emergencyContacts pets createdAt"
    );

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const totalRides = await Ride.countDocuments({ rider: user._id, status: "COMPLETED" });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar || null,
      role: user.role,
      rating: user.rating,
      walletBalance: user.walletBalance,
      emergencyContacts: user.emergencyContacts || [],
      pets: user.pets || [],
      totalRides,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ status: "success", data: userData });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("Profile GET error:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authenticatedUser = await requireRole(["RIDER", "USER"], req);

    const body = await req.json();
    const { name, phone, avatar, emergencyContacts, pets } = body;

    const updateFields: Record<string, unknown> = {};
    if (name && typeof name === "string") updateFields.name = name.trim();
    if (phone && typeof phone === "string") updateFields.phone = phone.trim();
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (Array.isArray(emergencyContacts)) updateFields.emergencyContacts = emergencyContacts;
    if (Array.isArray(pets)) updateFields.pets = pets;

    await dbConnect();
    const updatedUser = await User.findByIdAndUpdate(
      authenticatedUser._id,
      { $set: updateFields },
      { new: true }
    ).select("name email phone avatar emergencyContacts pets rating walletBalance role createdAt");

    if (!updatedUser) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const totalRides = await Ride.countDocuments({ rider: updatedUser._id, status: "COMPLETED" });

    const userData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar || null,
      role: updatedUser.role,
      rating: updatedUser.rating,
      walletBalance: updatedUser.walletBalance,
      emergencyContacts: updatedUser.emergencyContacts || [],
      pets: updatedUser.pets || [],
      totalRides,
    };

    return NextResponse.json({ status: "success", message: "Profile updated successfully", data: userData });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
