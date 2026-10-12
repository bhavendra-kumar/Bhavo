import mongoose from "mongoose";
import Ride, { IRide } from "@/models/Ride";
import User from "@/models/User";
import { checkDriverVerification, IDriverDoc } from "@/lib/driverCompliance";
import { isVehicleCompatible, isPetCompatible } from "@/lib/driverEligibility";
import { getDispatchMaxAttempts } from "@/lib/dispatchConfig";

export type RideStatus =
  | "SEARCHING"
  | "ACCEPTED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Authoritative Canonical Transition Map
 * Canonical lifecycle: SEARCHING -> ACCEPTED -> ARRIVED -> IN_PROGRESS -> COMPLETED
 * Cancellations:
 * - SEARCHING, ACCEPTED, ARRIVED can be CANCELLED
 * - Terminal states (COMPLETED, CANCELLED) have zero allowed transitions
 * - IN_PROGRESS cannot be cancelled via normal flow
 */
export const VALID_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  SEARCHING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Authoritative default dispatch lead time (in minutes).
 * Scheduled rides enter the driver confirmation window at T-60 minutes before scheduled pickup.
 */
export const DEFAULT_DISPATCH_LEAD_TIME_MINUTES = 60;

/**
 * Validates and retrieves the configured dispatch lead time in minutes.
 * - If the environment variable is absent or empty, returns the default (60 minutes).
 * - Enforces a finite, positive integer (> 0).
 * - Rejects non-numeric values, decimals, zero, negative numbers, NaN, or Infinity with a descriptive Error.
 */
export function getDispatchLeadTimeMinutes(
  rawVal: string | undefined = process.env.RIDE_DISPATCH_LEAD_TIME_MINUTES
): number {
  if (rawVal === undefined || rawVal === null || (typeof rawVal === "string" && rawVal.trim() === "")) {
    return DEFAULT_DISPATCH_LEAD_TIME_MINUTES;
  }

  const trimmed = typeof rawVal === "string" ? rawVal.trim() : String(rawVal);

  // Must be an integer string composed strictly of digits
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES configuration: "${rawVal}". Value must be a positive integer without decimals or symbols.`
    );
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid RIDE_DISPATCH_LEAD_TIME_MINUTES configuration: "${rawVal}". Value must be a positive integer greater than zero.`
    );
  }

  return parsed;
}

/**
 * Authoritative single source of truth for the dispatch lead time in milliseconds.
 * Converts configured minutes to milliseconds at the configuration/domain boundary.
 */
export function getDispatchLeadTimeMs(
  rawVal: string | undefined = process.env.RIDE_DISPATCH_LEAD_TIME_MINUTES
): number {
  return getDispatchLeadTimeMinutes(rawVal) * 60 * 1000;
}

/**
 * Default dispatch lead time in milliseconds (for static references)
 */
export const DISPATCH_LEAD_TIME_MS = DEFAULT_DISPATCH_LEAD_TIME_MINUTES * 60 * 1000;

export interface IDriverUserState {
  _id: mongoose.Types.ObjectId | string;
  name?: string;
  phone?: string;
  rating?: number;
  status?: string;
  driverVehicle?: {
    type?: string;
    numberPlate?: string;
    model?: string;
    documentsVerified?: boolean;
    [key: string]: unknown;
  };
  driverDocuments?: IDriverDoc[];
  driverCoordinates?: [number, number];
  avatar?: string | null;
  dutyState?: string;
  activeRideId?: mongoose.Types.ObjectId | string | null;
  isOnline?: boolean;
  driverSettings?: {
    petFriendly?: boolean;
    [key: string]: unknown;
  };
  walletBalance?: number;
  save: () => Promise<unknown>;
  [key: string]: unknown;
}

