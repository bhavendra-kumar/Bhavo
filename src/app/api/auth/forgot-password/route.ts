import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { status: "error", message: "Email is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200 to prevent email enumeration attacks
      return NextResponse.json(
        { status: "success", message: "If that email exists, an OTP has been sent." },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    // MOCK EMAIL SEND
    console.log(`\n\n==========================================`);
    console.log(`🔐 MOCK EMAIL SENT TO: ${email}`);
    console.log(`🔑 YOUR OTP IS: ${otp}`);
    console.log(`==========================================\n\n`);

    return NextResponse.json(
      { status: "success", message: "OTP sent to email successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
