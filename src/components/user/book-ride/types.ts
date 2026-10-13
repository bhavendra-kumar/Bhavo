export const BASE_VEHICLES = [
  { id: "bike", name: "Bike", desc: "Beat the city traffic fast", baseRate: 40, perKm: 12, capacity: 1, type: "bike", rating: 4.8 },
  { id: "auto", name: "Auto", desc: "Everyday doorstep rides", baseRate: 50, perKm: 16, capacity: 3, type: "auto", rating: 4.6 },
  { id: "economy", name: "Cab Economy", desc: "Affordable, air-conditioned compacts", baseRate: 80, perKm: 22, capacity: 4, type: "economy", rating: 4.7 },
  { id: "premium", name: "Cab Premium", desc: "Top-rated sedans, extra legroom", baseRate: 120, perKm: 32, capacity: 4, type: "premium", rating: 4.9 },
  { id: "large", name: "Cab Large", desc: "Spacious 6-seater for group travel", baseRate: 160, perKm: 42, capacity: 6, type: "large", rating: 4.8 },
  { id: "parcel", name: "Parcel Express", desc: "Instant package delivery door-to-door", baseRate: 35, perKm: 10, capacity: 1, type: "parcel", rating: 4.9 },
];

export interface SavedPlace {
  _id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  tag: string;
}

export interface ActiveRide {
  _id: string;
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  pickup: { address: string; coordinates: [number, number] };
  dropoff: { address: string; coordinates: [number, number] };
  vehicleType: string;
  fare: number;
  distance: string;
  duration: string;
  otp: string;
  paymentMethod?: "WALLET" | "CASH" | "UPI";
  paymentStatus?: "PENDING" | "PAID";
  driverCoordinates?: [number, number];
  locationStatus?: "FRESH" | "STALE" | "UNAVAILABLE" | "TERMINAL";
  isLocationFresh?: boolean;
  locationAgeSeconds?: number | null;
  trackingVersion?: number;
  driverCoordinatesUpdatedAt?: string | null;
  driverDetails?: {
    name: string;
    phone: string;
    rating: number;
    vehicleNumber: string;
    vehicleModel: string;
  };
}

export interface DynamicVehicle {
  id: string;
  name: string;
  desc: string;
  baseRate: number;
  perKm: number;
  capacity: number;
  type: string;
  rating: number;
  price: string;
  numericPrice?: number;
  rawFare?: number;
  eta: string;
}
