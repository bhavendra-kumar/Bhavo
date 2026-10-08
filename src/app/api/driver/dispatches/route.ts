import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import User from "@/models/User";
import { getDriverUser } from "@/lib/driverAuth";

export const dynamic = "force-dynamic";

// GET /api/driver/dispatches - Poll for pending ride requests
export async function GET() {
  try {
    await dbConnect();
    const user = await getDriverUser();

    // If driver is offline or already on a trip, no new dispatches
    if (!user.isOnline) {
      return NextResponse.json({ status: "success", data: null });
    }

    const activeRide = await Ride.findOne({
      driver: user._id,
      status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    });
    if (activeRide) {
      return NextResponse.json({ status: "success", data: null });
    }

    // Find real rides in SEARCHING state
    const searchingRide = await Ride.findOne({
      status: "SEARCHING",
    })
      .populate("rider", "name phone rating avatar")
      .sort({ createdAt: -1 });

    if (!searchingRide) {
      return NextResponse.json({ status: "success", data: null });
    }

    const riderObj = (searchingRide.rider as unknown as {
      name?: string;
      phone?: string;
      rating?: number;
      avatar?: string;
    }) || {};

    const dispatch = {
      _id: String(searchingRide._id),
      riderName: riderObj.name || "Aarav Sharma",
      riderPhone: riderObj.phone || "+91 98111 22334",
      riderRating: riderObj.rating || 4.92,
      riderAvatar: riderObj.avatar || null,
      pickup: {
        address: searchingRide.pickup.address,
        coordinates: searchingRide.pickup.coordinates,
        distanceText: "1.2 km away",
        etaMinutes: 3,
      },
      dropoff: {
        address: searchingRide.dropoff.address,
        coordinates: searchingRide.dropoff.coordinates,
        distanceText: searchingRide.distance || "7.8 km",
        estDurationMinutes: parseInt(searchingRide.duration) || 20,
      },
      fare: searchingRide.fare,
      surgeMultiplier: 1.3,
      vehicleType: searchingRide.vehicleType || "Cab Premium",
      paymentMethod: searchingRide.paymentMethod || "UPI",
      expiresAt: Date.now() + 16000,
    };

    return NextResponse.json({ status: "success", data: dispatch });
  } catch (error) {
    console.error("[Dispatches GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/driver/dispatches - Create a real new test ride in MongoDB for simulation
export async function POST() {
  try {
    await dbConnect();
    const user = await getDriverUser();

    // Ensure or find a rider user to attach as passenger
    let rider = await User.findOne({ role: "RIDER" });
    if (!rider) {
      rider = await User.findOne({ email: { $ne: user.email } });
    }
    if (!rider) {
      rider = await User.create({
        name: "Ananya Iyer",
        email: "ananya.rider@bhavo.in",
        password: "rider_secure_hash_placeholder",
        role: "RIDER",
        phone: "+91 98201 55670",
        rating: 4.96,
        walletBalance: 1200,
      });
    }

    const samplePickups = [
      { address: "Max Hospital Gate 1, Sector 19, Noida", coordinates: [28.5823, 77.3274] as [number, number] },
      { address: "Sector 18 Atta Market, Metro Gate 2, Noida", coordinates: [28.5708, 77.3261] as [number, number] },
      { address: "Indirapuram Habitat Center, Ghaziabad", coordinates: [28.6415, 77.3712] as [number, number] },
      { address: "Botanical Garden Interchange, Noida", coordinates: [28.5645, 77.3344] as [number, number] },
    ];

    const sampleDropoffs = [
      { address: "DLF Cyber City, Building 10, Gurugram", coordinates: [28.4905, 77.0912] as [number, number], distance: "18.4 km", duration: "34 mins", fare: 480 },
      { address: "Bhavo Tech Park, Tower B, Sector 62, Noida", coordinates: [28.6250, 77.3750] as [number, number], distance: "6.2 km", duration: "16 mins", fare: 240 },
      { address: "Indira Gandhi International Airport, Terminal 3", coordinates: [28.5562, 77.1000] as [number, number], distance: "24.1 km", duration: "48 mins", fare: 650 },
      { address: "Connaught Place, Inner Circle, New Delhi", coordinates: [28.6315, 77.2167] as [number, number], distance: "14.5 km", duration: "30 mins", fare: 390 },
    ];

    const pickupIndex = Math.floor(Math.random() * samplePickups.length);
    const dropoffIndex = Math.floor(Math.random() * sampleDropoffs.length);
    const pickup = samplePickups[pickupIndex];
    const dropoff = sampleDropoffs[dropoffIndex];

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create real ride document in MongoDB
    const createdRide = await Ride.create({
      rider: rider._id,
      pickup: {
        address: pickup.address,
        coordinates: pickup.coordinates,
        landmark: "Main Entrance",
      },
      dropoff: {
        address: dropoff.address,
        coordinates: dropoff.coordinates,
        landmark: "Gate 1",
      },
      vehicleType: "Cab Premium",
      fare: dropoff.fare,
      distance: dropoff.distance,
      duration: dropoff.duration,
      status: "SEARCHING",
      otp,
      paymentMethod: "UPI",
      paymentStatus: "PENDING",
      messages: [
        {
          sender: "rider",
          text: "Hi! I am waiting near the main pickup point.",
          timestamp: new Date(),
        },
      ],
    });

    const dispatch = {
      _id: String(createdRide._id),
      riderName: rider.name,
      riderPhone: rider.phone,
      riderRating: rider.rating || 4.9,
      riderAvatar: rider.avatar || null,
      pickup: {
        address: createdRide.pickup.address,
        coordinates: createdRide.pickup.coordinates,
        distanceText: "1.2 km away",
        etaMinutes: 3,
      },
      dropoff: {
        address: createdRide.dropoff.address,
        coordinates: createdRide.dropoff.coordinates,
        distanceText: createdRide.distance,
        estDurationMinutes: parseInt(createdRide.duration) || 25,
      },
      fare: createdRide.fare,
      surgeMultiplier: 1.4,
      vehicleType: createdRide.vehicleType,
      paymentMethod: createdRide.paymentMethod,
      expiresAt: Date.now() + 16000,
    };

    return NextResponse.json({ status: "success", data: dispatch }, { status: 201 });
  } catch (error) {
    console.error("[Dispatches POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
