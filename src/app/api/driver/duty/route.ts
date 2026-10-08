import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";
import { checkDriverVerification } from "@/lib/driverCompliance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const user = await getDriverUser();
    const verification = checkDriverVerification(user);

    // If documents are not verified, driver is never allowed to be online
    if (!verification.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();
    }

    return NextResponse.json({
      status: "success",
      data: {
        isOnline: verification.isVerified ? (user.isOnline ?? true) : false,
        dutyState: verification.isVerified ? (user.dutyState || "ONLINE_SEARCHING") : "OFFLINE",
        driverCoordinates: user.driverCoordinates || [28.6139, 77.2090],
        verification,
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
    const verification = checkDriverVerification(user);

    // STRICT COMPLIANCE CHECK: Prevent driver from coming online if documents are unverified
    if (Boolean(isOnline) && !verification.isVerified) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();

      return NextResponse.json(
        {
          status: "error",
          code: "DOCUMENTS_UNVERIFIED",
          message:
            verification.reason ||
            "All driver and vehicle documents must be verified before coming online.",
          data: {
            isOnline: false,
            dutyState: "OFFLINE",
            verification,
          },
        },
        { status: 403 }
      );
    }

    user.isOnline = Boolean(isOnline);
    user.dutyState = isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
    await user.save();

    return NextResponse.json({
      status: "success",
      data: {
        isOnline: user.isOnline,
        dutyState: user.dutyState,
        verification,
      },
    });
  } catch (error) {
    console.error("[Driver Duty POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
