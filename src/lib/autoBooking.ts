
import crypto from "crypto";
import dbConnect from "@/lib/mongoose";
import Commute, { ICommute } from "@/models/Commute";
import Ride from "@/models/Ride";
import User from "@/models/User";
import AutoBookingOccurrence, {
  AutoBookingOccurrenceStatus,
} from "@/models/AutoBookingOccurrence";
import {
  DEFAULT_AUTO_BOOKING_LEASE_DURATION_MS,
  DEFAULT_AUTO_BOOKING_MAX_ATTEMPTS,
  getAutoBookingLookaheadMinutes,
  getAutoBookingBatchSize,
} from "@/lib/autoBookingConfig";
import {
  calculateUpcomingOccurrences,
} from "@/lib/recurrenceEngine";
import { calculateAuthoritativeFare, PricingError } from "@/lib/pricingEngine";

export interface IMaterializeResult {
  status:
    | "MATERIALIZED"
    | "ALREADY_MATERIALIZED"
    | "RECONCILED_EXISTING"
    | "CURRENTLY_LEASED"
    | "SKIPPED_PAST"
    | "SKIPPED_PAUSED"
    | "FAILED_RETRYABLE"
    | "FAILED_PERMANENT"
    | "MAX_ATTEMPTS_EXCEEDED";
  occurrenceKey: string;
  rideId?: string;
  error?: string;
}

export interface IBatchAutoBookingSummary {
  scannedCommutes: number;
  materializedRides: number;
  alreadyMaterialized: number;
  reconciledExisting: number;
  skippedPast: number;
  skippedPaused: number;
  retryableFailures: number;
  permanentFailures: number;
  currentlyLeased: number;
  durationMs: number;
  executedAt: string;
}

