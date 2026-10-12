import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";
import {
  forgotPasswordRateLimiter,
  getForgotPasswordRateLimitKey,
  getClientIp,
} from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { status: "error", message: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(req);
    const rateKey = getForgotPasswordRateLimitKey(clientIp, normalizedEmail);

    const rateCheck = await forgotPasswordRateLimiter.check(rateKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          status: "error",
          code: "TOO_MANY_REQUESTS",
          message: "Too many password reset requests. Please wait a few minutes before trying again.",
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
      await forgotPasswordRateLimiter.recordFailure(rateKey);
      return NextResponse.json(
        {
          status: "error",
          message: "No account found with this email address.",
        },
        { status: 404 }
      );
    }

    // Cryptographically secure 6-digit OTP generation
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    // Reset attempt counter
    (user as unknown as { resetOtpAttempts?: number }).resetOtpAttempts = 0;
    await user.save();

    // Send via email service
    const emailResult = await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    if (emailResult.sent) {
      return NextResponse.json(
        {
          status: "success",
          message: `OTP sent successfully to ${user.email}.`,
          delivery: "email",
        },
        { status: 200 }
      );
    }

    // Safe fallback response when email server is not configured in development/test
    // CRITICAL: NEVER leak the plaintext OTP in the response body or production logs!
    return NextResponse.json(
      {
        status: "success",
        message: `Password reset request registered for ${user.email}.`,
        delivery: "mock",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Forgot password error:", err.message);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
