import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import {
  otpRateLimiter,
  getOtpRateLimitKey,
  getClientIp,
} from "@/lib/rateLimit";

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
    const clientIp = getClientIp(req);
    const rateKey = getOtpRateLimitKey(clientIp, normalizedEmail);

    const rateCheck = await otpRateLimiter.check(rateKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          status: "error",
          code: "TOO_MANY_REQUESTS",
          message: "Too many OTP verification attempts. Please wait before trying again.",
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    await dbConnect();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (!user) {
      await otpRateLimiter.recordFailure(rateKey);
      return NextResponse.json(
        { status: "error", message: "Invalid email or OTP" },
        { status: 400 }
      );
    }

    const userWithAttempts = user as unknown as { resetOtpAttempts?: number };
    const currentAttempts = (userWithAttempts.resetOtpAttempts || 0) + 1;
    userWithAttempts.resetOtpAttempts = currentAttempts;

    if (currentAttempts > 5) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      userWithAttempts.resetOtpAttempts = 0;
      await user.save();
      return NextResponse.json(
        { status: "error", message: "Too many failed attempts. This OTP has been invalidated. Please request a new one." },
        { status: 429 }
      );
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      await user.save();
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
        { status: "error", message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (user.resetOtp !== String(otp).trim()) {
      await user.save();
      await otpRateLimiter.recordFailure(rateKey);
      return NextResponse.json(
        { status: "error", message: `Invalid OTP. ${5 - currentAttempts} attempts remaining.` },
        { status: 400 }
      );
    }

    await user.save();
    await otpRateLimiter.reset(rateKey);

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
