import crypto from "crypto";
import mongoose from "mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getDispatchMaxAttempts, getDispatchOfferTtlMs } from "@/lib/dispatchConfig";
import {
  IDriverCandidate,
  IRideRequirements,
  IEligibilityContext,
  evaluateDriverEligibility,
} from "@/lib/driverEligibility";

export interface IRankedCandidate {
  driver: IDriverCandidate;
  distanceKm: number;
  isPreferred: boolean;
}

/**
 * Deterministically ranks eligible driver candidates.
 *
 * Tier 1: Preferred Driver Rule
 * If preferredDriverId is present and belongs to the eligible candidate set, that driver is placed first.
 *
 * Tier 2: Multi-factor Deterministic Ordering for Remaining Candidates
 * 1. Proximity Bucket (500-meter bands): Math.floor(distanceKm * 2) ASC (nearer bucket wins)
 * 2. Driver Rating: (rating ?? 5.0) DESC (higher rating wins within same 500m bucket)
 * 3. Deterministic Tie-Breaker: driver._id.toString() ASC (lexicographical stability)
 */
export function rankEligibleCandidates(
  candidates: { driver: IDriverCandidate; distanceKm: number }[],
  preferredDriverId?: mongoose.Types.ObjectId | string | null
): IRankedCandidate[] {
  if (!candidates || candidates.length === 0) return [];

  const prefIdStr = preferredDriverId ? preferredDriverId.toString() : null;

  // Separate preferred driver if eligible
  let preferredCandidate: { driver: IDriverCandidate; distanceKm: number } | null = null;
  const nonPreferredCandidates: { driver: IDriverCandidate; distanceKm: number }[] = [];

  for (const item of candidates) {
    const dId = item.driver._id ? item.driver._id.toString() : "";
    if (prefIdStr && dId === prefIdStr && !preferredCandidate) {
      preferredCandidate = item;
    } else {
      nonPreferredCandidates.push(item);
    }
  }

  // Sort non-preferred candidates deterministically
  nonPreferredCandidates.sort((a, b) => {
    // 1. Proximity bucket (500m bands)
    const bucketA = Math.floor(a.distanceKm * 2);
    const bucketB = Math.floor(b.distanceKm * 2);
    if (bucketA !== bucketB) {
      return bucketA - bucketB;
    }

    // 2. Driver rating
    const ratingA = typeof a.driver.rating === "number" ? a.driver.rating : 5.0;
    const ratingB = typeof b.driver.rating === "number" ? b.driver.rating : 5.0;
    if (ratingA !== ratingB) {
      return ratingB - ratingA; // higher rating first
    }

    // 3. Deterministic tie-breaker on driver _id
    const idA = a.driver._id ? a.driver._id.toString() : "";
    const idB = b.driver._id ? b.driver._id.toString() : "";
    return idA.localeCompare(idB);
  });

  const result: IRankedCandidate[] = [];

  if (preferredCandidate) {
    result.push({
      driver: preferredCandidate.driver,
      distanceKm: preferredCandidate.distanceKm,
      isPreferred: true,
    });
  }

  for (const item of nonPreferredCandidates) {
    result.push({
      driver: item.driver,
      distanceKm: item.distanceKm,
      isPreferred: false,
    });
  }

  return result;
}

/**
 * Discovers and deterministically ranks all eligible driver candidates for an active ride.
 * Reads online drivers from MongoDB, excludes drivers currently assigned to active rides,
 * applies pure eligibility gates, and ranks the candidates.
 */
