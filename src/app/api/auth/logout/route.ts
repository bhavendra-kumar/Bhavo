import { NextResponse } from "next/server";
import { getClearAuthCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json(
    { status: "success", message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear the auth cookie using centralized secure configuration
  response.cookies.set(getClearAuthCookieOptions());

  return response;
}