export class RideTransitionError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 409, code = "INVALID_TRANSITION") {
    super(message);
    this.name = "RideTransitionError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Evaluates whether a requested transition is valid according to the canonical state machine.
 */
export function canTransition(fromStatus: RideStatus, toStatus: RideStatus): boolean {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Evaluates whether a ride is currently dispatchable.
 * Instant rides (scheduledFor is null) are immediately dispatchable.
 * Scheduled rides are dispatchable ONLY if current time is within leadTimeMs of scheduledFor.
 * Exact boundary: atTime >= scheduledFor - leadTimeMs (equivalently scheduledFor <= atTime + leadTimeMs).
 */
export function isRideDispatchable(
  ride: { status: string; driver?: unknown; scheduledFor?: Date | string | null },
  atTime: Date = new Date(),
  leadTimeMs: number = getDispatchLeadTimeMs()
): boolean {
  if (ride.status !== "SEARCHING") return false;
  if (ride.driver) return false;
  if (!ride.scheduledFor) return true;

  const scheduledDate = new Date(ride.scheduledFor);
  if (isNaN(scheduledDate.getTime())) return false;

  const earliestDispatchTime = new Date(scheduledDate.getTime() - leadTimeMs);
  return atTime.getTime() >= earliestDispatchTime.getTime();
}

/**
 * ATOMIC TRANSITION: SEARCHING -> ACCEPTED
 * Concurrency Safety:
 * Exactly ONE driver can accept a SEARCHING ride.
 * MongoDB atomic findOneAndUpdate with condition { status: "SEARCHING", driver: null } decides the winner.
 * Losers receive 409 Conflict without modifying database state.
 */
export async function transitionToAccepted({
  rideId,
  driverUser,
  offerId,
  atTime = new Date(),
  leadTimeMs = getDispatchLeadTimeMs(),
}: {
  rideId: string;
  driverUser: IDriverUserState;
  offerId?: string;
  atTime?: Date;
  leadTimeMs?: number;
}): Promise<IRide> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  // 1. Account status validation: incomplete, suspended, or disabled drivers cannot accept rides
  if (driverUser.status && driverUser.status !== "ACTIVE") {
    throw new RideTransitionError(
      `Driver account is ${driverUser.status.toLowerCase()} and cannot accept rides`,
      403,
      "DRIVER_INACTIVE"
    );
  }

  // 2. Driver verification compliance check
  const verification = checkDriverVerification(driverUser);
  if (!verification.isVerified) {
    throw new RideTransitionError(
      verification.reason || "Cannot accept ride: Driver documents must be verified first.",
      403,
      "DOCUMENTS_UNVERIFIED"
    );
  }

  // 3. Online availability check
  if (driverUser.isOnline === false || driverUser.dutyState === "OFFLINE") {
    throw new RideTransitionError("Driver is currently offline and cannot accept rides", 403, "DRIVER_OFFLINE");
  }

  // 4. Active-trip exclusivity check (driver cannot have another active trip)
  const occupiedRide = await Ride.findOne({
    driver: driverUser._id,
    status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
  });
  if (occupiedRide) {
    if (occupiedRide._id.toString() === rideId) {
      return occupiedRide; // Idempotent retry by the same assigned driver
    }
    throw new RideTransitionError("Driver already has an active ride in progress", 409, "DRIVER_OCCUPIED");
  }

  // 5. Pre-fetch existing ride to validate offer ownership, vehicle compatibility, and pet compatibility
  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (existing.driver && existing.driver.toString() === driverUser._id.toString() && existing.status === "ACCEPTED") {
    return existing; // Idempotent retry
  }

  if (existing.driver) {
    throw new RideTransitionError("Ride has already been accepted by another driver", 409, "RIDE_ALREADY_ACCEPTED");
  }

  if (existing.status === "CANCELLED") {
    throw new RideTransitionError("Ride has been cancelled and is no longer available", 409, "RIDE_CANCELLED");
  }

  if (existing.status !== "SEARCHING") {
    throw new RideTransitionError(
      `Cannot accept ride with current status '${existing.status}'`,
      409,
      "INVALID_TRANSITION"
    );
  }

  // 6. Dispatch window condition: scheduled rides cannot be accepted earlier than configured lead time
  const maxAllowedScheduledFor = new Date(atTime.getTime() + leadTimeMs);
  if (existing.scheduledFor && new Date(existing.scheduledFor) > maxAllowedScheduledFor) {
    throw new RideTransitionError(
      "Scheduled ride cannot be accepted before its dispatch window",
      409,
      "SCHEDULED_RIDE_EARLY"
    );
  }

  // 7. Targeted offer ownership and expiration check
  if (existing.currentOffer) {
    const offerDriverId = existing.currentOffer.driverId ? existing.currentOffer.driverId.toString() : "";
    if (offerDriverId && offerDriverId !== driverUser._id.toString()) {
      throw new RideTransitionError("This ride offer was dispatched to another driver", 403, "OFFER_MISMATCH");
    }
    if (offerId && existing.currentOffer.offerId && existing.currentOffer.offerId !== offerId) {
      throw new RideTransitionError("Stale offer identifier", 409, "STALE_OFFER_ID");
    }
    if (existing.currentOffer.expiresAt && new Date(existing.currentOffer.expiresAt) < atTime) {
      throw new RideTransitionError("Ride offer has expired", 409, "OFFER_EXPIRED");
    }
  }

  // 8. Vehicle compatibility check
  if (!isVehicleCompatible(driverUser.driverVehicle?.type, existing.vehicleType)) {
    throw new RideTransitionError(
      `Driver vehicle "${driverUser.driverVehicle?.type || "unknown"}" cannot fulfill ride "${existing.vehicleType}"`,
      409,
      "VEHICLE_INCOMPATIBLE"
    );
  }

  // 9. Pet compatibility check
  if (existing.petFriendly && !isPetCompatible(driverUser.driverSettings, true)) {
    throw new RideTransitionError("Ride requires a pet-friendly driver", 409, "PET_INCOMPATIBLE");
  }

  // 10. Atomic driver reservation to prevent simultaneous acceptance of multiple active rides
  // Enforces mutual exclusion directly on the driver document with activeRideId tracking
  const driverReserved = await User.findOneAndUpdate(
    {
      _id: driverUser._id,
      status: "ACTIVE",
      isOnline: true,
      dutyState: { $in: ["ONLINE_SEARCHING", "DISPATCH_ALERT"] },
      $or: [
        { activeRideId: null },
        { activeRideId: { $exists: false } },
        { activeRideId: rideId }, // Allow idempotent re-entry for the same ride
      ],
    },
    {
      $set: { dutyState: "ON_TRIP", activeRideId: rideId },
    },
    { new: true }
  );

  if (!driverReserved) {
    const currentActive = await Ride.findOne({
      _id: rideId,
      driver: driverUser._id,
      status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
    });
    if (currentActive) {
      return currentActive;
    }
    throw new RideTransitionError("Driver already has an active ride in progress", 409, "DRIVER_OCCUPIED");
  }

  // 11. Atomic CAS assignment on Ride
  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: "SEARCHING",
      driver: null,
      $or: [
        { scheduledFor: null },
        { scheduledFor: { $exists: false } },
        { scheduledFor: { $lte: maxAllowedScheduledFor } },
      ],
      $and: [
        {
          $or: [
            { currentOffer: null },
            { "currentOffer.driverId": driverUser._id },
          ],
        },
      ],
    },
    {
      $set: {
        status: "ACCEPTED",
        driver: driverUser._id,
        currentOffer: null,
        dispatchStatus: "ASSIGNED",
        driverDetails: {
          name: driverUser.name,
          phone: driverUser.phone || "+91 98765 43210",
          rating: driverUser.rating || 4.94,
          vehicleNumber: driverUser.driverVehicle?.numberPlate || "DL-01-EV-4429",
          vehicleModel: driverUser.driverVehicle?.model || "Tata Tigor EV",
          avatar: driverUser.avatar || null,
        },
        driverCoordinates: driverUser.driverCoordinates || [28.6139, 77.209],
        acceptedAt: atTime,
      },
    },
    { new: true }
  );

  if (updatedRide) {
    driverUser.dutyState = "ON_TRIP";
    driverUser.activeRideId = updatedRide._id;
    return updatedRide;
  }

  // If Ride assignment CAS was lost, immediately release driver reservation conditionally on THIS ride
  await User.updateOne(
    { _id: driverUser._id, activeRideId: rideId },
    {
      $set: {
        dutyState: driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
        activeRideId: null,
      },
    }
  );

  // Re-inspect if atomic CAS was lost
  const finalCheck = await Ride.findById(rideId);
  if (finalCheck?.driver && finalCheck.driver.toString() === driverUser._id.toString()) {
    return finalCheck;
  }
  if (finalCheck?.driver) {
    throw new RideTransitionError("Ride has already been accepted by another driver", 409, "RIDE_ALREADY_ACCEPTED");
  }
  if (finalCheck?.status === "CANCELLED") {
    throw new RideTransitionError("Ride has been cancelled and is no longer available", 409, "RIDE_CANCELLED");
  }

  throw new RideTransitionError("Unable to accept ride due to conflict", 409, "CONFLICT");
}

