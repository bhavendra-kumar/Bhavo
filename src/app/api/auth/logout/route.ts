import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { status: "success", message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear the auth cookie by setting it to expire immediately
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0), 
    path: "/",
  });

  return response;
}
