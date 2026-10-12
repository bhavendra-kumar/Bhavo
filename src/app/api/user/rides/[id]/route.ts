import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { requireRole, isAuthError, handleAuthError } from "@/lib/auth";
import {
  RideTransitionError,
  transitionToCancelledByRider,
} from "@/lib/rideStateMachine";
import { formatTrackingSnapshot } from "@/lib/rideTracking";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    await dbConnect();
    // Enforce rider resource ownership: user can only view their own ride
    const ride = await Ride.findOne({ _id: id, rider: user._id });
    if (!ride) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    const snapshot = formatTrackingSnapshot(ride, "RIDER");
    const data = {
      ...ride.toObject(),
      _id: ride._id.toString(),
      locationStatus: snapshot.locationStatus,
      isLocationFresh: snapshot.isLocationFresh,
      locationAgeSeconds: snapshot.locationAgeSeconds,
      trackingVersion: snapshot.trackingVersion,
      driverCoordinates: snapshot.driverCoordinates,
      driverCoordinatesUpdatedAt: snapshot.driverCoordinatesUpdatedAt,
    };

    return NextResponse.json({ status: "success", data });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Ride GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    await dbConnect();

    // RIDER CANCELLATION: delegated to atomic state machine
    if (action === "cancel") {
      const updatedRide = await transitionToCancelledByRider({
        rideId: id,
        riderId: user._id,
        reason: body.reason,
      });

      return NextResponse.json({
        status: "success",
        message: "Ride cancelled successfully",
        data: updatedRide,
      });
    }

    // Rate Trip action (only permitted on completed rides)
    if (action === "rate_trip") {
      const ride = await Ride.findOne({ _id: id, rider: user._id });
      if (!ride) {
        return NextResponse.json({ status: "error", message: "Ride not found" }, { status: 404 });
      }

      if (ride.status !== "COMPLETED") {
        return NextResponse.json(
          { status: "error", code: "NOT_COMPLETED", message: "Cannot rate a ride that is not completed" },
          { status: 409 }
        );
      }

      const { rating, tip, compliments } = body;

      // Phase 1C: Prevent unfunded monetary tipping mutations
      if (typeof tip === "number" && tip > 0) {
        return NextResponse.json(
          {
            status: "error",
            code: "TIPPING_DISABLED_IN_V1",
            message: "Post-ride tipping is disabled in V1 until payment gateway settlement is active.",
          },
          { status: 400 }
        );
      }

      if (typeof rating === "number") {
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          return NextResponse.json(
            { status: "error", code: "INVALID_RATING", message: "Rating must be between 1 and 5" },
            { status: 400 }
          );
        }
        ride.riderRating = Math.round(rating);
      }

      if (Array.isArray(compliments)) {
        ride.riderCompliments = compliments.filter((c) => typeof c === "string" && c.trim().length > 0);
      }

      await ride.save();
      return NextResponse.json({ status: "success", message: "Feedback submitted successfully", data: ride });
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
    console.error("[Ride PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
