import { create } from "zustand";

export type DriverDutyState = "OFFLINE" | "ONLINE_SEARCHING" | "DISPATCH_ALERT" | "ON_TRIP";

export interface IDriverDispatch {
  _id: string;
  riderName: string;
  riderPhone: string;
  riderRating: number;
  riderAvatar?: string | null;
  pickup: {
    address: string;
    coordinates: [number, number];
    distanceText: string;
    etaMinutes: number;
  };
  dropoff: {
    address: string;
    coordinates: [number, number];
    distanceText: string;
    estDurationMinutes: number;
  };
  fare: number;
  surgeMultiplier: number;
  vehicleType: string;
  paymentMethod: "CASH" | "UPI" | "WALLET";
  expiresAt: number; // timestamp
}

export interface IDriverActiveRide {
  _id: string;
  rider: {
    id?: string;
    name: string;
    phone: string;
    rating: number;
    avatar?: string | null;
  };
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
  distance: string;
  duration: string;
  status: "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  otp: string;
  paymentMethod: "WALLET" | "CASH" | "UPI";
  paymentStatus: "PENDING" | "PAID";
  messages: Array<{ sender: "rider" | "driver"; text: string; timestamp: string }>;
  acceptedAt?: string;
}

export interface IDriverStats {
  todayEarnings: number;
  weeklyEarnings: number;
  tripsCompleted: number;
  onlineMinutes: number;
  acceptanceRate: number;
  rating: number;
  targetTrips: number;
  targetBonus: number;
}

export interface IDriverVehicle {
  model: string;
  numberPlate: string;
  type: string;
  fuelType: "EV" | "PETROL" | "CNG" | "DIESEL";
  batteryOrFuelLevel: number;
  documentsVerified: boolean;
  insuranceValidUntil: string;
}

export interface ISurgeArea {
  id: string;
  name: string;
  multiplier: number;
  coordinates: [number, number];
  radius: number; // meters
}

export interface IDriverTripHistoryItem {
  id?: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  tip: number;
  distance: string;
  time: string;
  vehicleType: string;
  paymentMethod: string;
}

interface DriverState {
  isOnline: boolean;
  dutyState: DriverDutyState;
  isSidebarCollapsed: boolean;
  loading: boolean;
  
  driverProfile: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    avatar: string | null;
    walletBalance: number;
    role: string;
  } | null;

  incomingDispatch: IDriverDispatch | null;
  activeRide: IDriverActiveRide | null;
  recentTrips: IDriverTripHistoryItem[];
  stats: IDriverStats;
  vehicle: IDriverVehicle;
  surgeAreas: ISurgeArea[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  fetchDriverData: () => Promise<void>;
  toggleOnline: () => void;
  setOnline: (online: boolean) => void;
  acceptDispatch: () => Promise<boolean>;
  declineDispatch: () => void;
  markArrived: () => Promise<void>;
  verifyOtp: (enteredOtp: string) => Promise<boolean>;
  completeTrip: (rating?: number) => Promise<void>;
  cancelTrip: (reason: string) => Promise<void>;
  simulateIncomingRide: () => void;
  sendMessage: (text: string) => Promise<void>;
}

// Sample surge hot spots in Delhi NCR
const DEFAULT_SURGE_AREAS: ISurgeArea[] = [
  { id: "surge-1", name: "Cyber City & DLF Hub", multiplier: 1.6, coordinates: [28.4900, 77.0900], radius: 1800 },
  { id: "surge-2", name: "Sector 62 IT Tech Zone", multiplier: 1.4, coordinates: [28.6250, 77.3750], radius: 1500 },
  { id: "surge-3", name: "Airport Terminal 3 Gate", multiplier: 1.9, coordinates: [28.5562, 77.1000], radius: 2200 },
  { id: "surge-4", name: "Connaught Place Central", multiplier: 1.3, coordinates: [28.6315, 77.2167], radius: 1200 },
];

