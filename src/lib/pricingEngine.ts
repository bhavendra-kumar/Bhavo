/**
 * Server-Authoritative Pricing Engine (Phase 1C)
 * 
 * Rules:
 * - All internal money calculations are strictly in integer paise (₹1 = 100 paise).
 * - Client-supplied fares, distances, or multipliers are NEVER trusted.
 * - Coordinates are validated; geodesic distance is calculated via Haversine.
 * - Rate cards are frozen to authoritative platform standards.
 */

export class PricingError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = "PRICING_ERROR", statusCode = 400) {
    super(message);
    this.name = "PricingError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface VehicleRateCard {
  id: string;
  name: string;
  baseRatePaise: number; // in integer paise
  perKmPaise: number;    // in integer paise
  capacity: number;
}

export const AUTHORITATIVE_RATE_CARDS: Record<string, VehicleRateCard> = {
  bike: {
    id: "bike",
    name: "Bike",
    baseRatePaise: 4000, // ₹40
    perKmPaise: 1200,    // ₹12/km
    capacity: 1,
  },
  auto: {
    id: "auto",
    name: "Auto",
    baseRatePaise: 5000, // ₹50
    perKmPaise: 1600,    // ₹16/km
    capacity: 3,
  },
  economy: {
    id: "economy",
    name: "Cab Economy",
    baseRatePaise: 8000, // ₹80
    perKmPaise: 2200,    // ₹22/km
    capacity: 4,
  },
  premium: {
    id: "premium",
    name: "Cab Premium",
    baseRatePaise: 12000, // ₹120
    perKmPaise: 3200,     // ₹32/km
    capacity: 4,
  },
  large: {
    id: "large",
    name: "Cab Large",
    baseRatePaise: 16000, // ₹160
    perKmPaise: 4200,     // ₹42/km
    capacity: 6,
  },
  parcel: {
    id: "parcel",
    name: "Parcel Express",
    baseRatePaise: 3500, // ₹35
    perKmPaise: 1000,    // ₹10/km
    capacity: 1,
  },
};

export const PRICING_RULE_VERSION = "v1_standard";

/**
 * Normalizes vehicle type string to matching rate card key
 */
export function resolveRateCard(vehicleTypeInput: string): VehicleRateCard {
  if (!vehicleTypeInput || typeof vehicleTypeInput !== "string") {
    throw new PricingError(
      "Vehicle type must be a non-empty string",
      "INVALID_VEHICLE_TYPE",
      400
    );
  }

  const normalized = vehicleTypeInput.trim().toLowerCase();

  if (normalized.includes("bike")) return AUTHORITATIVE_RATE_CARDS.bike;
  if (normalized.includes("auto")) return AUTHORITATIVE_RATE_CARDS.auto;
  if (normalized.includes("large") || normalized.includes("xl")) return AUTHORITATIVE_RATE_CARDS.large;
  if (normalized.includes("economy")) return AUTHORITATIVE_RATE_CARDS.economy;
  if (normalized.includes("premium")) return AUTHORITATIVE_RATE_CARDS.premium;
  if (normalized.includes("parcel")) return AUTHORITATIVE_RATE_CARDS.parcel;

  throw new PricingError(
    `Unsupported vehicle category "${vehicleTypeInput}". Approved categories: Bike, Auto, Cab Economy, Cab Premium, Cab Large, Parcel Express.`,
    "UNSUPPORTED_VEHICLE",
    400
  );
}

/**
 * Validates geo coordinates [latitude, longitude]
 */
export function validateCoordinates(coords: unknown, label = "location"): [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) {
    throw new PricingError(
      `Invalid coordinates for ${label}. Expected [latitude, longitude].`,
      "INVALID_COORDINATES",
      400
    );
  }

  const [lat, lng] = coords;
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
    throw new PricingError(
      `Coordinates out of range for ${label}. Latitude must be between -90 and 90, Longitude between -180 and 180.`,
      "INVALID_COORDINATES",
      400
    );
  }

  return [lat, lng];
}

/**
 * Calculates geodesic (great-circle) distance in kilometers between two coordinates
 */