/**
 * ATOMIC TRANSITION: Driver Rejection / Decline of a Targeted Offer
 * - Appends the rejecting driver to rejectedDrivers
 * - Atomically clears currentOffer so the matching engine can advance
 * - Updates dispatchStatus to DISPATCHING or EXHAUSTED if max attempts reached
 */
export async function transitionToOfferRejected({
  rideId,
  driverUser,
  offerId,
}: {
  rideId: string;
  driverUser: IDriverUserState;
  offerId?: string;
}): Promise<{ rejected: boolean; ride: IRide }> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (existing.status !== "SEARCHING") {
    return { rejected: false, ride: existing };
  }

  // If ride has an active offer, verify caller owns it
  if (existing.currentOffer) {
    const offerDriverId = existing.currentOffer.driverId ? existing.currentOffer.driverId.toString() : "";
    if (offerDriverId && offerDriverId !== driverUser._id.toString()) {
      throw new RideTransitionError("Cannot reject an offer assigned to another driver", 403, "OFFER_MISMATCH");
    }
    if (offerId && existing.currentOffer.offerId && existing.currentOffer.offerId !== offerId) {
      throw new RideTransitionError("Stale offer identifier", 409, "STALE_OFFER_ID");
    }
  }

  const maxAttempts = getDispatchMaxAttempts();
  const nextAttempts = (existing.dispatchAttempts || 0);

  const updated = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: "SEARCHING",
      $or: [
        { "currentOffer.driverId": driverUser._id },
        { currentOffer: null },
      ],
    },
    {
      $addToSet: { rejectedDrivers: driverUser._id },
      $set: {
        currentOffer: null,
        dispatchStatus: nextAttempts >= maxAttempts ? "EXHAUSTED" : "DISPATCHING",
      },
    },
    { new: true }
  );

  return { rejected: true, ride: updated || existing };
}

