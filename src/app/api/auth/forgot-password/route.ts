import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";

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

    // Check for common typos like gamail.com
    const isGamail = normalizedEmail.includes("@gamail.com");

    await dbConnect();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    });

    if (!user) {
      const hint = isGamail
        ? " Did you mean @gmail.com? Please verify your email address."
        : " Please ensure you are using your registered Bhavo account email.";
      return NextResponse.json(
        {
          status: "error",
          message: `No account found with "${normalizedEmail}".${hint}`,
        },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    // Send via email service
    const emailResult = await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    console.log(`\n==========================================`);
    console.log(`🔐 [Bhavo Auth] OTP for: ${user.email}`);
    console.log(`🔑 OTP CODE: ${otp}`);
    console.log(`📨 Sent via SMTP: ${emailResult.sent}`);
    if (!emailResult.sent) {
      console.log(`⚠️ Reason: ${emailResult.error}`);
    }
    console.log(`==========================================\n`);

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

    // Fallback if SMTP is not configured
    return NextResponse.json(
      {
        status: "success",
        message: `OTP generated for ${user.email}. (Email server not configured in .env)`,
        delivery: "mock",
        devOtp: otp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { status: "error", message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
