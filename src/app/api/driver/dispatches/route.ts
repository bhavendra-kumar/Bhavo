import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import User from "@/models/User";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";
import { checkDriverVerification } from "@/lib/driverCompliance";
import { getDispatchLeadTimeMs } from "@/lib/rideStateMachine";
import { getDispatchOfferTtlMs } from "@/lib/dispatchConfig";
import {
  calculateHaversineDistanceKm,
  isLocationValidAndFresh,
} from "@/lib/driverEligibility";
import {
  findAndRankCandidatesForRide,
  sweepExpiredOffers,
  assignTargetedOffer,
} from "@/lib/dispatchRanking";

export const dynamic = "force-dynamic";

// GET /api/driver/dispatches - Poll for targeted ride requests
export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    // 1. Check document verification & online status
    const verification = checkDriverVerification(user);
    if (!verification.isVerified || !user.isOnline) {
      return NextResponse.json({
        status: "success",
        data: null,
        verification,
      });
    }

    // 2. Active ride exclusivity check
    const activeRide = await Ride.findOne({
      driver: user._id,
      status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    });
    if (activeRide || user.dutyState === "ON_TRIP") {
      return NextResponse.json({ status: "success", data: null });
    }

    // 3. Driver location freshness validation
    const isLocationFresh = isLocationValidAndFresh(
      user.driverCoordinates,
      user.driverCoordinatesUpdatedAt
    );
    if (!isLocationFresh) {
      return NextResponse.json({
        status: "success",
        data: null,
        locationRequired: true,
      });
    }

    // 4. Request-driven sweep of any expired offers
    await sweepExpiredOffers(25);

    const now = new Date();

    // 5. Check if THIS driver already has an active, unexpired targeted offer
    let targetedRide = await Ride.findOne({
      status: "SEARCHING",
      "currentOffer.driverId": user._id,
      "currentOffer.expiresAt": { $gt: now },
    }).populate("rider", "name phone rating avatar");

    // 6. If no active offer exists, discover candidate SEARCHING rides needing offers
    if (!targetedRide) {
      const maxDispatchScheduledFor = new Date(Date.now() + getDispatchLeadTimeMs());
      const searchingRides = await Ride.find({
        status: "SEARCHING",
        currentOffer: null,
        dispatchStatus: { $ne: "EXHAUSTED" },
        rejectedDrivers: { $ne: user._id },
        $or: [
          { scheduledFor: null },
          { scheduledFor: { $exists: false } },
          { scheduledFor: { $lte: maxDispatchScheduledFor } },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(10);

      for (const ride of searchingRides) {
        const candidates = await findAndRankCandidatesForRide(ride);
        if (candidates.length === 0) {
          if (ride.rejectedDrivers && ride.rejectedDrivers.length > 0) {
            await Ride.updateOne(
              { _id: ride._id, status: "SEARCHING", currentOffer: null },
              { $set: { dispatchStatus: "EXHAUSTED" } }
            );
          }
          continue;
        }

        const topCandidate = candidates[0];
        const updated = await assignTargetedOffer(ride._id, topCandidate.driver._id, now);
        if (!updated) {
          continue;
        }

        // If the top candidate is the polling driver
        if (topCandidate.driver._id.toString() === user._id.toString()) {
          targetedRide = updated;
          break;
        }
        // If not the polling driver, offer is targeted to that driver; polling driver continues
      }
    }

    if (!targetedRide || !targetedRide.currentOffer) {
      return NextResponse.json({ status: "success", data: null });
    }

    // 7. Format targeted dispatch with truthful Haversine proximity & persistent expiry
    const riderObj = (targetedRide.rider as unknown as {
      name?: string;
      phone?: string;
      rating?: number;
      avatar?: string;
    }) || {};

    const distKm = calculateHaversineDistanceKm(
      targetedRide.pickup.coordinates,
      user.driverCoordinates
    );

    const dispatch = {
      _id: String(targetedRide._id),
      offerId: targetedRide.currentOffer.offerId,
      riderName: riderObj.name || "Aarav Sharma",
      riderPhone: riderObj.phone || "+91 98111 22334",
      riderRating: riderObj.rating || 4.92,
      riderAvatar: riderObj.avatar || null,
      pickup: {
        address: targetedRide.pickup.address,
        coordinates: targetedRide.pickup.coordinates,
        distanceText: `${distKm.toFixed(1)} km away`,
        etaMinutes: Math.max(1, Math.round(distKm * 2.5)),
      },
      dropoff: {
        address: targetedRide.dropoff.address,
        coordinates: targetedRide.dropoff.coordinates,
        distanceText: targetedRide.distance || "7.8 km",
        estDurationMinutes: parseInt(targetedRide.duration) || 20,
      },
      fare: targetedRide.fare,
      surgeMultiplier: 1.3,
      vehicleType: targetedRide.vehicleType || "Cab Premium",
      paymentMethod: targetedRide.paymentMethod || "UPI",
      expiresAt: new Date(targetedRide.currentOffer.expiresAt).getTime(),
    };

    return NextResponse.json({ status: "success", data: dispatch });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Dispatches GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/driver/dispatches - Create a real new test ride in MongoDB for simulation (Dev/Test only)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    // Guard: Dispatch simulation ride generation is strictly disabled in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          status: "error",
          code: "SIMULATION_DISABLED",
          message: "Simulation dispatch endpoint is disabled in production environment.",
        },
        { status: 403 }
      );
    }

    // STRICT: Unverified drivers cannot receive dispatches
    const verification = checkDriverVerification(user);
    if (!verification.isVerified) {
      return NextResponse.json(
        {
          status: "error",
          code: "DOCUMENTS_UNVERIFIED",
          message:
            verification.reason ||
            "Cannot dispatch ride: All driver and vehicle documents must be verified before receiving ride requests.",
          verification,
        },
        { status: 403 }
      );
    }

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
    const now = new Date();
    const offerId = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + getDispatchOfferTtlMs());

    // Create real ride document in MongoDB with targeted offer
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
      dispatchStatus: "OFFERED",
      dispatchAttempts: 1,
      currentOffer: {
        offerId,
        driverId: user._id,
        offeredAt: now,
        expiresAt,
      },
      rejectedDrivers: [],
      otp,
      paymentMethod: "UPI",
      paymentStatus: "PENDING",
      messages: [
        {
          sender: "rider",
          text: "Hi! I am waiting near the main pickup point.",
          timestamp: now,
        },
      ],
    });

    const distKm = user.driverCoordinates && user.driverCoordinates.length === 2
      ? calculateHaversineDistanceKm(createdRide.pickup.coordinates, user.driverCoordinates)
      : 1.2;

    const dispatch = {
      _id: String(createdRide._id),
      offerId,
      riderName: rider.name,
      riderPhone: rider.phone,
      riderRating: rider.rating || 4.9,
      riderAvatar: rider.avatar || null,
      pickup: {
        address: createdRide.pickup.address,
        coordinates: createdRide.pickup.coordinates,
        distanceText: `${distKm.toFixed(1)} km away`,
        etaMinutes: Math.max(1, Math.round(distKm * 2.5)),
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
      expiresAt: expiresAt.getTime(),
    };

    return NextResponse.json({ status: "success", data: dispatch }, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Dispatches POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
