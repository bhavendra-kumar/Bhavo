
import { IRide } from "@/models/Ride";
import { DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS } from "@/lib/dispatchConfig";
import { validateDriverCoordinates } from "@/lib/driverEligibility";

export type LocationFreshnessStatus = "FRESH" | "STALE" | "UNAVAILABLE" | "TERMINAL";

export interface ILocationFreshnessResult {
  status: LocationFreshnessStatus;
  isFresh: boolean;
  ageSeconds: number | null;
}

export interface ITrackingSnapshot {
  rideId: string;
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  pickup: {
    address: string;
    coordinates: [number, number];
    landmark?: string;
  };
  dropoff: {
    address: string;
    coordinates: [number, number];
    landmark?: string;
  };
  vehicleType: string;
  fare: number;
  fareInPaise?: number;
  distance: string;
  duration: string;
  paymentMethod: string;
  paymentStatus: string;
  driverDetails: {
    name: string | null;
    phone: string | null;
    rating: number;
    vehicleNumber: string | null;
    vehicleModel: string | null;
    avatar?: string | null;
  } | null;
  driverCoordinates: [number, number] | null;
  driverCoordinatesUpdatedAt: string | null;
  locationStatus: LocationFreshnessStatus;
  isLocationFresh: boolean;
  locationAgeSeconds: number | null;
  otp?: string;
  trackingVersion: number;
  updatedAt: string;
  isTerminal: boolean;
  snapshotAt: string;
}

export function isRideTerminal(status: string): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

export function evaluateLocationFreshness(
  coordinates?: [number, number] | null,
  updatedAt?: Date | string | null,
  optionsOrMaxAge: number | string | { maxAgeSeconds?: number; rideStatus?: string } = DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS,
  atTime = new Date()
): ILocationFreshnessResult {
  let maxAgeSeconds = DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS;
  let rideStatus: string | undefined;

  if (typeof optionsOrMaxAge === "number") {
    maxAgeSeconds = optionsOrMaxAge;
  } else if (typeof optionsOrMaxAge === "string") {
    rideStatus = optionsOrMaxAge;
  } else if (typeof optionsOrMaxAge === "object" && optionsOrMaxAge !== null) {
    maxAgeSeconds = optionsOrMaxAge.maxAgeSeconds ?? DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS;
    rideStatus = optionsOrMaxAge.rideStatus;
  }

  if (rideStatus && isRideTerminal(rideStatus)) {
    return { status: "TERMINAL", isFresh: false, ageSeconds: null };
  }

  if (!coordinates || !validateDriverCoordinates(coordinates)) {
    return { status: "UNAVAILABLE", isFresh: false, ageSeconds: null };
  }

  if (!updatedAt) {
    return { status: "UNAVAILABLE", isFresh: false, ageSeconds: null };
  }

  const updateDate = new Date(updatedAt);
  if (isNaN(updateDate.getTime())) {
    return { status: "UNAVAILABLE", isFresh: false, ageSeconds: null };
  }

  const ageSeconds = Math.max(0, Math.round((atTime.getTime() - updateDate.getTime()) / 1000));

  if (ageSeconds <= maxAgeSeconds) {
    return { status: "FRESH", isFresh: true, ageSeconds };
  }

  return { status: "STALE", isFresh: false, ageSeconds };
}

export function formatTrackingSnapshot(
  ride: IRide,
  viewerRole: "RIDER" | "DRIVER",
  atTime = new Date()
): ITrackingSnapshot {
  const terminal = isRideTerminal(ride.status);

  let freshness: ILocationFreshnessResult;
  if (terminal) {
    freshness = { status: "TERMINAL", isFresh: false, ageSeconds: null };
  } else if (!ride.driver || !["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(ride.status)) {
    freshness = { status: "UNAVAILABLE", isFresh: false, ageSeconds: null };
  } else {
    freshness = evaluateLocationFreshness(
      ride.driverCoordinates,
      ride.driverCoordinatesUpdatedAt,
      DEFAULT_DRIVER_LOCATION_MAX_AGE_SECONDS,
      atTime
    );
  }

  const driverDetails =
    ride.driver && ride.driverDetails
      ? {
          name: ride.driverDetails.name || null,
          phone: ride.driverDetails.phone || null,
          rating: ride.driverDetails.rating ?? 4.9,
          vehicleNumber: ride.driverDetails.vehicleNumber || null,
          vehicleModel: ride.driverDetails.vehicleModel || null,
          avatar: ride.driverDetails.avatar || null,
        }
      : null;

  const driverCoordinates =
    !terminal && ["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(ride.status)
      ? ride.driverCoordinates || null
      : null;

  const version = typeof ride.trackingVersion === "number" ? ride.trackingVersion : 1;

  const snapshot: ITrackingSnapshot = {
    rideId: ride._id ? ride._id.toString() : "",
    status: ride.status,
    pickup: {
      address: ride.pickup?.address || "",
      coordinates: ride.pickup?.coordinates || [28.6139, 77.209],
      landmark: ride.pickup?.landmark || "",
    },
    dropoff: {
      address: ride.dropoff?.address || "",
      coordinates: ride.dropoff?.coordinates || [28.5355, 77.391],
      landmark: ride.dropoff?.landmark || "",
    },
    vehicleType: ride.vehicleType || "Cab Premium",
    fare: ride.fare || 0,
    fareInPaise: ride.fareInPaise,
    distance: ride.distance || "0 km",
    duration: ride.duration || "0 mins",
    paymentMethod: ride.paymentMethod || "CASH",
    paymentStatus: ride.paymentStatus || "PENDING",
    driverDetails,
    driverCoordinates,
    driverCoordinatesUpdatedAt: ride.driverCoordinatesUpdatedAt
      ? new Date(ride.driverCoordinatesUpdatedAt).toISOString()
      : null,
    locationStatus: freshness.status,
    isLocationFresh: freshness.isFresh,
    locationAgeSeconds: freshness.ageSeconds,
    trackingVersion: version,
    updatedAt: ride.updatedAt ? new Date(ride.updatedAt).toISOString() : atTime.toISOString(),
    isTerminal: terminal,
    snapshotAt: atTime.toISOString(),
  };

  if (viewerRole === "RIDER" && ["ACCEPTED", "ARRIVED"].includes(ride.status) && ride.otp) {
    snapshot.otp = ride.otp;
  }

  return snapshot;
}

export function buildSseMessage(
  event: string,
  data: unknown,
  id?: string | number
): string {
  let msg = "";
  if (id !== undefined && id !== null) {
    msg += `id: ${id}\n`;
  }
  msg += `event: ${event}\n`;
  msg += `data: ${JSON.stringify(data)}\n\n`;
  return msg;
}

export function buildSseKeepalive(): string {
  return `: keepalive ${Date.now()}\n\n`;
}
