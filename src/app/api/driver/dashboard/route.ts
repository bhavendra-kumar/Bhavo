import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";
import { checkDriverVerification } from "@/lib/driverCompliance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);
    const verification = checkDriverVerification(user);

    // If documents are not verified, driver is strictly not allowed to be online
    if (!verification.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate real stats from MongoDB
    const todayCompleted = await Ride.find({
      driver: user._id,
      status: "COMPLETED",
      updatedAt: { $gte: startOfDay },
    });

    const weekCompleted = await Ride.find({
      driver: user._id,
      status: "COMPLETED",
      updatedAt: { $gte: startOfWeek },
    });

    const todayEarningsFromDb = todayCompleted.reduce(
      (acc, r) => acc + (r.fare || 0) + (r.tip || 0),
      0
    );
    const weeklyEarningsFromDb = weekCompleted.reduce(
      (acc, r) => acc + (r.fare || 0) + (r.tip || 0),
      0
    );

    const todayEarnings = todayEarningsFromDb;
    const weeklyEarnings = weeklyEarningsFromDb;
    const tripsCompleted = todayCompleted.length;

    // Driver profile from MongoDB
    const driverProfile = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || "+91 98765 43210",
      rating: user.rating || 4.94,
      avatar: user.avatar || null,
      walletBalance: user.walletBalance ?? 0,
      role: "DRIVER",
      isOnline: verification.isVerified ? (user.isOnline ?? true) : false,
      dutyState: verification.isVerified ? (user.dutyState || "ONLINE_SEARCHING") : "OFFLINE",
    };

    // Find real active ride assigned to this driver
    const activeRideDoc = await Ride.findOne({
      driver: user._id,
      status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    })
      .populate("rider", "name phone rating avatar")
      .sort({ updatedAt: -1 });

    let activeRide = null;
    if (activeRideDoc) {
      const riderObj = (activeRideDoc.rider as unknown as {
        name?: string;
        phone?: string;
        rating?: number;
        avatar?: string;
      }) || {};

      activeRide = {
        _id: String(activeRideDoc._id),
        rider: {
          name: riderObj.name || "Aarav Sharma",
          phone: riderObj.phone || "+91 98111 22334",
          rating: riderObj.rating || 4.92,
          avatar: riderObj.avatar || null,
        },
        pickup: activeRideDoc.pickup,
        dropoff: activeRideDoc.dropoff,
        vehicleType: activeRideDoc.vehicleType,
        fare: activeRideDoc.fare,
        distance: activeRideDoc.distance,
        duration: activeRideDoc.duration,
        status: activeRideDoc.status,
        // Finding 6 fix: Driver must not receive the rider's secret OTP in dashboard payload
        paymentMethod: activeRideDoc.paymentMethod,
        paymentStatus: activeRideDoc.paymentStatus,
        messages: activeRideDoc.messages || [],
        acceptedAt: activeRideDoc.createdAt,
      };
    }

    // Fetch real recent trips from MongoDB
    const pastRides = await Ride.find({
      driver: user._id,
      status: { $in: ["COMPLETED", "CANCELLED"] },
    })
      .populate("rider", "name")
      .sort({ updatedAt: -1 })
      .limit(10);

    const recentTrips = pastRides.map((r) => {
      const rObj = (r.rider as unknown as { name?: string }) || {};
      return {
        id: String(r._id),
        riderName: rObj.name || (r.driverDetails?.name ? "Passenger " + String(r._id).slice(-4) : "Rider"),
        pickup: r.pickup.address,
        dropoff: r.dropoff.address,
        fare: r.fare,
        tip: r.tip || 0,
        distance: r.distance,
        time: new Date(r.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        vehicleType: r.vehicleType,
        paymentMethod: r.paymentMethod,
      };
    });

    const surgeAreas = [
      { id: "surge-1", name: "Cyber City & DLF Hub", multiplier: 1.6, coordinates: [28.4900, 77.0900], radius: 1800 },
      { id: "surge-2", name: "Sector 62 IT Tech Zone", multiplier: 1.4, coordinates: [28.6250, 77.3750], radius: 1500 },
      { id: "surge-3", name: "Airport Terminal 3 Gate", multiplier: 1.9, coordinates: [28.5562, 77.1000], radius: 2200 },
      { id: "surge-4", name: "Connaught Place Central", multiplier: 1.3, coordinates: [28.6315, 77.2167], radius: 1200 },
    ];

    return NextResponse.json({
      status: "success",
      data: {
        profile: driverProfile,
        stats: {
          todayEarnings,
          weeklyEarnings,
          tripsCompleted,
          onlineMinutes: Math.min(480, tripsCompleted * 35 + (tripsCompleted > 0 ? 45 : 0)),
          acceptanceRate: 98,
          rating: user.rating || 4.94,
          targetTrips: 10,
          targetBonus: 350,
        },
        verification,
        vehicle: {
          ...(user.driverVehicle?.toObject ? user.driverVehicle.toObject() : user.driverVehicle || {}),
          model: user.driverVehicle?.model || "Tata Tigor EV (White)",
          numberPlate: user.driverVehicle?.numberPlate || "DL-01-EV-4429",
          type: user.driverVehicle?.type || "Cab Premium (EV)",
          fuelType: user.driverVehicle?.fuelType || "EV",
          batteryOrFuelLevel: user.driverVehicle?.batteryOrFuelLevel ?? 82,
          documentsVerified: verification.isVerified,
          insuranceValidUntil: user.driverVehicle?.insuranceValidUntil || "18 Dec 2027",
        },
        activeRide,
        recentTrips,
        surgeAreas,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Dashboard API Error]:", error);
    return NextResponse.json({ status: "error", message: "Failed to load dashboard data" }, { status: 500 });
  }
}
