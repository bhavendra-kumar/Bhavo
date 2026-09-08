import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ status: "error", message: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await dbConnect();
    // Search with case-insensitive matching to find user regardless of how it was originally saved
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    });

    if (!user || !user.password) {
      console.warn(`[Auth Login 401] User not found for email: "${email}" (normalized: "${normalizedEmail}")`);
      return NextResponse.json({ status: "error", message: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`[Auth Login 401] Password mismatch for user: "${user.email}"`);
      return NextResponse.json({ status: "error", message: "Invalid email or password" }, { status: 401 });
    }

    console.log(`[Auth Login 200] Successful login for: "${user.email}" (${user.role})`);

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
