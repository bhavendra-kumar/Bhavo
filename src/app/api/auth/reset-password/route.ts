import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { status: "error", message: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { status: "error", message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await dbConnect();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or OTP" },
        { status: 400 }
      );
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      return NextResponse.json(
        { status: "error", message: "No active password reset request found. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.resetOtpExpiry)) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      return NextResponse.json(
        { status: "error", message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (user.resetOtp !== String(otp).trim()) {
      return NextResponse.json(
        { status: "error", message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);

    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    const userWithAttempts = user as unknown as { resetOtpAttempts?: number };
    userWithAttempts.resetOtpAttempts = 0;
    await user.save();

    return NextResponse.json(
      { status: "success", message: "Password reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