export async function materializeOccurrence(
  occurrenceKey: string,
  options?: {
    forceAtTime?: Date;
    commute?: ICommute | null;
  }
): Promise<IMaterializeResult> {
  await dbConnect();
  const atTime = options?.forceAtTime || new Date();
  const leaseDurationMs = DEFAULT_AUTO_BOOKING_LEASE_DURATION_MS;
  const leaseId = crypto.randomUUID();
  const leaseExpiresAt = new Date(atTime.getTime() + leaseDurationMs);

  const existingRecord = await AutoBookingOccurrence.findOne({ occurrenceKey });
  if (!existingRecord) {
    return {
      status: "FAILED_PERMANENT",
      occurrenceKey,
      error: "Occurrence record not found for materialization",
    };
  }

  if (existingRecord.status === "MATERIALIZED" && existingRecord.rideId) {
    return {
      status: "ALREADY_MATERIALIZED",
      occurrenceKey,
      rideId: existingRecord.rideId.toString(),
    };
  }

  if (existingRecord.status === "FAILED_PERMANENT" || existingRecord.status === "SKIPPED_PAST") {
    return {
      status: existingRecord.status,
      occurrenceKey,
      error: existingRecord.lastError || "Occurrence permanently in terminal state",
    };
  }

  const claimed = await AutoBookingOccurrence.findOneAndUpdate(
    {
      occurrenceKey,
      $or: [
        {
          status: { $in: ["PENDING", "FAILED_RETRYABLE"] },
          attemptCount: { $lt: existingRecord.maxAttempts },
        },
        {
          status: "CLAIMED",
          leaseExpiresAt: { $lt: atTime },
          attemptCount: { $lt: existingRecord.maxAttempts },
        },
      ],
    },
    {
      $set: {
        status: "CLAIMED",
        leaseId,
        leaseExpiresAt,
        lastAttemptAt: atTime,
      },
      $inc: { attemptCount: 1 },
    },
    { new: true }
  );

  if (!claimed) {
    const current = await AutoBookingOccurrence.findOne({ occurrenceKey });
    if (current?.status === "CLAIMED" && current.leaseExpiresAt && current.leaseExpiresAt > atTime) {
      return { status: "CURRENTLY_LEASED", occurrenceKey };
    }
    if (current?.status === "MATERIALIZED" && current.rideId) {
      return { status: "ALREADY_MATERIALIZED", occurrenceKey, rideId: current.rideId.toString() };
    }
    return { status: "MAX_ATTEMPTS_EXCEEDED", occurrenceKey, error: "Maximum attempts reached without success" };
  }

  const existingRide = await Ride.findOne({ autoBookingOccurrenceKey: occurrenceKey });
  if (existingRide) {
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: "MATERIALIZED",
          rideId: existingRide._id,
          leaseId: null,
          leaseExpiresAt: null,
          lastError: null,
        },
      }
    );
    await Commute.updateOne(
      { _id: claimed.commuteId },
      {
        $set: {
          lastGeneratedRideId: existingRide._id,
          lastMaterializedAt: atTime,
        },
      }
    );
    return {
      status: "RECONCILED_EXISTING",
      occurrenceKey,
      rideId: existingRide._id.toString(),
    };
  }

  const commute = options?.commute || (await Commute.findById(claimed.commuteId));
  if (!commute || commute.isActive === false) {
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: "SKIPPED_PAUSED",
          lastError: !commute ? "Commute schedule deleted" : "Commute schedule paused",
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return { status: "SKIPPED_PAUSED", occurrenceKey };
  }

  if (!commute.pickup?.address || !commute.dropoff?.address) {
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: "FAILED_PERMANENT",
          lastError: "Invalid commute configuration: pickup and dropoff addresses are required",
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return {
      status: "FAILED_PERMANENT",
      occurrenceKey,
      error: "Invalid commute configuration: pickup and dropoff addresses are required",
    };
  }

  const rider = (await User.findById(claimed.rider).lean()) as { _id: unknown; status?: string } | null;
  if (!rider || rider.status === "DISABLED" || rider.status === "SUSPENDED") {
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: "FAILED_PERMANENT",
          lastError: !rider ? "Rider account not found" : "Rider account suspended or disabled",
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return {
      status: "FAILED_PERMANENT",
      occurrenceKey,
      error: "Rider account ineligible",
    };
  }

  if (claimed.scheduledFor.getTime() <= atTime.getTime()) {
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: "SKIPPED_PAST",
          lastError: "Scheduled pickup time already passed before materialization",
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return { status: "SKIPPED_PAST", occurrenceKey };
  }

  const pickupCoords = commute.pickup?.coordinates;
  const dropoffCoords = commute.dropoff?.coordinates;

  if (!pickupCoords || !dropoffCoords || !Array.isArray(pickupCoords) || !Array.isArray(dropoffCoords)) {
    const errorMessage = "Commute is missing valid pickup or dropoff coordinates";
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: "FAILED_PERMANENT",
          lastError: `Pricing error: ${errorMessage}`,
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return {
      status: "FAILED_PERMANENT",
      occurrenceKey,
      error: errorMessage,
    };
  }

  const vehicleType = commute.vehicleType || "Cab Premium";
  const isPetFriendly = Boolean(commute.petFriendly);

  let fareResult;
  try {
    fareResult = calculateAuthoritativeFare({
      pickupCoordinates: pickupCoords as [number, number],
      dropoffCoordinates: dropoffCoords as [number, number],
      vehicleType,
      petFriendly: isPetFriendly,
    });
  } catch (err: unknown) {
    const isPermanent = err instanceof PricingError;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const finalStatus: AutoBookingOccurrenceStatus = isPermanent ? "FAILED_PERMANENT" : "FAILED_RETRYABLE";

    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: finalStatus,
          lastError: `Pricing error: ${errorMessage}`,
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return {
      status: finalStatus,
      occurrenceKey,
      error: errorMessage,
    };
  }

  const otp = crypto.randomInt(1000, 10000).toString();

  let newRide;
  try {
    newRide = await Ride.create({
      rider: claimed.rider,
      pickup: {
        address: commute.pickup.address,
        coordinates: pickupCoords,
        landmark: "",
      },
      dropoff: {
        address: commute.dropoff.address,
        coordinates: dropoffCoords,
        landmark: "",
      },
      vehicleType: fareResult.rateCard.name,
      fare: fareResult.fareInRupees,
      fareInPaise: fareResult.fareInPaise,
      distance: `${fareResult.distanceKm} km`,
      duration: `${fareResult.durationMins} mins`,
      pricingSnapshot: fareResult.pricingSnapshot,
      status: "SEARCHING",
      driver: null,
      driverDetails: undefined,
      otp,
      scheduledFor: claimed.scheduledFor,
      paymentMethod: commute.paymentMethod || "CASH",
      paymentStatus: "PENDING",
      petFriendly: isPetFriendly,
      preferredDriver: commute.preferredDriver || null,
      currentOffer: null,
      rejectedDrivers: [],
      dispatchAttempts: 0,
      dispatchStatus: "PENDING_DISPATCH",
      commuteId: commute._id,
      autoBookingOccurrenceKey: occurrenceKey,
      messages: [
        {
          sender: "rider",
          text: `Automated commute ride scheduled for ${commute.title}.`,
          timestamp: new Date(),
        },
      ],
    });
  } catch (writeErr: unknown) {
    const isDuplicateKey =
      typeof writeErr === "object" &&
      writeErr !== null &&
      "code" in writeErr &&
      (writeErr as { code?: number }).code === 11000;

    if (isDuplicateKey) {
      const concurrentRide = await Ride.findOne({ autoBookingOccurrenceKey: occurrenceKey });
      if (concurrentRide) {
        await AutoBookingOccurrence.updateOne(
          { _id: claimed._id, leaseId },
          {
            $set: {
              status: "MATERIALIZED",
              rideId: concurrentRide._id,
              leaseId: null,
              leaseExpiresAt: null,
              lastError: null,
            },
          }
        );
        await Commute.updateOne(
          { _id: commute._id },
          {
            $set: {
              lastGeneratedRideId: concurrentRide._id,
              lastMaterializedAt: atTime,
            },
          }
        );
        return {
          status: "RECONCILED_EXISTING",
          occurrenceKey,
          rideId: concurrentRide._id.toString(),
        };
      }
    }

    const isValidationError =
      typeof writeErr === "object" &&
      writeErr !== null &&
      "name" in writeErr &&
      (writeErr as { name?: string }).name === "ValidationError";

    const finalFailStatus: AutoBookingOccurrenceStatus = isValidationError
      ? "FAILED_PERMANENT"
      : "FAILED_RETRYABLE";

    const writeErrorMessage = writeErr instanceof Error ? writeErr.message : String(writeErr);
    await AutoBookingOccurrence.updateOne(
      { _id: claimed._id, leaseId },
      {
        $set: {
          status: finalFailStatus,
          lastError: `Ride persistence error: ${writeErrorMessage}`,
          leaseId: null,
          leaseExpiresAt: null,
        },
      }
    );
    return {
      status: finalFailStatus,
      occurrenceKey,
      error: writeErrorMessage,
    };
  }

  await AutoBookingOccurrence.updateOne(
    { _id: claimed._id, leaseId },
    {
      $set: {
        status: "MATERIALIZED",
        rideId: newRide._id,
        leaseId: null,
        leaseExpiresAt: null,
        lastError: null,
      },
    }
  );

  await Commute.updateOne(
    { _id: commute._id },
    {
      $set: {
        lastGeneratedRideId: newRide._id,
        lastMaterializedAt: atTime,
      },
    }
  );

  return {
    status: "MATERIALIZED",
    occurrenceKey,
    rideId: newRide._id.toString(),
  };
}

