import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const user = await getDriverUser();

    return NextResponse.json({
      status: "success",
      data: {
        isOnline: user.isOnline ?? true,
        dutyState: user.dutyState || "ONLINE_SEARCHING",
        driverCoordinates: user.driverCoordinates || [28.6139, 77.2090],
      },
    });
  } catch (error) {
    console.error("[Driver Duty GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { isOnline } = body;

    await dbConnect();
    const user = await getDriverUser();

    user.isOnline = Boolean(isOnline);
    user.dutyState = isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
    await user.save();

    return NextResponse.json({
      status: "success",
      data: {
        isOnline: user.isOnline,
        dutyState: user.dutyState,
      },
    });
  } catch (error) {
    console.error("[Driver Duty POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
