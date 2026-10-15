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

export function rankEligibleCandidates(
  candidates: { driver: IDriverCandidate; distanceKm: number }[],
  preferredDriverId?: mongoose.Types.ObjectId | string | null
): IRankedCandidate[] {
  if (!candidates || candidates.length === 0) return [];

  const prefIdStr = preferredDriverId ? preferredDriverId.toString() : null;

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

  nonPreferredCandidates.sort((a, b) => {
    const bucketA = Math.floor(a.distanceKm * 2);
    const bucketB = Math.floor(b.distanceKm * 2);
    if (bucketA !== bucketB) {
      return bucketA - bucketB;
    }

    const ratingA = typeof a.driver.rating === "number" ? a.driver.rating : 5.0;
    const ratingB = typeof b.driver.rating === "number" ? b.driver.rating : 5.0;
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }

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

export async function findAndRankCandidatesForRide(
  ride: IRideRequirements & { preferredDriver?: mongoose.Types.ObjectId | string | null },
  context: IEligibilityContext = {}
): Promise<IRankedCandidate[]> {
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

  const activeTrips = await Ride.find({
    driver: { $in: candidateDrivers.map((d) => d._id) },
    status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
  }).select("driver");

  const occupiedDriverIdSet = new Set(
    activeTrips
      .filter((t) => t.driver)
      .map((t) => t.driver!.toString())
  );

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

  const eligibleCandidates: { driver: IDriverCandidate; distanceKm: number }[] = [];

  for (const driverDoc of candidateDrivers) {
    const driverIdStr = driverDoc._id.toString();

    if (occupiedDriverIdSet.has(driverIdStr) || driverDoc.activeRideId) {
      continue;
    }

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

  return rankEligibleCandidates(eligibleCandidates, ride.preferredDriver);
}

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