/**
 * ATOMIC TRANSITION: ACCEPTED -> ARRIVED
 * Requires assigned driver ownership and status === ACCEPTED.
 */
export async function transitionToArrived({
  rideId,
  driverId,
  atTime = new Date(),
}: {
  rideId: string;
  driverId: mongoose.Types.ObjectId | string;
  atTime?: Date;
}): Promise<IRide> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: "ACCEPTED",
      driver: driverId,
    },
    {
      $set: {
        status: "ARRIVED",
        arrivedAt: atTime,
      },
    },
    { new: true }
  );

  if (updatedRide) {
    return updatedRide;
  }

  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (!existing.driver || existing.driver.toString() !== driverId.toString()) {
    throw new RideTransitionError("Forbidden: Not assigned to this ride", 403, "FORBIDDEN");
  }

  if (existing.status === "ARRIVED") {
    return existing; // Idempotent arrival
  }

  throw new RideTransitionError(
    `Cannot mark arrived from status '${existing.status}'`,
    409,
    "INVALID_TRANSITION"
  );
}

/**
 * ATOMIC TRANSITION: ARRIVED -> IN_PROGRESS
 * Requires valid OTP, assigned driver ownership, and status === ARRIVED.
 */
export async function transitionToInProgress({
  rideId,
  driverId,
  otp,
  atTime = new Date(),
}: {
  rideId: string;
  driverId: mongoose.Types.ObjectId | string;
  otp: string;
  atTime?: Date;
}): Promise<IRide> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  const cleanOtp = String(otp || "").trim();
  if (!cleanOtp) {
    throw new RideTransitionError("OTP code is required to start ride", 400, "OTP_REQUIRED");
  }

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: "ARRIVED",
      driver: driverId,
      otp: cleanOtp,
    },
    {
      $set: {
        status: "IN_PROGRESS",
        startedAt: atTime,
      },
    },
    { new: true }
  );

  if (updatedRide) {
    return updatedRide;
  }

  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (!existing.driver || existing.driver.toString() !== driverId.toString()) {
    throw new RideTransitionError("Forbidden: Not assigned to this ride", 403, "FORBIDDEN");
  }

  if (existing.status === "IN_PROGRESS") {
    throw new RideTransitionError("Ride is already in progress", 409, "ALREADY_STARTED");
  }

  if (existing.status !== "ARRIVED") {
    throw new RideTransitionError(
      `Cannot start ride from status '${existing.status}'`,
      409,
      "INVALID_TRANSITION"
    );
  }

  if (existing.otp !== cleanOtp) {
    throw new RideTransitionError("Invalid OTP code", 400, "INVALID_OTP");
  }

  throw new RideTransitionError("Unable to start ride", 409, "CONFLICT");
}

