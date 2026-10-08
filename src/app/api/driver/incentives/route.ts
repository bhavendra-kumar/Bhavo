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

    const todayCount = todayCountDb;
    const weekCount = weekCountDb;

    const quests = [
      {
        id: "quest-daily",
        title: "Daily Commute Rush Quest",
        bonus: "₹350",
        target: "Complete 10 rides today",
        progress: `${todayCount}/10 Completed`,
        percent: Math.min(100, Math.round((todayCount / 10) * 100)),
        timeRemaining: "Ends at 11:00 PM tonight",
        active: todayCount < 10,
        completed: todayCount >= 10,
        canClaim: todayCount >= 10,
      },
      {
        id: "quest-peak",
        title: "Peak Hour Surge Hunter",
        bonus: "₹200",
        target: "Complete 4 trips today",
        progress: `${Math.min(4, todayCount)}/4 Completed ${todayCount >= 4 ? "🎉" : ""}`,
        percent: Math.min(100, Math.round((todayCount / 4) * 100)),
        timeRemaining: todayCount >= 4 ? "Unlocked and credited to wallet" : "Active during shift hours",
        active: todayCount < 4,
        completed: todayCount >= 4,
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

    const todayBonusEarned = todayCount >= 4 ? 200 : 0;
    const weekBonusEarned = (weekCount >= 10 ? 350 : 0) + (weekCount >= 35 ? 1500 : 0);
    const upcomingPotential = (todayCount < 10 ? 350 : 0) + (weekCount < 35 ? 1500 : 0) + (todayCount < 4 ? 200 : 0);

    return NextResponse.json({
      status: "success",
      data: {
        todayBonusEarned,
        weekBonusEarned,
        upcomingPotential,
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
