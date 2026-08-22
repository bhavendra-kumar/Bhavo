import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { updateProfileSchema } from "@/lib/validations/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_please_change_me_in_production"
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
      "name email avatar role rating walletBalance createdAt"
    );

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
      rating: user.rating,
      walletBalance: user.walletBalance,
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
    const parsed = updateProfileSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid input data", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.email },
      { $set: parsed.data },
      { new: true }
    ).select("name email avatar");

    const userData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar || null,
    };

    return NextResponse.json({ status: "success", message: "Profile updated successfully", data: userData });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
