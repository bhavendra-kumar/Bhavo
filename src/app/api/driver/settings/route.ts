import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    const settings = user.driverSettings || {
      autoAccept: false,
      audioCues: true,
      petFriendly: true,
      maxDistance: "ANY",
      destinationMode: false,
      destinationAddress: "Block C, Sector 62, Noida",
    };

    return NextResponse.json({
      status: "success",
      data: settings,
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Settings GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();
    const user = await getDriverUser(req);

    user.driverSettings = {
      ...user.driverSettings,
      ...body,
    };
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "Preferences updated successfully",
      data: user.driverSettings,
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Settings POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
