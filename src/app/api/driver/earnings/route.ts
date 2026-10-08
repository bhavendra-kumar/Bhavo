import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const user = await getDriverUser();

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

      const amount = ridesForDay.reduce((acc, r) => acc + (r.fare || 0) + (r.tip || 0), 0);

      dailyTrend.push({
        day: isToday ? "Today" : dayNames[d.getDay()],
        amt: amount,
        height: `${Math.min(100, Math.max(12, Math.round((amount / 3000) * 100)))}%`,
        isToday,
      });
    }

    return NextResponse.json({
      status: "success",
      data: {
        walletBalance: user.walletBalance ?? 0,
        todayEarnings,
        weeklyEarnings,
        tripsToday: tripsTodayCount,
        tripsWeek: tripsWeekCount,
        tipsToday: todayTips,
        incentivesBonusWeek: tripsWeekCount >= 10 ? 1200 : 0,
        averagePerTrip: tripsTodayCount > 0 ? Math.round(todayEarnings / tripsTodayCount) : 0,
        bankAccount: {
          bankName: "HDFC Bank",
          accountNumber: "•••• 4921",
          ifsc: "HDFC0001824",
          holderName: user.name,
        },
        dailyTrend,
      },
    });
  } catch (error) {
    console.error("[Driver Earnings GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/driver/earnings - Instant cashout / bank transfer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount } = body;

    await dbConnect();
    const user = await getDriverUser();

    const currentBalance = user.walletBalance ?? 0;
    const cashoutAmount = Number(amount) || currentBalance;

    if (cashoutAmount <= 0) {
      return NextResponse.json({ status: "error", message: "Invalid cashout amount" }, { status: 400 });
    }

    if (cashoutAmount > currentBalance) {
      return NextResponse.json({ status: "error", message: "Insufficient wallet balance" }, { status: 400 });
    }

    user.walletBalance = currentBalance - cashoutAmount;
    await user.save();

    const referenceId = `BHAVO-PAY-${Date.now().toString().slice(-6)}`;

    return NextResponse.json({
      status: "success",
      message: "Payout transferred successfully to your bank account",
      data: {
        transferredAmount: cashoutAmount,
        remainingBalance: user.walletBalance,
        referenceId,
        destination: "HDFC Bank (•••• 4921)",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Driver Earnings POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
