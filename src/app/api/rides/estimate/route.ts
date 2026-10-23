import { NextResponse } from "next/server";
import {
  calculateAuthoritativeFare,
  validateCoordinates,
  PricingError,
  AUTHORITATIVE_RATE_CARDS,
} from "@/lib/pricingEngine";

export const dynamic = "force-dynamic";

interface EstimateRequestBody {
  pickupCoordinates: [number, number];
  dropoffCoordinates: [number, number];
  vehicleType?: string;
  petFriendly?: boolean;
  claimedDistanceKm?: number | null;
}

export async function POST(req: Request) {
  let body: Partial<EstimateRequestBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_JSON",
        message: "A valid JSON request body is required.",
      },
      { status: 400 }
    );
  }

  try {
    const {
      pickupCoordinates,
      dropoffCoordinates,
      vehicleType,
      petFriendly = false,
      claimedDistanceKm = null,
    } = body;

    if (!pickupCoordinates || !dropoffCoordinates) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_COORDINATES",
          message: "Valid pickupCoordinates and dropoffCoordinates [latitude, longitude] are required.",
        },
        { status: 400 }
      );
    }

    const validatedPickup = validateCoordinates(pickupCoordinates, "pickup");
    const validatedDropoff = validateCoordinates(dropoffCoordinates, "dropoff");

    const vehicleKeys = Object.keys(AUTHORITATIVE_RATE_CARDS);
    const categoryEstimates = vehicleKeys.map((key) => {
      const card = AUTHORITATIVE_RATE_CARDS[key];
      const fareResult = calculateAuthoritativeFare({
        pickupCoordinates: validatedPickup,
        dropoffCoordinates: validatedDropoff,
        vehicleType: card.name,
        petFriendly: Boolean(petFriendly),
        claimedDistanceKm: claimedDistanceKm ?? undefined,
      });

      return {
        id: card.id,
        name: card.name,
        capacity: card.capacity,
        baseRatePaise: card.baseRatePaise,
        perKmPaise: card.perKmPaise,
        fareInRupees: fareResult.fareInRupees,
        fareInPaise: fareResult.fareInPaise,
        distanceKm: fareResult.distanceKm,
        durationMins: fareResult.durationMins,
        pricingSnapshot: fareResult.pricingSnapshot,
      };
    });

    let selectedEstimate = categoryEstimates.find(
      (e) => vehicleType && e.name.toLowerCase().includes(vehicleType.toLowerCase())
    );
    if (!selectedEstimate && vehicleType) {
      const specific = calculateAuthoritativeFare({
        pickupCoordinates: validatedPickup,
        dropoffCoordinates: validatedDropoff,
        vehicleType,
        petFriendly: Boolean(petFriendly),
        claimedDistanceKm: claimedDistanceKm ?? undefined,
      });
      selectedEstimate = {
        id: specific.rateCard.id,
        name: specific.rateCard.name,
        capacity: specific.rateCard.capacity,
        baseRatePaise: specific.rateCard.baseRatePaise,
        perKmPaise: specific.rateCard.perKmPaise,
        fareInRupees: specific.fareInRupees,
        fareInPaise: specific.fareInPaise,
        distanceKm: specific.distanceKm,
        durationMins: specific.durationMins,
        pricingSnapshot: specific.pricingSnapshot,
      };
    }

    const primaryEstimate = selectedEstimate || categoryEstimates[2] || categoryEstimates[0];

    return NextResponse.json({
      status: "success",
      data: {
        distanceKm: primaryEstimate.distanceKm,
        durationMins: primaryEstimate.durationMins,
        petFriendly: Boolean(petFriendly),
        selectedVehicle: primaryEstimate.name,
        fareInRupees: primaryEstimate.fareInRupees,
        fareInPaise: primaryEstimate.fareInPaise,
        pricingSnapshot: primaryEstimate.pricingSnapshot,
        estimates: categoryEstimates,
      },
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json(
        {
          status: "error",
          code: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }
    console.error("[Fare Estimate Error]:", error);
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message: "Failed to calculate authoritative fare estimate." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pickupLat = searchParams.get("pickupLat");
    const pickupLng = searchParams.get("pickupLng");
    const dropoffLat = searchParams.get("dropoffLat");
    const dropoffLng = searchParams.get("dropoffLng");
    const vehicleType = searchParams.get("vehicleType") || "Cab Premium";
    const petFriendly = searchParams.get("petFriendly") === "true";
    const distanceKm = searchParams.get("distanceKm");

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_COORDINATES",
          message: "Query params pickupLat, pickupLng, dropoffLat, dropoffLng are required.",
        },
        { status: 400 }
      );
    }

    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    const validatedPickup = validateCoordinates([pLat, pLng], "pickup");
    const validatedDropoff = validateCoordinates([dLat, dLng], "dropoff");

    const claimedDist = distanceKm ? parseFloat(distanceKm) : null;

    const vehicleKeys = Object.keys(AUTHORITATIVE_RATE_CARDS);
    const categoryEstimates = vehicleKeys.map((key) => {
      const card = AUTHORITATIVE_RATE_CARDS[key];
      const fareResult = calculateAuthoritativeFare({
        pickupCoordinates: validatedPickup,
        dropoffCoordinates: validatedDropoff,
        vehicleType: card.name,
        petFriendly,
        claimedDistanceKm: claimedDist && !isNaN(claimedDist) ? claimedDist : undefined,
      });

      return {
        id: card.id,
        name: card.name,
        capacity: card.capacity,
        baseRatePaise: card.baseRatePaise,
        perKmPaise: card.perKmPaise,
        fareInRupees: fareResult.fareInRupees,
        fareInPaise: fareResult.fareInPaise,
        distanceKm: fareResult.distanceKm,
        durationMins: fareResult.durationMins,
        pricingSnapshot: fareResult.pricingSnapshot,
      };
    });

    const selectedEstimate =
      categoryEstimates.find((e) => e.name.toLowerCase().includes(vehicleType.toLowerCase())) ||
      categoryEstimates[2];

    return NextResponse.json({
      status: "success",
      data: {
        distanceKm: selectedEstimate.distanceKm,
        durationMins: selectedEstimate.durationMins,
        petFriendly,
        selectedVehicle: selectedEstimate.name,
        fareInRupees: selectedEstimate.fareInRupees,
        fareInPaise: selectedEstimate.fareInPaise,
        pricingSnapshot: selectedEstimate.pricingSnapshot,
        estimates: categoryEstimates,
      },
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json(
        {
          status: "error",
          code: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }
    console.error("[Fare Estimate Error]:", error);
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message: "Failed to calculate authoritative fare estimate." },
      { status: 500 }
    );
  }
}
