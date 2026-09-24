import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();

    let user = null;
    if (session?.email) {
      user = await User.findOne({ email: session.email }).select("-password");
    }

    // Default driver fallback profile if testing without driver account
    const driverProfile = {
      id: user?._id || "driver-101",
      name: user?.name || "Rajesh Kumar",
      email: user?.email || "rajesh.driver@bhavo.in",
      phone: user?.phone || "+91 98765 43210",
      rating: user?.rating || 4.94,
      avatar: user?.avatar || null,
      walletBalance: user?.walletBalance || 4250,
      role: "DRIVER",
    };

    // Find any real active ride assigned to this driver or in progress
    let activeRide = null;
    if (user) {
      activeRide = await Ride.findOne({
        driver: user._id,
        status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
      }).sort({ updatedAt: -1 });
    }

    // Fetch recent completed rides
    let recentTrips: Array<{
      id: unknown;
      riderName: string;
      pickup: string;
      dropoff: string;
      fare: number;
      tip: number;
      distance: string;
      time: string;
      vehicleType: string;
      paymentMethod: string;
    }> = [];
    if (user) {
      const pastRides = await Ride.find({
        driver: user._id,
        status: { $in: ["COMPLETED", "CANCELLED"] },
      })
        .sort({ updatedAt: -1 })
        .limit(5);

      if (pastRides && pastRides.length > 0) {
        recentTrips = pastRides.map((r) => ({
          id: r._id,
          riderName: "Rider " + String(r.rider).slice(-4),
          pickup: r.pickup.address,
          dropoff: r.dropoff.address,
          fare: r.fare,
          tip: 20,
          distance: r.distance,
          time: new Date(r.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          vehicleType: r.vehicleType,
          paymentMethod: r.paymentMethod,
        }));
      }
    }

    return NextResponse.json({
      status: "success",
      data: {
        profile: driverProfile,
        stats: {
          todayEarnings: 1865,
          weeklyEarnings: 14280,
          tripsCompleted: 7,
          onlineMinutes: 325,
          acceptanceRate: 96,
          rating: 4.94,
          targetTrips: 10,
          targetBonus: 350,
        },
        vehicle: {
          model: "Tata Tigor EV (White)",
          numberPlate: "DL-01-EV-4429",
          type: "Cab Premium (EV)",
          fuelType: "EV",
          batteryOrFuelLevel: 82,
          documentsVerified: true,
          insuranceValidUntil: "18 Dec 2027",
        },
        activeRide: activeRide
          ? {
              _id: activeRide._id,
              rider: {
                name: "Aarav Sharma",
                phone: "+91 98111 22334",
                rating: 4.92,
              },
              pickup: activeRide.pickup,
              dropoff: activeRide.dropoff,
              vehicleType: activeRide.vehicleType,
              fare: activeRide.fare,
              distance: activeRide.distance,
              duration: activeRide.duration,
              status: activeRide.status,
              otp: activeRide.otp || "4826",
              paymentMethod: activeRide.paymentMethod,
              paymentStatus: activeRide.paymentStatus,
              messages: activeRide.messages || [],
            }
          : null,
        recentTrips: recentTrips.length > 0 ? recentTrips : undefined,
      },
    });
  } catch (error) {
    console.error("[Driver Dashboard API Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
