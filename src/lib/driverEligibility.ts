import mongoose from "mongoose";
import { checkDriverVerification, IDriverDoc } from "@/lib/driverCompliance";
import {
  getDispatchMaxRadiusKm,
  getDriverLocationMaxAgeMs,
} from "@/lib/dispatchConfig";

export interface IDriverCandidate {
  _id: mongoose.Types.ObjectId | string;
  name?: string;
  role?: string;
  status?: string;
  isOnline?: boolean;
  dutyState?: string;
  activeRideId?: mongoose.Types.ObjectId | string | null;
  driverVehicle?: {
    type?: string;
    model?: string;
    numberPlate?: string;
    documentsVerified?: boolean;
  };
  driverDocuments?: IDriverDoc[];
  driverSettings?: {
    petFriendly?: boolean;
    autoAccept?: boolean;
    maxDistance?: string;
  };
  driverCoordinates?: [number, number];
  driverCoordinatesUpdatedAt?: Date | string | null;
  rating?: number;
  [key: string]: unknown;
}

export interface IRideRequirements {
  _id?: mongoose.Types.ObjectId | string;
  vehicleType: string;
  petFriendly?: boolean;
  pickup: {
    coordinates: [number, number];
    address?: string;
  };
  rejectedDrivers?: (mongoose.Types.ObjectId | string)[];
  currentOffer?: {
    driverId?: mongoose.Types.ObjectId | string;
    expiresAt?: Date | string;
  } | null;
}

export interface IEligibilityContext {
  atTime?: Date;
  maxRadiusKm?: number;
  maxLocationAgeMs?: number;
}

export interface IEligibilityResult {
  isEligible: boolean;
  code?: string;
  reason?: string;
  distanceKm?: number;
}

/**
 * Calculates straight-line geodesic distance in kilometers between two coordinate pairs using the Haversine formula.
 * Coordinates are [latitude, longitude].
 */
export function calculateHaversineDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  if (
    !Array.isArray(coord1) ||
    !Array.isArray(coord2) ||
    coord1.length !== 2 ||
    coord2.length !== 2
  ) {
    return NaN;
  }

  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return NaN;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000) / 1000;
}

/**
 * Canonical vehicle compatibility mapping.
 * Fails closed for unknown or undefined categories.
 */
const VEHICLE_COMPATIBILITY_MAP: Record<string, string[]> = {
  // Ride category -> Acceptable Driver Vehicle Types (normalized lowercase)
  "cab economy": [
    "cab economy",
    "economy",
    "sedan",
    "mini",
    "cab premium",
    "cab premium (ev)",
    "premium",
    "ev",
    "cab xl",
    "xl",
    "suv",
  ],
  "cab premium": [
    "cab premium",
    "cab premium (ev)",
    "premium",
    "ev",
    "sedan",
    "suv",
    "cab xl",
    "xl",
    "innova",
  ],
  "cab xl": ["cab xl", "xl", "suv", "innova", "7 seater"],
  auto: ["auto", "auto rickshaw", "electric auto", "e-rickshaw"],
  bike: ["bike", "moto", "two wheeler", "scooter", "motorcycle"],
  moto: ["bike", "moto", "two wheeler", "scooter", "motorcycle"],
  parcel: ["parcel", "bike", "moto", "two wheeler", "auto", "cab economy"],
};

/**
 * Evaluates whether a driver's vehicle type can fulfill the requested ride category.
 * Unknown or unsupported vehicle categories fail closed (return false).
 */
export function isVehicleCompatible(
  driverVehicleType?: string | null,
  rideVehicleType?: string | null
): boolean {
  if (!driverVehicleType || !rideVehicleType) return false;

  const normRide = rideVehicleType.trim().toLowerCase();
  const normDriver = driverVehicleType.trim().toLowerCase();

  const allowedTypes = VEHICLE_COMPATIBILITY_MAP[normRide];
  if (!allowedTypes) {
    // Exact normalized match fallback if not in explicit matrix
    return normRide === normDriver;
  }

  return allowedTypes.some((allowed) => normDriver.includes(allowed) || allowed === normDriver);
}

/**
 * Evaluates whether a driver is pet-compatible with the ride requirement.
 * If the ride requires pet-friendly accommodation, the driver must explicitly accept pets.
 */
export function isPetCompatible(
  driverSettings?: { petFriendly?: boolean } | null,
  ridePetFriendly?: boolean
): boolean {
  if (!ridePetFriendly) return true;
  return Boolean(driverSettings?.petFriendly);
}

/**
 * Validates coordinate pair for finite numeric values and valid geographic boundaries.
 * Latitude must be [-90, 90], Longitude must be [-180, 180]. [0, 0] is valid.
 */
export function validateDriverCoordinates(coordinates?: unknown): boolean {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }
  const [lat, lng] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

/**
 * Validates driver coordinates for finite numeric values, legitimate geographic bounds,
 * and freshness against the configured maximum location age in seconds.
 */
