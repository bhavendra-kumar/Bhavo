import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import Commute from "@/models/Commute";
import Place from "@/models/Place";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);

    await dbConnect();

    const activeRide = await Ride.findOne({
      rider: user._id,
      status: { $in: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    }).sort({ createdAt: -1 });

    const upcomingRides = await Ride.find({
      rider: user._id,
      status: { $nin: ["CANCELLED", "COMPLETED"] },
      scheduledFor: { $gt: new Date() },
    })
      .sort({ scheduledFor: 1 })
      .limit(5);

    const commutes = await Commute.find({ rider: user._id }).sort({ createdAt: 1 });

    const recentRides = await Ride.find({
      rider: user._id,
      status: { $in: ["COMPLETED", "CANCELLED"] },
    })
      .sort({ createdAt: -1 })
      .limit(4);

    let savedPlaces = await Place.find({ rider: user._id })
      .sort({ isFavorite: -1, createdAt: -1 })
      .limit(4);

    if (!savedPlaces) {
      savedPlaces = [];
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = await Ride.countDocuments({
      rider: user._id,
      status: "COMPLETED",
      createdAt: { $gte: startOfMonth },
    });

    const monthExpenses = await Ride.aggregate([
      {
        $match: {
          rider: user._id,
          status: "COMPLETED",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$fare" },
        },
      },
    ]);
    const monthExpenseTotal = monthExpenses.length > 0 ? monthExpenses[0].total : 0;

    const timeSaved = completedThisMonth > 0 ? Math.round(completedThisMonth * 14.5) : 0;
    const co2Saved = completedThisMonth > 0 ? Number((completedThisMonth * 2.6).toFixed(1)) : 0;
    const onTimeRate = completedThisMonth > 0 ? 100 : 0;

    return NextResponse.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          rating: user.rating,
          avatar: user.avatar,
        },
        activeRide,
        upcomingRides,
        commutes,
        recentRides,
        savedPlaces,
        stats: {
          ridesThisMonth: completedThisMonth,
          walletBalance: user.walletBalance,
          rating: user.rating,
          timeSavedMinutes: timeSaved,
          onTimeRate,
          co2SavedKg: co2Saved,
          corporatePassRemaining: 0,
          monthExpenseTotal,
        },
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Dashboard API Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