export async function findAndRankCandidatesForRide(
  ride: IRideRequirements & { preferredDriver?: mongoose.Types.ObjectId | string | null },
  context: IEligibilityContext = {}
): Promise<IRankedCandidate[]> {
  // 1. Query online active drivers who have verified vehicle documents and no active ride
  const candidateDrivers = await User.find({
    role: "DRIVER",
    status: "ACTIVE",
    isOnline: true,
    dutyState: "ONLINE_SEARCHING",
    $or: [{ activeRideId: null }, { activeRideId: { $exists: false } }],
    "driverVehicle.documentsVerified": true,
  });

  if (!candidateDrivers || candidateDrivers.length === 0) {
    return [];
  }

  // 2. Find drivers currently engaged in an active trip to enforce active-trip exclusivity
  const activeTrips = await Ride.find({
    driver: { $in: candidateDrivers.map((d) => d._id) },
    status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
  }).select("driver");

  const occupiedDriverIdSet = new Set(
    activeTrips
      .filter((t) => t.driver)
      .map((t) => t.driver!.toString())
  );

  // 3. Find drivers with an active, unexpired offer on another ride
  const now = context.atTime || new Date();
  const ridesWithActiveOffers = await Ride.find({
    _id: { $ne: ride._id },
    status: "SEARCHING",
    "currentOffer.driverId": { $in: candidateDrivers.map((d) => d._id) },
    "currentOffer.expiresAt": { $gt: now },
  }).select("currentOffer.driverId");

  const driversWithActiveOffers = new Set(
    ridesWithActiveOffers
      .filter((r) => r.currentOffer && r.currentOffer.driverId)
      .map((r) => r.currentOffer!.driverId.toString())
  );

  // 4. Filter through pure eligibility gates
  const eligibleCandidates: { driver: IDriverCandidate; distanceKm: number }[] = [];

  for (const driverDoc of candidateDrivers) {
    const driverIdStr = driverDoc._id.toString();

    // Exclusivity gate: driver is on active trip or has activeRideId
    if (occupiedDriverIdSet.has(driverIdStr) || driverDoc.activeRideId) {
      continue;
    }

    // Exclusivity gate: driver has active offer on another ride
    if (driversWithActiveOffers.has(driverIdStr)) {
      continue;
    }

    const candidate: IDriverCandidate = driverDoc.toObject
      ? driverDoc.toObject()
      : driverDoc;

    const evalResult = evaluateDriverEligibility(candidate, ride, context);
    if (evalResult.isEligible && typeof evalResult.distanceKm === "number") {
      eligibleCandidates.push({
        driver: candidate,
        distanceKm: evalResult.distanceKm,
      });
    }
  }

  // 5. Rank eligible candidates
  return rankEligibleCandidates(eligibleCandidates, ride.preferredDriver);
}

/**
 * Sweeps expired targeted offers across all active SEARCHING rides.
 * For any expired offer, conditionally transitions the ride by moving
 * currentOffer.driverId into rejectedDrivers, clearing currentOffer,
 * and checking if dispatch attempts have reached maximum attempts.
 */
export async function sweepExpiredOffers(maxBatch: number = 25): Promise<{ sweptCount: number; exhaustedCount: number }> {
  const now = new Date();
  const expiredRides = await Ride.find({
    status: "SEARCHING",
    "currentOffer.expiresAt": { $lt: now },
  }).limit(maxBatch);

  let sweptCount = 0;
  let exhaustedCount = 0;

  for (const ride of expiredRides) {
    if (!ride.currentOffer || !ride.currentOffer.offerId) continue;

    const expiredDriverId = ride.currentOffer.driverId;
    const expiredOfferId = ride.currentOffer.offerId;
    const currentAttempts = ride.dispatchAttempts || 0;
    const maxAttempts = getDispatchMaxAttempts();
    const isExhausted = currentAttempts >= maxAttempts;
    const nextStatus = isExhausted ? "EXHAUSTED" : "DISPATCHING";

    const updated = await Ride.findOneAndUpdate(
      {
        _id: ride._id,
        status: "SEARCHING",
        "currentOffer.offerId": expiredOfferId,
      },
      {
        $addToSet: { rejectedDrivers: expiredDriverId },
        $set: {
          currentOffer: null,
          dispatchStatus: nextStatus,
        },
      },
      { new: true }
    );

    if (updated) {
      sweptCount++;
      if (isExhausted) {
        exhaustedCount++;
      }
    }
  }

  return { sweptCount, exhaustedCount };
}

/**
 * Atomically assigns a new targeted offer to the specified candidate driver for a SEARCHING ride.
 * Guaranteed to assign to at most one driver concurrently via atomic CAS.
 */
export async function assignTargetedOffer(
  rideId: mongoose.Types.ObjectId | string,
  targetDriverId: mongoose.Types.ObjectId | string,
  now: Date = new Date()
) {
  const offerId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + getDispatchOfferTtlMs());
  const maxAttempts = getDispatchMaxAttempts();

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: "SEARCHING",
      currentOffer: null,
      dispatchStatus: { $ne: "EXHAUSTED" },
      dispatchAttempts: { $lt: maxAttempts },
    },
    {
      $set: {
        currentOffer: {
          offerId,
          driverId: targetDriverId,
          offeredAt: now,
          expiresAt,
        },
        dispatchStatus: "OFFERED",
      },
      $inc: { dispatchAttempts: 1 },
    },
    { new: true }
  ).populate("rider", "name phone rating avatar");

  return updatedRide;
}