/**
 * ATOMIC TRANSITION: IN_PROGRESS -> COMPLETED
 * Concurrency Safety & Financial Side Effects:
 * Exactly ONE request can transition from IN_PROGRESS to COMPLETED.
 * Financial side effects (wallet balance, earnings) are applied ONLY upon winning the atomic transition.
 * Duplicate completion calls are safely rejected with 409 ALREADY_COMPLETED.
 */
export async function transitionToCompleted({
  rideId,
  driverUser,
  rating,
  compliments,
  atTime = new Date(),
}: {
  rideId: string;
  driverUser: IDriverUserState;
  rating?: number;
  compliments?: string[];
  atTime?: Date;
}): Promise<{ ride: IRide; creditedAmount: number }> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  // Lookup existing ride to determine payment method and target payment status
  const existingRide = await Ride.findById(rideId);
  if (!existingRide) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (!existingRide.driver || existingRide.driver.toString() !== driverUser._id.toString()) {
    throw new RideTransitionError("Forbidden: Not assigned to this ride", 403, "FORBIDDEN");
  }

  if (existingRide.status === "COMPLETED") {
    throw new RideTransitionError("Ride is already completed", 409, "ALREADY_COMPLETED");
  }

  if (existingRide.status !== "IN_PROGRESS") {
    throw new RideTransitionError(
      `Cannot complete ride from status '${existingRide.status}'`,
      409,
      "INVALID_TRANSITION"
    );
  }

  // Phase 1C Invariant: Completing a ride NEVER marks payment as PAID automatically.
  // Cash rides enter PENDING_COLLECTION awaiting explicit driver confirmation.
  // Online/wallet rides enter PENDING_PAYMENT awaiting verified server settlement.
  const targetPaymentStatus =
    existingRide.paymentMethod === "CASH" ? "PENDING_COLLECTION" : "PENDING_PAYMENT";

  const updateFields: Record<string, unknown> = {
    status: "COMPLETED",
    paymentStatus: targetPaymentStatus,
    completedAt: atTime,
  };

  if (typeof rating === "number") updateFields.riderRating = rating;
  if (Array.isArray(compliments)) updateFields.riderCompliments = compliments;

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: "IN_PROGRESS",
      driver: driverUser._id,
    },
    { $set: updateFields },
    { new: true }
  );

  if (updatedRide) {
    // Release driver reservation conditionally on THIS completed ride
    await User.updateOne(
      { _id: driverUser._id, activeRideId: rideId },
      {
        $set: {
          dutyState: driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
          activeRideId: null,
        },
      }
    );
    driverUser.dutyState = driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
    driverUser.activeRideId = null;
    if (typeof driverUser.save === "function") {
      await driverUser.save();
    }

    // In Phase 1C: Cash is collected directly by driver in person, so platform wallet balance
    // is NOT credited (preventing double credit). Online payment settlement is pending gateway.
    return { ride: updatedRide, creditedAmount: 0 };
  }

  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (!existing.driver || existing.driver.toString() !== driverUser._id.toString()) {
    throw new RideTransitionError("Forbidden: Not assigned to this ride", 403, "FORBIDDEN");
  }

  if (existing.status === "COMPLETED") {
    throw new RideTransitionError("Ride is already completed", 409, "ALREADY_COMPLETED");
  }

  throw new RideTransitionError(
    `Cannot complete ride from status '${existing.status}'`,
    409,
    "INVALID_TRANSITION"
  );
}

/**
 * ATOMIC TRANSITION: CANCELLED (by Rider)
 * Rider can cancel their own ride in SEARCHING, ACCEPTED, or ARRIVED states.
 * Cannot cancel IN_PROGRESS or COMPLETED rides.
 * Duplicate cancellations return 409 ALREADY_CANCELLED.
 */
