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

  const R = 6371;
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

const VEHICLE_COMPATIBILITY_MAP: Record<string, string[]> = {
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

export function isVehicleCompatible(
  driverVehicleType?: string | null,
  rideVehicleType?: string | null
): boolean {
  if (!driverVehicleType || !rideVehicleType) return false;

  const normRide = rideVehicleType.trim().toLowerCase();
  const normDriver = driverVehicleType.trim().toLowerCase();

  const allowedTypes = VEHICLE_COMPATIBILITY_MAP[normRide];
  if (!allowedTypes) {
    return normRide === normDriver;
  }

  return allowedTypes.some((allowed) => normDriver.includes(allowed) || allowed === normDriver);
}

export function isPetCompatible(
  driverSettings?: { petFriendly?: boolean } | null,
  ridePetFriendly?: boolean
): boolean {
  if (!ridePetFriendly) return true;
  return Boolean(driverSettings?.petFriendly);
}

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

  if (driver.role !== "DRIVER") {
    return { isEligible: false, code: "INVALID_ROLE", reason: "INVALID_ROLE" };
  }

  if (driver.status && driver.status !== "ACTIVE") {
    return { isEligible: false, code: "DRIVER_INACTIVE", reason: "DRIVER_INACTIVE" };
  }

  if (!driver.isOnline) {
    return { isEligible: false, code: "DRIVER_OFFLINE", reason: "DRIVER_OFFLINE" };
  }

  if (driver.dutyState === "OFFLINE") {
    return { isEligible: false, code: "DRIVER_OFFLINE", reason: "DRIVER_OFFLINE" };
  }
  if (driver.dutyState === "ON_TRIP" || driver.activeRideId) {
    return { isEligible: false, code: "DRIVER_OCCUPIED", reason: "DRIVER_OCCUPIED" };
  }

  const verification = checkDriverVerification(driver);
  if (!verification.isVerified) {
    return { isEligible: false, code: "DOCUMENTS_UNVERIFIED", reason: "DOCUMENTS_UNVERIFIED" };
  }

  if (!isVehicleCompatible(driver.driverVehicle?.type, ride.vehicleType)) {
    return {
      isEligible: false,
      code: "VEHICLE_INCOMPATIBLE",
      reason: "VEHICLE_INCOMPATIBLE",
    };
  }

  if (ride.petFriendly && !isPetCompatible(driver.driverSettings, true)) {
    return { isEligible: false, code: "PET_INCOMPATIBLE", reason: "PET_INCOMPATIBLE" };
  }

  if (!isLocationValidAndFresh(driver.driverCoordinates, driver.driverCoordinatesUpdatedAt, maxLocationAgeSeconds, atTime)) {
    return { isEligible: false, code: "LOCATION_STALE", reason: "LOCATION_STALE" };
  }

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

  if (ride.rejectedDrivers && Array.isArray(ride.rejectedDrivers)) {
    const driverIdStr = driver._id ? driver._id.toString() : "";
    const isRejected = ride.rejectedDrivers.some((d) => d && d.toString() === driverIdStr);
    if (isRejected) {
      return { isEligible: false, code: "ALREADY_REJECTED", reason: "ALREADY_REJECTED" };
    }
  }

  return { isEligible: true, distanceKm };
}