export function calculateGeodesicDistanceKm(
  p1: [number, number],
  p2: [number, number]
): number {
  const [lat1, lon1] = p1;
  const [lat2, lon2] = p2;

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface PricingCalculationInput {
  pickupCoordinates: [number, number];
  dropoffCoordinates: [number, number];
  vehicleType: string;
  petFriendly?: boolean;
  claimedDistanceKm?: number | null;
}

export interface AuthoritativeFareResult {
  fareInPaise: number;
  fareInRupees: number;
  distanceKm: number;
  durationMins: number;
  rateCard: VehicleRateCard;
  pricingSnapshot: {
    baseFarePaise: number;
    distanceKm: number;
    distanceFarePaise: number;
    petFriendlySurchargePaise: number;
    totalFarePaise: number;
    currency: "INR";
    rateRuleVersion: string;
    calculatedAt: Date;
  };
}

/**
 * Authoritatively calculates server fare for a ride
 */
export function calculateAuthoritativeFare(
  input: PricingCalculationInput
): AuthoritativeFareResult {
  const pickup = validateCoordinates(input.pickupCoordinates, "pickup");
  const dropoff = validateCoordinates(input.dropoffCoordinates, "dropoff");

  const geodesicKm = calculateGeodesicDistanceKm(pickup, dropoff);

  // Reject zero or negligible distance (same point)
  if (geodesicKm < 0.05) {
    throw new PricingError(
      "Pickup and drop-off locations are too close or identical.",
      "IDENTICAL_LOCATIONS",
      400
    );
  }

  // Authoritative road distance determination:
  // Standard urban India road tortuosity is ~1.30.
  // If client submits a claimed distance, verify it cannot be physically less than line-of-sight geodesic.
  let authoritativeDistanceKm: number;
  const defaultEstimatedKm = Math.max(1.0, Math.round(geodesicKm * 1.30 * 10) / 10);

  if (
    typeof input.claimedDistanceKm === "number" &&
    Number.isFinite(input.claimedDistanceKm) &&
    input.claimedDistanceKm > 0
  ) {
    // Road distance can never be less than geodesic (0.95 tolerance for slight GPS rounding)
    if (input.claimedDistanceKm < geodesicKm * 0.95) {
      throw new PricingError(
        "Submitted distance violates geodesic road lower bound.",
        "INVALID_DISTANCE_MANIPULATION",
        400
      );
    }
    // Cannot be absurdly large (> 5x geodesic or > 1000 km for intra-city rides)
    if (input.claimedDistanceKm > Math.max(geodesicKm * 3.5, 50) || input.claimedDistanceKm > 1000) {
      throw new PricingError(
        "Submitted distance is outside plausible route bounds.",
        "EXCESSIVE_DISTANCE",
        400
      );
    }
    authoritativeDistanceKm = Math.round(input.claimedDistanceKm * 10) / 10;
  } else {
    authoritativeDistanceKm = defaultEstimatedKm;
  }

  const rateCard = resolveRateCard(input.vehicleType);

  // Monetary calculations in integer paise
  const baseFarePaise = rateCard.baseRatePaise;
  const distanceFarePaise = Math.round(authoritativeDistanceKm * rateCard.perKmPaise);
  const subtotalPaise = baseFarePaise + distanceFarePaise;

  // Pet friendly surcharge: +15%
  const petFriendlySurchargePaise = input.petFriendly
    ? Math.round(subtotalPaise * 0.15)
    : 0;

  const totalFarePaise = subtotalPaise + petFriendlySurchargePaise;
  const fareInRupees = Math.round(totalFarePaise / 100);

  // Authoritative ETA in minutes based on distance
  const estimatedDurationMins = Math.max(
    5,
    Math.round(authoritativeDistanceKm * 2.5)
  );

  return {
    fareInPaise: totalFarePaise,
    fareInRupees,
    distanceKm: authoritativeDistanceKm,
    durationMins: estimatedDurationMins,
    rateCard,
    pricingSnapshot: {
      baseFarePaise,
      distanceKm: authoritativeDistanceKm,
      distanceFarePaise,
      petFriendlySurchargePaise,
      totalFarePaise,
      currency: "INR",
      rateRuleVersion: PRICING_RULE_VERSION,
      calculatedAt: new Date(),
    },
  };
}

/**
 * Converts rupee amount to integer paise, with validation
 */
export function rupeesToPaise(rupees: unknown): number {
  if (typeof rupees !== "number" || !Number.isFinite(rupees) || isNaN(rupees)) {
    throw new PricingError("Monetary amount must be a finite number", "INVALID_AMOUNT", 400);
  }
  if (rupees < 0) {
    throw new PricingError("Monetary amount cannot be negative", "NEGATIVE_AMOUNT", 400);
  }
  const paise = Math.round(rupees * 100);
  if (!Number.isSafeInteger(paise)) {
    throw new PricingError("Monetary amount exceeds safe integer range", "UNSAFE_INTEGER", 400);
  }
  return paise;
}

/**
 * Converts integer paise to rupees
 */
export function paiseToRupees(paise: unknown): number {
  if (typeof paise !== "number" || !Number.isInteger(paise)) {
    throw new PricingError("Paise amount must be an integer", "INVALID_PAISE", 400);
  }
  if (paise < 0) {
    throw new PricingError("Paise amount cannot be negative", "NEGATIVE_AMOUNT", 400);
  }
  return Number((paise / 100).toFixed(2));
}