export async function transitionToCancelledByRider({
  rideId,
  riderId,
  reason,
  atTime = new Date(),
}: {
  rideId: string;
  riderId: mongoose.Types.ObjectId | string;
  reason?: string;
  atTime?: Date;
}): Promise<IRide> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      rider: riderId,
      status: { $in: ["SEARCHING", "ACCEPTED", "ARRIVED"] },
    },
    {
      $set: {
        status: "CANCELLED",
        cancellationReason: reason || "Rider requested cancellation",
        cancelledBy: "RIDER",
        cancelledAt: atTime,
      },
    },
    { new: true }
  );

  if (updatedRide) {
    // If a driver was assigned, release their reservation conditionally on THIS cancelled ride
    if (updatedRide.driver) {
      await User.updateOne(
        { _id: updatedRide.driver, activeRideId: updatedRide._id },
        {
          $set: {
            dutyState: "ONLINE_SEARCHING",
            activeRideId: null,
          },
        }
      );
    }
    return updatedRide;
  }

  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (existing.rider.toString() !== riderId.toString()) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND"); // IDOR prevention
  }

  if (existing.status === "CANCELLED") {
    throw new RideTransitionError("Ride is already cancelled", 409, "ALREADY_CANCELLED");
  }

  if (existing.status === "COMPLETED") {
    throw new RideTransitionError("Cannot cancel a completed ride", 409, "CANNOT_CANCEL_COMPLETED");
  }

  if (existing.status === "IN_PROGRESS") {
    throw new RideTransitionError("Cannot cancel a ride that is already in progress", 409, "CANNOT_CANCEL_IN_PROGRESS");
  }

  throw new RideTransitionError(
    `Cannot cancel ride with status '${existing.status}'`,
    409,
    "INVALID_TRANSITION"
  );
}

/**
 * ATOMIC TRANSITION: CANCELLED (by Driver)
 * Driver can cancel assigned ride in ACCEPTED or ARRIVED states.
 * Cannot cancel SEARCHING (not assigned), IN_PROGRESS, or COMPLETED rides.
 */
export async function transitionToCancelledByDriver({
  rideId,
  driverUser,
  reason,
  atTime = new Date(),
}: {
  rideId: string;
  driverUser: IDriverUserState;
  reason?: string;
  atTime?: Date;
}): Promise<IRide> {
  if (!mongoose.isValidObjectId(rideId)) {
    throw new RideTransitionError("Invalid ride ID format", 400, "INVALID_ID");
  }

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      driver: driverUser._id,
      status: { $in: ["ACCEPTED", "ARRIVED"] },
    },
    {
      $set: {
        status: "CANCELLED",
        cancellationReason: reason || "Driver requested cancellation",
        cancelledBy: "DRIVER",
        cancelledAt: atTime,
      },
    },
    { new: true }
  );

  if (updatedRide) {
    // Release driver reservation conditionally on THIS cancelled ride
    await User.updateOne(
      { _id: driverUser._id, activeRideId: rideId },
      {
        $set: {
          dutyState: driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
          activeRideId: null,
        },
      }
    );
    driverUser.dutyState = driverUser.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
    driverUser.activeRideId = null;
    if (typeof driverUser.save === "function") {
      await driverUser.save();
    }
    return updatedRide;
  }

  const existing = await Ride.findById(rideId);
  if (!existing) {
    throw new RideTransitionError("Ride not found", 404, "RIDE_NOT_FOUND");
  }

  if (!existing.driver || existing.driver.toString() !== driverUser._id.toString()) {
    throw new RideTransitionError("Forbidden: Not assigned to this ride", 403, "FORBIDDEN");
  }

  if (existing.status === "CANCELLED") {
    throw new RideTransitionError("Ride is already cancelled", 409, "ALREADY_CANCELLED");
  }

  if (existing.status === "COMPLETED") {
    throw new RideTransitionError("Cannot cancel a completed ride", 409, "CANNOT_CANCEL_COMPLETED");
  }

  if (existing.status === "IN_PROGRESS") {
    throw new RideTransitionError("Cannot cancel a ride that is already in progress", 409, "CANNOT_CANCEL_IN_PROGRESS");
  }

  throw new RideTransitionError(
    `Cannot cancel ride from status '${existing.status}'`,
    409,
    "INVALID_TRANSITION"
  );
}