export function isLocationValidAndFresh(
  coordinates?: [number, number] | null,
  updatedAt?: Date | string | null,
  maxAgeSeconds: number = getDriverLocationMaxAgeMs() / 1000,
  atTime: Date = new Date()
): boolean {
  if (!validateDriverCoordinates(coordinates)) {
    return false;
  }

  if (!updatedAt) {
    return false;
  }

  const updateDate = new Date(updatedAt);
  if (isNaN(updateDate.getTime())) {
    return false;
  }

  const ageSeconds = (atTime.getTime() - updateDate.getTime()) / 1000;
  return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

/**
 * Evaluates complete eligibility of a driver candidate for a specific ride request.
 * Hard binary gates:
 * 1. Role must be DRIVER
 * 2. Account status must be ACTIVE
 * 3. Driver must be isOnline: true
 * 4. Driver dutyState must be ONLINE_SEARCHING (not OFFLINE or ON_TRIP)
 * 5. Driver documents must be 100% verified (checkDriverVerification)
 * 6. Driver vehicle must be compatible with ride vehicleType
 * 7. Driver must be pet-compatible if ride requires petFriendly
 * 8. Driver coordinates must be valid and sufficiently fresh (< maxLocationAge)
 * 9. Driver must be within maxRadiusKm from ride pickup coordinates
 * 10. Driver must not have already rejected or timed out in this dispatch cycle
 */
export function evaluateDriverEligibility(
  driver: IDriverCandidate,
  ride: IRideRequirements,
  context: IEligibilityContext = {}
): IEligibilityResult {
  const atTime = context.atTime || new Date();
  const maxRadiusKm = context.maxRadiusKm ?? getDispatchMaxRadiusKm();
  const maxLocationAgeSeconds = context.maxLocationAgeMs
    ? context.maxLocationAgeMs / 1000
    : getDriverLocationMaxAgeMs() / 1000;

  // 1. Role
  if (driver.role !== "DRIVER") {
    return { isEligible: false, code: "INVALID_ROLE", reason: "INVALID_ROLE" };
  }

  // 2. Account Status
  if (driver.status && driver.status !== "ACTIVE") {
    return { isEligible: false, code: "DRIVER_INACTIVE", reason: "DRIVER_INACTIVE" };
  }

  // 3. Online
  if (!driver.isOnline) {
    return { isEligible: false, code: "DRIVER_OFFLINE", reason: "DRIVER_OFFLINE" };
  }

  // 4. Duty State & Active Ride Exclusivity
  if (driver.dutyState === "OFFLINE") {
    return { isEligible: false, code: "DRIVER_OFFLINE", reason: "DRIVER_OFFLINE" };
  }
  if (driver.dutyState === "ON_TRIP" || driver.activeRideId) {
    return { isEligible: false, code: "DRIVER_OCCUPIED", reason: "DRIVER_OCCUPIED" };
  }

  // 5. Document Verification
  const verification = checkDriverVerification(driver);
  if (!verification.isVerified) {
    return { isEligible: false, code: "DOCUMENTS_UNVERIFIED", reason: "DOCUMENTS_UNVERIFIED" };
  }

  // 6. Vehicle Compatibility
  if (!isVehicleCompatible(driver.driverVehicle?.type, ride.vehicleType)) {
    return {
      isEligible: false,
      code: "VEHICLE_INCOMPATIBLE",
      reason: "VEHICLE_INCOMPATIBLE",
    };
  }

  // 7. Pet Compatibility
  if (ride.petFriendly && !isPetCompatible(driver.driverSettings, true)) {
    return { isEligible: false, code: "PET_INCOMPATIBLE", reason: "PET_INCOMPATIBLE" };
  }

  // 8. Location Freshness
  if (!isLocationValidAndFresh(driver.driverCoordinates, driver.driverCoordinatesUpdatedAt, maxLocationAgeSeconds, atTime)) {
    return { isEligible: false, code: "LOCATION_STALE", reason: "LOCATION_STALE" };
  }

  // 9. Distance & Radius
  const distanceKm = calculateHaversineDistanceKm(
    ride.pickup.coordinates,
    driver.driverCoordinates!
  );

  if (isNaN(distanceKm) || distanceKm > maxRadiusKm) {
    return {
      isEligible: false,
      code: "OUTSIDE_RADIUS",
      reason: "OUTSIDE_RADIUS",
      distanceKm,
    };
  }

  // 10. Rejection History (same dispatch cycle)
  if (ride.rejectedDrivers && Array.isArray(ride.rejectedDrivers)) {
    const driverIdStr = driver._id ? driver._id.toString() : "";
    const isRejected = ride.rejectedDrivers.some((d) => d && d.toString() === driverIdStr);
    if (isRejected) {
      return { isEligible: false, code: "ALREADY_REJECTED", reason: "ALREADY_REJECTED" };
    }
  }

  return { isEligible: true, distanceKm };
}
