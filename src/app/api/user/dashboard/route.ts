import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import Commute from "@/models/Commute";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email }).select("-password");
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    // 1. Fetch active ride (searching, accepted, arrived, in_progress)
    const activeRide = await Ride.findOne({
      rider: user._id,
      status: { $in: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    }).sort({ createdAt: -1 });

    // 2. Fetch upcoming scheduled rides (if any scheduled for future)
    const upcomingRides = await Ride.find({
      rider: user._id,
      status: { $nin: ["CANCELLED", "COMPLETED"] },
      scheduledFor: { $gt: new Date() },
    })
      .sort({ scheduledFor: 1 })
      .limit(5);

    // 3. Fetch or seed smart commute schedules
    let commutes = await Commute.find({ rider: user._id }).sort({ createdAt: 1 });
    if (commutes.length === 0) {
      // Seed default smart commutes for initial experience
      commutes = await Commute.create([
        {
          rider: user._id,
          title: "Morning Commute",
          time: "8:45 AM",
          days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          pickup: { address: "123 Tech Park Avenue, Block B", coordinates: [28.6139, 77.2090] },
          dropoff: { address: "Bhavo Headquarters, Sector 44", coordinates: [28.5355, 77.3910] },
          vehicleType: "Cab Premium",
          isActive: true,
        },
        {
          rider: user._id,
          title: "Evening Return",
          time: "6:30 PM",
          days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          pickup: { address: "Bhavo Headquarters, Sector 44", coordinates: [28.5355, 77.3910] },
          dropoff: { address: "123 Tech Park Avenue, Block B", coordinates: [28.6139, 77.2090] },
          vehicleType: "Cab Economy",
          isActive: true,
        },
      ]);
    }

    // 4. Quick stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = await Ride.countDocuments({
      rider: user._id,
      status: "COMPLETED",
      createdAt: { $gte: startOfMonth },
    });

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
        stats: {
          ridesThisMonth: completedThisMonth,
          walletBalance: user.walletBalance,
          rating: user.rating,
          timeSavedMinutes: 12,
        },
      },
    });
  } catch (error) {
    console.error("[Dashboard API Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
