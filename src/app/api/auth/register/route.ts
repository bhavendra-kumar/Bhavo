import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { hash } from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid input data", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { status: "error", message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const requestedRole = parsed.data.role?.trim().toUpperCase();
    const assignedRole = requestedRole === "DRIVER" ? "DRIVER" : "RIDER";

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      ...(phone?.trim() ? { phone: phone.trim() } : {}),
    });

    return NextResponse.json(
      {
        status: "success",
        message: "User registered successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
