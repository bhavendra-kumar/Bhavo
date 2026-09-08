import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback_secret_please_change_me_in_production"
);

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload; // { id, email, role }
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email }).select(
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
      phone: user.phone || "+91 98765 43210",
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
    console.error("Profile GET error:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, avatar, emergencyContacts, pets } = body;

    const updateFields: Record<string, unknown> = {};
    if (name && typeof name === "string") updateFields.name = name.trim();
    if (phone && typeof phone === "string") updateFields.phone = phone.trim();
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (Array.isArray(emergencyContacts)) updateFields.emergencyContacts = emergencyContacts;
    if (Array.isArray(pets)) updateFields.pets = pets;

    await dbConnect();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.email },
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
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
