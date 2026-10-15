import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";
import {
  RideTransitionError,
  transitionToAccepted,
  transitionToOfferRejected,
  transitionToArrived,
  transitionToInProgress,
  transitionToCompleted,
  transitionToCancelledByDriver,
} from "@/lib/rideStateMachine";
import { confirmCashCollection, LedgerError } from "@/lib/ledgerService";
import { driverLocationRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rideId, otp, riderRating, riderCompliments, reason, coordinates, offerId } = body;

    await dbConnect();
    const driverUser = await getDriverUser(req);

    if (!rideId && action !== "UPDATE_LOCATION") {
      return NextResponse.json({ status: "error", message: "Ride ID is required" }, { status: 400 });
    }

    if (action === "ACCEPT") {
      const updatedRide = await transitionToAccepted({ rideId, driverUser, offerId });
      return NextResponse.json({ status: "success", message: "Ride accepted", data: updatedRide });
    }

    if (action === "REJECT") {
      const result = await transitionToOfferRejected({ rideId, driverUser, offerId });
      return NextResponse.json({
        status: "success",
        message: "Ride offer declined successfully",
        data: { rejected: result.rejected, rideId },
      });
    }

    if (action === "ARRIVED") {
      await transitionToArrived({ rideId, driverId: driverUser._id });
      return NextResponse.json({ status: "success", message: "Driver marked as arrived" });
    }

    if (action === "START") {
      await transitionToInProgress({ rideId, driverId: driverUser._id, otp });
      return NextResponse.json({ status: "success", message: "Ride started" });
    }

    if (action === "COMPLETE") {
      const { creditedAmount } = await transitionToCompleted({
        rideId,
        driverUser,
        rating: riderRating,
        compliments: riderCompliments,
      });

      return NextResponse.json({
        status: "success",
        message: "Ride completed successfully",
        data: { walletBalance: driverUser.walletBalance, creditedAmount },
      });
    }

    if (action === "CONFIRM_CASH_COLLECTED") {
      const result = await confirmCashCollection({
        rideId,
        driverId: driverUser._id,
        driverName: driverUser.name,
      });

      return NextResponse.json({
        status: "success",
        message: result.alreadyCollected
          ? "Cash collection already confirmed"
          : "Cash collection confirmed successfully",
        data: {
          rideId: result.ride._id,
          paymentStatus: result.ride.paymentStatus,
          collectedAmount: result.collectedAmountInRupees,
          alreadyCollected: result.alreadyCollected,
          transactionId: result.transaction?.idempotencyKey,
        },
      });
    }

    if (action === "CANCEL") {
      await transitionToCancelledByDriver({ rideId, driverUser, reason });
      return NextResponse.json({ status: "success", message: "Ride cancelled" });
    }

    if (action === "UPDATE_LOCATION") {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return NextResponse.json(
          {
            status: "error",
            code: "INVALID_COORDINATES",
            message: "Coordinates must be an array of [latitude, longitude].",
          },
          { status: 400 }
        );
      }

      const [lat, lng] = coordinates;
      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return NextResponse.json(
          {
            status: "error",
            code: "INVALID_COORDINATES",
            message: "Coordinates out of bounds. Latitude must be between -90 and 90, longitude between -180 and 180.",
          },
          { status: 400 }
        );
      }

      const rateCheck = await driverLocationRateLimiter.check(String(driverUser._id));
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            status: "error",
            code: "TOO_MANY_REQUESTS",
            message: "Driver location update frequency exceeded allowable threshold.",
            retryAfterSeconds: rateCheck.retryAfterSeconds,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateCheck.retryAfterSeconds || 1),
            },
          }
        );
      }
      await driverLocationRateLimiter.recordFailure(String(driverUser._id));

      const now = new Date();
      const rawTimestamp = body.timestamp || body.clientTimestamp;
      const clientDate = rawTimestamp ? new Date(rawTimestamp) : null;
      const isClientDateValid = clientDate !== null && !isNaN(clientDate.getTime());

      let activeRideVersion: number | null = null;
      if (rideId && mongoose.isValidObjectId(rideId)) {
        const existingRide = await Ride.findById(rideId).select(
          "status driver driverCoordinatesUpdatedAt trackingVersion"
        );

        if (existingRide) {
          if (existingRide.driver && existingRide.driver.toString() !== driverUser._id.toString()) {
            return NextResponse.json(
              {
                status: "error",
                code: "FORBIDDEN",
                message: "You are not the assigned driver for this ride.",
              },
              { status: 403 }
            );
          }

          if (["COMPLETED", "CANCELLED"].includes(existingRide.status)) {
            return NextResponse.json(
              {
                status: "error",
                code: "RIDE_TERMINAL",
                message: "Location updates are not accepted for terminal rides.",
              },
              { status: 409 }
            );
          }

          if (isClientDateValid && existingRide.driverCoordinatesUpdatedAt) {
            if (clientDate.getTime() < new Date(existingRide.driverCoordinatesUpdatedAt).getTime()) {
              return NextResponse.json(
                {
                  status: "error",
                  code: "OUT_OF_ORDER_LOCATION",
                  message: "Incoming location update is older than current location state.",
                  data: {
                    trackingVersion: existingRide.trackingVersion,
                    driverCoordinatesUpdatedAt: existingRide.driverCoordinatesUpdatedAt,
                  },
                },
                { status: 409 }
              );
            }
          }
        }

        const updatedRide = await Ride.findOneAndUpdate(
          {
            _id: rideId,
            driver: driverUser._id,
            status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
            ...(isClientDateValid
              ? {
                  $or: [
                    { driverCoordinatesUpdatedAt: null },
                    { driverCoordinatesUpdatedAt: { $exists: false } },
                    { driverCoordinatesUpdatedAt: { $lte: clientDate } },
                  ],
                }
              : {}),
          },
          {
            $set: {
              driverCoordinates: [lat, lng],
              driverCoordinatesUpdatedAt: now,
            },
            $inc: { trackingVersion: 1 },
          },
          { new: true }
        );

        if (updatedRide) {
          activeRideVersion = updatedRide.trackingVersion ?? null;
        }
      }

      driverUser.driverCoordinates = [lat, lng];
      driverUser.driverCoordinatesUpdatedAt = now;
      await driverUser.save();

      return NextResponse.json({
        status: "success",
        message: "Location updated",
        data: {
          coordinates: driverUser.driverCoordinates,
          updatedAt: driverUser.driverCoordinatesUpdatedAt,
          trackingVersion: activeRideVersion,
        },
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    if (error instanceof RideTransitionError) {
      return NextResponse.json(
        { status: "error", code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof LedgerError) {
      return NextResponse.json(
        { status: "error", code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Driver Ride Action Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
