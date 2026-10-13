import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const todayRides = await Ride.find({
      driver: user._id,
      status: "COMPLETED",
      updatedAt: { $gte: startOfDay },
    });

    const weekRides = await Ride.find({
      driver: user._id,
      status: "COMPLETED",
      updatedAt: { $gte: startOfWeek },
    });

    const todayGrossDb = todayRides.reduce((acc, r) => acc + (r.fare || 0) + (r.tip || 0), 0);
    const todayTipsDb = todayRides.reduce((acc, r) => acc + (r.tip || 0), 0);

    const weekGrossDb = weekRides.reduce((acc, r) => acc + (r.fare || 0) + (r.tip || 0), 0);

    const todayEarnings = todayGrossDb;
    const weeklyEarnings = weekGrossDb;
    const tripsTodayCount = todayRides.length;
    const tripsWeekCount = weekRides.length;
    const todayTips = todayTipsDb;

    // Build 7-day trend directly from MongoDB week rides
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyTrend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      const isToday = i === 0;

      const ridesForDay = weekRides.filter((r) => {
        const uTime = new Date(r.updatedAt).getTime();
        return uTime >= d.getTime() && uTime < nextD.getTime();
      });

      const dayTotal = ridesForDay.reduce((acc, r) => acc + (r.fare || 0) + (r.tip || 0), 0);

      dailyTrend.push({
        day: isToday ? "Today" : dayNames[d.getDay()],
        amount: dayTotal,
        trips: ridesForDay.length,
        isToday,
      });
    }

    const maxAmount = Math.max(1, ...dailyTrend.map((d) => d.amount));
    const formattedDailyTrend = dailyTrend.map((d) => ({
      ...d,
      amt: d.amount,
      height: d.amount > 0 ? `${Math.max(15, Math.round((d.amount / maxAmount) * 100))}%` : "12%",
    }));

    const bankDoc = user.driverDocuments?.find((d: { name: string; docId?: string }) => d.name === "Bank Account Details");
    const bankAccount = {
      bankName: bankDoc ? "Linked Direct Deposit" : "Direct Deposit Account",
      accountNumber: bankDoc?.docId ? bankDoc.docId : "Registered Account",
      ifsc: "",
      holderName: user.name || "",
    };

    const recentCompletedRides = todayRides.slice(0, 5).map((r) => ({
      id: String(r._id),
      rider: "Passenger " + String(r._id).slice(-4),
      time: new Date(r.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fare: (r.fare || 0) + (r.tip || 0),
      tip: r.tip || 0,
      mode: r.paymentMethod || "UPI",
    }));

    return NextResponse.json({
      status: "success",
      data: {
        walletBalance: user.walletBalance ?? 0,
        todayEarnings,
        weeklyEarnings,
        tripsTodayCount,
        tripsToday: tripsTodayCount,
        tripsWeekCount,
        tripsWeek: tripsWeekCount,
        todayTips,
        tipsToday: todayTips,
        incentivesBonus: tripsTodayCount >= 4 ? 200 : 0,
        incentivesBonusWeek: weekRides.length >= 10 ? 350 : 0,
        averagePerTrip: tripsTodayCount > 0 ? Math.round(todayEarnings / tripsTodayCount) : 0,
        bankAccount,
        dailyTrend: formattedDailyTrend,
        recentCompletedRides,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Earnings GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/driver/earnings - Instant cashout / bank transfer
export async function POST(req: Request) {
  try {
    await dbConnect();
    // Validate driver authentication
    await getDriverUser(req);

    // Phase 1C: Disable mock cashout until banking/payout gateway integration is active
    return NextResponse.json(
      {
        status: "error",
        code: "CASHOUT_NOT_SUPPORTED_IN_V1",
        message:
          "Instant cashout / payout transfers are disabled in V1 until payment gateway / banking provider integration is active.",
      },
      { status: 501 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Earnings POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