export const useDriverStore = create<DriverState>((set, get) => ({
  isOnline: true,
  dutyState: "ONLINE_SEARCHING",
  isSidebarCollapsed: false,
  loading: false,

  driverProfile: {
    id: "driver-101",
    name: "Rajesh Kumar",
    email: "rajesh.driver@bhavo.in",
    phone: "+91 98765 43210",
    rating: 4.94,
    avatar: null,
    walletBalance: 4250,
    role: "DRIVER",
  },

  incomingDispatch: null,
  activeRide: null,
  recentTrips: [
    {
      id: "ride-hist-1",
      riderName: "Aarav Sharma",
      pickup: "Sector 18 Metro Station",
      dropoff: "Bhavo Tech Park, Sector 62",
      fare: 280,
      tip: 30,
      distance: "7.2 km",
      time: "45 mins ago",
      vehicleType: "Cab Premium",
      paymentMethod: "UPI",
    },
    {
      id: "ride-hist-2",
      riderName: "Meera Sen",
      pickup: "Indirapuram Habitat Center",
      dropoff: "Noida Electronic City",
      fare: 195,
      tip: 0,
      distance: "4.8 km",
      time: "2 hours ago",
      vehicleType: "Cab Economy",
      paymentMethod: "WALLET",
    },
    {
      id: "ride-hist-3",
      riderName: "Vikram Malhotra",
      pickup: "Botanical Garden Gate 2",
      dropoff: "DLF Mall of India",
      fare: 140,
      tip: 20,
      distance: "3.1 km",
      time: "3.5 hours ago",
      vehicleType: "Auto",
      paymentMethod: "CASH",
    },
  ],

  stats: {
    todayEarnings: 1865,
    weeklyEarnings: 14280,
    tripsCompleted: 7,
    onlineMinutes: 325, // 5h 25m
    acceptanceRate: 96,
    rating: 4.94,
    targetTrips: 10,
    targetBonus: 350,
  },

  vehicle: {
    model: "Tata Tigor EV (White)",
    numberPlate: "DL-01-EV-4429",
    type: "Cab Premium (EV)",
    fuelType: "EV",
    batteryOrFuelLevel: 82,
    documentsVerified: true,
    insuranceValidUntil: "18 Dec 2027",
  },

  surgeAreas: DEFAULT_SURGE_AREAS,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),

  fetchDriverData: async () => {
    try {
      set({ loading: true });
      const res = await fetch("/api/driver/dashboard");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const { profile, stats, activeRide, recentTrips, vehicle } = json.data;
          set((prev) => ({
            driverProfile: profile || prev.driverProfile,
            stats: stats || prev.stats,
            activeRide: activeRide || prev.activeRide,
            recentTrips: recentTrips || prev.recentTrips,
            vehicle: vehicle || prev.vehicle,
            dutyState: activeRide ? "ON_TRIP" : prev.isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
            loading: false,
          }));
          return;
        }
      }
      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },

  toggleOnline: () => {
    const current = get().isOnline;
    const nextOnline = !current;
    set({
      isOnline: nextOnline,
      incomingDispatch: nextOnline ? get().incomingDispatch : null,
      dutyState: get().activeRide
        ? "ON_TRIP"
        : nextOnline
        ? "ONLINE_SEARCHING"
        : "OFFLINE",
    });
  },

  setOnline: (online: boolean) => {
    set({
      isOnline: online,
      incomingDispatch: online ? get().incomingDispatch : null,
      dutyState: get().activeRide
        ? "ON_TRIP"
        : online
        ? "ONLINE_SEARCHING"
        : "OFFLINE",
    });
  },

  acceptDispatch: async () => {
    const dispatch = get().incomingDispatch;
    if (!dispatch) return false;

    // Transition to Active Ride
    const newActiveRide: IDriverActiveRide = {
      _id: dispatch._id || `ride-${Date.now()}`,
      rider: {
        name: dispatch.riderName,
        phone: dispatch.riderPhone,
        rating: dispatch.riderRating,
        avatar: dispatch.riderAvatar,
      },
      pickup: {
        address: dispatch.pickup.address,
        coordinates: dispatch.pickup.coordinates,
      },
      dropoff: {
        address: dispatch.dropoff.address,
        coordinates: dispatch.dropoff.coordinates,
      },
      vehicleType: dispatch.vehicleType,
      fare: dispatch.fare,
      distance: dispatch.dropoff.distanceText,
      duration: `${dispatch.dropoff.estDurationMinutes} mins`,
      status: "ACCEPTED",
      otp: "4826", // Realistic OTP to match
      paymentMethod: dispatch.paymentMethod,
      paymentStatus: "PENDING",
      messages: [
        {
          sender: "rider",
          text: "Hi! I am waiting near the main security gate.",
          timestamp: new Date().toISOString(),
        },
      ],
      acceptedAt: new Date().toISOString(),
    };

    set({
      incomingDispatch: null,
      activeRide: newActiveRide,
      dutyState: "ON_TRIP",
    });

    // Notify backend if API is connected
    try {
      await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT", rideId: newActiveRide._id }),
      });
    } catch {
      // Offline fallback state already preserved
    }

    return true;
  },

  declineDispatch: () => {
    set({
      incomingDispatch: null,
      dutyState: get().isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
    });
  },

  markArrived: async () => {
    const active = get().activeRide;
    if (!active) return;

    set({
      activeRide: {
        ...active,
        status: "ARRIVED",
      },
    });

    try {
      await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ARRIVED", rideId: active._id }),
      });
    } catch {}
  },

  verifyOtp: async (enteredOtp: string) => {
    const active = get().activeRide;
    if (!active) return false;

    // Check OTP match (allow 4826, 1234 or any matching real ride OTP)
    if (enteredOtp.trim() === active.otp || enteredOtp.trim() === "1234" || enteredOtp.trim() === "4826") {
      set({
        activeRide: {
          ...active,
          status: "IN_PROGRESS",
        },
      });

      try {
        await fetch("/api/driver/rides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "START", rideId: active._id, otp: enteredOtp }),
        });
      } catch {}

      return true;
    }
    return false;
  },

  completeTrip: async (rating = 5) => {
    const active = get().activeRide;
    if (!active) return;

    const completedFare = active.fare;

    // Add to recent trips
    const newRecent = {
      id: active._id,
      riderName: active.rider.name,
      pickup: active.pickup.address,
      dropoff: active.dropoff.address,
      fare: completedFare,
      tip: 25,
      distance: active.distance,
      time: "Just now",
      vehicleType: active.vehicleType,
      paymentMethod: active.paymentMethod,
    };

    set((state) => ({
      activeRide: null,
      dutyState: state.isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
      recentTrips: [newRecent, ...state.recentTrips],
      stats: {
        ...state.stats,
        todayEarnings: state.stats.todayEarnings + completedFare + 25,
        weeklyEarnings: state.stats.weeklyEarnings + completedFare + 25,
        tripsCompleted: state.stats.tripsCompleted + 1,
      },
    }));

    try {
      await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE",
          rideId: active._id,
          riderRating: rating,
        }),
      });
    } catch {}
  },

  cancelTrip: async (reason: string) => {
    const active = get().activeRide;
    if (!active) return;

    set((state) => ({
      activeRide: null,
      dutyState: state.isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
    }));

    try {
      await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL", rideId: active._id, reason }),
      });
    } catch {}
  },

  simulateIncomingRide: () => {
    const riders = [
      { name: "Ananya Iyer", phone: "+91 98201 55670", rating: 4.96 },
      { name: "Rohan Varma", phone: "+91 98711 22345", rating: 4.88 },
      { name: "Dr. Sunita Rao", phone: "+91 98100 88990", rating: 5.0 },
      { name: "Kunal Mehra", phone: "+91 99580 12399", rating: 4.92 },
    ];
    const rider = riders[Math.floor(Math.random() * riders.length)];

    const simulated: IDriverDispatch = {
      _id: `ride-${Date.now()}`,
      riderName: rider.name,
      riderPhone: rider.phone,
      riderRating: rider.rating,
      pickup: {
        address: "Max Hospital Gate 1, Sector 19, Noida",
        coordinates: [28.5823, 77.3274],
        distanceText: "1.2 km away",
        etaMinutes: 3,
      },
      dropoff: {
        address: "DLF Cyber City, Building 10, Gurugram",
        coordinates: [28.4905, 77.0912],
        distanceText: "18.4 km",
        estDurationMinutes: 34,
      },
      fare: Math.floor(360 + Math.random() * 120),
      surgeMultiplier: 1.4,
      vehicleType: "Cab Premium",
      paymentMethod: "UPI",
      expiresAt: Date.now() + 16000,
    };

    set({
      incomingDispatch: simulated,
      dutyState: "DISPATCH_ALERT",
    });
  },

  sendMessage: async (text: string) => {
    const active = get().activeRide;
    if (!active || !text.trim()) return;

    const newMsg = {
      sender: "driver" as const,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    set({
      activeRide: {
        ...active,
        messages: [...(active.messages || []), newMsg],
      },
    });

    try {
      await fetch(`/api/driver/rides/${active._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch {}
  },
}));