export async function processAutoBookingBatch(options?: {
  limit?: number;
  lookaheadMinutes?: number;
  atTime?: Date;
}): Promise<IBatchAutoBookingSummary> {
  const startTime = Date.now();
  await dbConnect();

  const atTime = options?.atTime || new Date();
  const lookaheadMinutes = options?.lookaheadMinutes || getAutoBookingLookaheadMinutes();
  const batchLimit = options?.limit || getAutoBookingBatchSize();

  const summary: IBatchAutoBookingSummary = {
    scannedCommutes: 0,
    materializedRides: 0,
    alreadyMaterialized: 0,
    reconciledExisting: 0,
    skippedPast: 0,
    skippedPaused: 0,
    retryableFailures: 0,
    permanentFailures: 0,
    currentlyLeased: 0,
    durationMs: 0,
    executedAt: atTime.toISOString(),
  };

  const activeCommutes = await Commute.find({ isActive: true })
    .sort({ lastMaterializedAt: 1, updatedAt: -1 })
    .limit(batchLimit);

  summary.scannedCommutes = activeCommutes.length;

  for (const commute of activeCommutes) {
    let candidates;
    try {
      candidates = calculateUpcomingOccurrences(commute, atTime, lookaheadMinutes);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[AutoBooking Batch] Skipping malformed commute schedule ${commute._id}: ${errMsg}`);
      summary.permanentFailures++;
      continue;
    }

    for (const cand of candidates) {
      try {
        await AutoBookingOccurrence.updateOne(
          { occurrenceKey: cand.occurrenceKey },
          {
            $setOnInsert: {
              occurrenceKey: cand.occurrenceKey,
              commuteId: commute._id,
              rider: commute.rider,
              scheduledFor: cand.scheduledFor,
              status: cand.isPast ? "SKIPPED_PAST" : "PENDING",
              attemptCount: 0,
              maxAttempts: DEFAULT_AUTO_BOOKING_MAX_ATTEMPTS,
            },
          },
          { upsert: true }
        );

        if (cand.isPast) {
          summary.skippedPast++;
          continue;
        }

        const result = await materializeOccurrence(cand.occurrenceKey, {
          forceAtTime: atTime,
          commute,
        });

        switch (result.status) {
          case "MATERIALIZED":
            summary.materializedRides++;
            break;
          case "ALREADY_MATERIALIZED":
            summary.alreadyMaterialized++;
            break;
          case "RECONCILED_EXISTING":
            summary.reconciledExisting++;
            break;
          case "SKIPPED_PAST":
            summary.skippedPast++;
            break;
          case "SKIPPED_PAUSED":
            summary.skippedPaused++;
            break;
          case "CURRENTLY_LEASED":
            summary.currentlyLeased++;
            break;
          case "FAILED_RETRYABLE":
            summary.retryableFailures++;
            break;
          case "FAILED_PERMANENT":
          case "MAX_ATTEMPTS_EXCEEDED":
            summary.permanentFailures++;
            break;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[AutoBooking Batch] Error processing occurrence ${cand.occurrenceKey}: ${errMsg}`);
        summary.retryableFailures++;
      }
    }
  }

  summary.durationMs = Date.now() - startTime;
  return summary;
}
