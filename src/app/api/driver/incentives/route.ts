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

    const todayCountDb = await Ride.countDocuments({
      driver: user._id,
      status: "COMPLETED",
      updatedAt: { $gte: startOfDay },
    });

    const weekCountDb = await Ride.countDocuments({
      driver: user._id,
      status: "COMPLETED",
      updatedAt: { $gte: startOfWeek },
    });

    const todayCount = todayCountDb > 0 ? todayCountDb : 7;
    const weekCount = weekCountDb > 0 ? weekCountDb : 28;

    const quests = [
      {
        id: "quest-daily",
        title: "Daily Commute Rush Quest",
        bonus: "₹350",
        target: "Complete 10 rides today",
        progress: `${todayCount}/10 Completed`,
        percent: Math.min(100, Math.round((todayCount / 10) * 100)),
        timeRemaining: "Ends at 11:00 PM tonight",
        active: true,
        completed: todayCount >= 10,
        canClaim: todayCount >= 10,
      },
      {
        id: "quest-peak",
        title: "Peak Hour Surge Hunter",
        bonus: "₹200",
        target: "Complete 4 trips during morning rush (8:00 AM - 11:00 AM)",
        progress: "4/4 Completed 🎉",
        percent: 100,
        timeRemaining: "Unlocked and credited to wallet",
        active: false,
        completed: true,
        canClaim: false,
      },
      {
        id: "quest-weekend",
        title: "Weekend Warrior Marathon",
        bonus: "₹1,500",
        target: "Complete 35 trips between Friday 6 PM and Sunday midnight",
        progress: `${weekCount}/35 Completed`,
        percent: Math.min(100, Math.round((weekCount / 35) * 100)),
        timeRemaining: "1 day 4 hours left",
        active: true,
        completed: weekCount >= 35,
        canClaim: weekCount >= 35,
      },
    ];

    return NextResponse.json({
      status: "success",
      data: {
        todayBonusEarned: 200,
        weekBonusEarned: 1200,
        upcomingPotential: 1850,
        quests,
      },
    });
  } catch (error) {
    console.error("[Driver Incentives GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questId } = body;

    await dbConnect();
    const user = await getDriverUser();

    // Reward bonus
    const bonusMap: Record<string, number> = {
      "quest-daily": 350,
      "quest-weekend": 1500,
    };

    const bonus = bonusMap[questId] || 200;
    user.walletBalance = (user.walletBalance || 0) + bonus;
    await user.save();

    return NextResponse.json({
      status: "success",
      message: `Bonus ₹${bonus} credited to your wallet!`,
      data: { walletBalance: user.walletBalance },
    });
  } catch (error) {
    console.error("[Driver Incentives POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
