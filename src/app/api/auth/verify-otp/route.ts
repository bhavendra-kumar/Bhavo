import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { status: "error", message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await dbConnect();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or OTP" },
        { status: 400 }
      );
    }

    if (user.resetOtp !== otp) {
      return NextResponse.json(
        { status: "error", message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (user.resetOtpExpiry < new Date()) {
      return NextResponse.json(
        { status: "error", message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // OTP is valid!
    return NextResponse.json(
      { status: "success", message: "OTP verified successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
