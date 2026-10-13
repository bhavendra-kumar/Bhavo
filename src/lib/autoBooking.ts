/**
 * Auto Booking & Recurring Ride Materialization Service (Phase 1F)
 *
 * Rules:
 * - A schedule is not a ride: materializes exactly one individual Ride per occurrence.
 * - Enforces durable idempotency via AutoBookingOccurrence and Ride.autoBookingOccurrenceKey unique index.
 * - Atomic lease claiming prevents duplicate rides under concurrent workers.
 * - Reconciles partial failures if Ride exists but occurrence update failed.
 * - Authoritative server-side pricing in integer paise via Phase 1C calculateAuthoritativeFare.
 * - Phase 1D compatibility: scheduledFor is set to future pickup time, ensuring rides enter
 *   driver dispatch strictly at the T-60 minute boundary.
 * - Past occurrences are skipped; paused/inactive commutes are respected.
 */

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

/**
 * Atomically materializes a single scheduled occurrence into an individual Ride.
 * Crash-safe and idempotent under concurrent workers.
 */
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

  // 1. Fetch current occurrence record
  const existingRecord = await AutoBookingOccurrence.findOne({ occurrenceKey });
  if (!existingRecord) {
    return {
      status: "FAILED_PERMANENT",
      occurrenceKey,
      error: "Occurrence record not found for materialization",
    };
  }

  // If already materialized and linked, return immediately
  if (existingRecord.status === "MATERIALIZED" && existingRecord.rideId) {
    return {
      status: "ALREADY_MATERIALIZED",
      occurrenceKey,
      rideId: existingRecord.rideId.toString(),
    };
  }

  // If permanently failed or skipped past, do not retry
  if (existingRecord.status === "FAILED_PERMANENT" || existingRecord.status === "SKIPPED_PAST") {
    return {
      status: existingRecord.status,
      occurrenceKey,
      error: existingRecord.lastError || "Occurrence permanently in terminal state",
    };
  }

  // 2. Atomic Lease Claim:
  // Claims if pending/retryable with attempts remaining, OR if lease has expired with attempts remaining
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
    // Could not claim: check if currently leased by another active worker
    const current = await AutoBookingOccurrence.findOne({ occurrenceKey });
    if (current?.status === "CLAIMED" && current.leaseExpiresAt && current.leaseExpiresAt > atTime) {
      return { status: "CURRENTLY_LEASED", occurrenceKey };
    }
    if (current?.status === "MATERIALIZED" && current.rideId) {
      return { status: "ALREADY_MATERIALIZED", occurrenceKey, rideId: current.rideId.toString() };
    }
    return { status: "MAX_ATTEMPTS_EXCEEDED", occurrenceKey, error: "Maximum attempts reached without success" };
  }

  // 3. Reconcile Partial Failure:
  // Check if a Ride with this autoBookingOccurrenceKey was ALREADY persisted in MongoDB
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
    // Keep parent commute synchronized with the reconciled ride
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

  // 4. Verify Commute & Rider Account Integrity
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

  // Strictly reject malformed commute configurations permanently rather than retrying indefinitely
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

  // 5. Verify Scheduled Pickup Time is Not in the Past
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

  // 6. Authoritative Server-Side Pricing (Phase 1C Integration)
  const pickupCoords = commute.pickup?.coordinates || [28.6139, 77.209];
  const dropoffCoords = commute.dropoff?.coordinates || [28.5355, 77.391];
  const vehicleType = commute.vehicleType || "Cab Premium";
  const isPetFriendly = Boolean(commute.petFriendly);

  let fareResult;
  try {
    fareResult = calculateAuthoritativeFare({
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
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

  // 7. Cryptographically Secure OTP Generation
  const otp = crypto.randomInt(1000, 10000).toString();

  // 8. Materialize the Individual Ride
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
    // If unique index conflict on autoBookingOccurrenceKey occurred concurrently
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
        // Keep parent commute synchronized with the reconciled ride
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

  // 9. Finalize Occurrence as MATERIALIZED
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

  // 10. Update Commute Metadata
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

/**
 * Scans active commutes, identifies upcoming schedule occurrences within the lookahead window,
 * and processes materialization in a bounded, restart-safe batch.
 */
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

  // 1. Fetch active commutes up to the bounded limit, prioritized by least-recently materialized
  const activeCommutes = await Commute.find({ isActive: true })
    .sort({ lastMaterializedAt: 1, updatedAt: -1 })
    .limit(batchLimit);

  summary.scannedCommutes = activeCommutes.length;

  // 2. Identify candidate occurrences for each active commute
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
        // Upsert durable occurrence record with initial PENDING status (if not existing)
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

        // If the occurrence is in the past, skip materialization
        if (cand.isPast) {
          summary.skippedPast++;
          continue;
        }

        // Materialize the occurrence
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
