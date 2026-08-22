import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_please_change_me_in_production"
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ status: "error", message: "Email and password are required" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return NextResponse.json({ status: "error", message: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ status: "error", message: "Invalid email or password" }, { status: 401 });
    }

    // Generate JWT token using jose
    const alg = "HS256";
    const jwt = await new SignJWT({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("7d") // 7 days expiration
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      status: "success",
      message: "Logged in successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 200 });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "auth_token",
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
