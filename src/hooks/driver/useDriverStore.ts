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
  otp?: string;
  offerId?: string;
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

export interface IDriverVerificationState {
  isVerified: boolean;
  driverDocsVerified: boolean;
  vehicleDocsVerified: boolean;
  pendingDocs: Array<{ name: string; category?: string; docId?: string; status?: string }>;
  rejectedDocs: Array<{ name: string; category?: string; docId?: string; status?: string }>;
  verifiedDocs: Array<{ name: string; category?: string; docId?: string; status?: string }>;
  totalDocs: number;
  verifiedCount: number;
  reason?: string;
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
  driverCoordinates: [number, number];
  
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

  verification: IDriverVerificationState;
  incomingDispatch: IDriverDispatch | null;
  activeRide: IDriverActiveRide | null;
  recentTrips: IDriverTripHistoryItem[];
  stats: IDriverStats;
  vehicle: IDriverVehicle;
  surgeAreas: ISurgeArea[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setVerification: (v: IDriverVerificationState) => void;
  fetchDriverData: () => Promise<void>;
  toggleOnline: (onBlocked?: (reason?: string) => void) => Promise<boolean>;
  setOnline: (online: boolean, onBlocked?: (reason?: string) => void) => Promise<boolean>;
  pollDispatches: () => Promise<void>;
  acceptDispatch: (onBlocked?: (reason?: string) => void) => Promise<boolean>;
  declineDispatch: () => void;
  markArrived: () => Promise<void>;
  verifyOtp: (enteredOtp: string) => Promise<boolean>;
  completeTrip: (rating?: number, compliments?: string[]) => Promise<void>;
  cancelTrip: (reason: string) => Promise<void>;
  simulateIncomingRide: (onBlocked?: (reason?: string) => void) => Promise<boolean>;
  sendMessage: (text: string) => Promise<void>;
  updateLocation: (coords: [number, number]) => Promise<void>;
}

// Surge hot spots in Delhi NCR
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
  driverCoordinates: [28.6139, 77.2090],

  driverProfile: null,

  verification: {
    isVerified: true,
    driverDocsVerified: true,
    vehicleDocsVerified: true,
    pendingDocs: [],
    rejectedDocs: [],
    verifiedDocs: [],
    totalDocs: 8,
    verifiedCount: 8,
  },

  incomingDispatch: null,
  activeRide: null,
  recentTrips: [],

  stats: {
    todayEarnings: 0,
    weeklyEarnings: 0,
    tripsCompleted: 0,
    onlineMinutes: 0,
    acceptanceRate: 100,
    rating: 5.0,
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
  setVerification: (verification: IDriverVerificationState) => set({ verification }),

  fetchDriverData: async () => {
    try {
      if (!get().driverProfile) {
        set({ loading: true });
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("/api/driver/dashboard", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const { profile, stats, activeRide, recentTrips, vehicle, surgeAreas, verification } = json.data;
          const currentVerification = verification || get().verification;
          const isVerified = currentVerification?.isVerified !== false;

          set((prev) => ({
            driverProfile: profile || prev.driverProfile,
            stats: stats || prev.stats,
            activeRide: activeRide !== undefined ? activeRide : prev.activeRide,
            recentTrips: recentTrips || prev.recentTrips,
            vehicle: vehicle || prev.vehicle,
            surgeAreas: surgeAreas || prev.surgeAreas,
            verification: currentVerification,
            isOnline: isVerified ? (profile?.isOnline ?? prev.isOnline) : false,
            dutyState: activeRide ? "ON_TRIP" : (isVerified && (profile?.isOnline ?? prev.isOnline)) ? "ONLINE_SEARCHING" : "OFFLINE",
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

  toggleOnline: async (onBlocked?: (reason?: string) => void) => {
    const current = get().isOnline;
    const nextOnline = !current;
    const { verification, activeRide } = get();

    // STRICT CHECK: Driver cannot go online if documents are unverified
    if (nextOnline && !verification.isVerified) {
      if (onBlocked) {
        onBlocked(
          verification.reason ||
          "All driver identity and vehicle compliance documents must be verified before going online."
        );
      }
      return false;
    }

    set({
      isOnline: nextOnline,
      incomingDispatch: nextOnline ? get().incomingDispatch : null,
      dutyState: activeRide
        ? "ON_TRIP"
        : nextOnline
        ? "ONLINE_SEARCHING"
        : "OFFLINE",
    });

    try {
      const res = await fetch("/api/driver/duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: nextOnline }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        set({
          isOnline: false,
          dutyState: "OFFLINE",
          verification: data.data?.verification || data.verification || get().verification,
        });
        if (onBlocked) {
          onBlocked(data.message || "Document verification required before going online.");
        }
        return false;
      }
      if (data.data?.verification) {
        set({ verification: data.data.verification });
      }
      return true;
    } catch {
      return true;
    }
  },

  setOnline: async (online: boolean, onBlocked?: (reason?: string) => void) => {
    const { verification, activeRide } = get();
    if (online && !verification.isVerified) {
      if (onBlocked) {
        onBlocked(
          verification.reason ||
          "All driver identity and vehicle compliance documents must be verified before going online."
        );
      }
      return false;
    }

    set({
      isOnline: online,
      incomingDispatch: online ? get().incomingDispatch : null,
      dutyState: activeRide
        ? "ON_TRIP"
        : online
        ? "ONLINE_SEARCHING"
        : "OFFLINE",
    });

    try {
      const res = await fetch("/api/driver/duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: online }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        set({
          isOnline: false,
          dutyState: "OFFLINE",
          verification: data.data?.verification || data.verification || get().verification,
        });
        if (onBlocked) {
          onBlocked(data.message || "Document verification required.");
        }
        return false;
      }
      return true;
    } catch {
      return true;
    }
  },

  pollDispatches: async () => {
    const { isOnline, activeRide, incomingDispatch, verification } = get();
    // Do not poll if offline, trip active, or unverified
    if (!isOnline || activeRide || incomingDispatch || !verification.isVerified) return;

    try {
      const res = await fetch("/api/driver/dispatches");
      if (res.ok) {
        const json = await res.json();
        if (json.data && !get().activeRide) {
          set({
            incomingDispatch: json.data,
            dutyState: "DISPATCH_ALERT",
          });
        }
      }
    } catch {}
  },

  acceptDispatch: async (onBlocked?: (reason?: string) => void) => {
    const dispatch = get().incomingDispatch;
    if (!dispatch) return false;

    const { verification } = get();
    // STRICT: Unverified drivers cannot accept rides
    if (!verification.isVerified) {
      if (onBlocked) {
        onBlocked(
          verification.reason ||
          "Cannot accept ride: All driver and vehicle documents must be verified first."
        );
      }
      set({ incomingDispatch: null, isOnline: false, dutyState: "OFFLINE" });
      return false;
    }

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
      otp: dispatch.otp || "",
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

    try {
      const res = await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT",
          rideId: newActiveRide._id,
          offerId: dispatch.offerId,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        set({
          activeRide: null,
          dutyState: "OFFLINE",
          isOnline: false,
          verification: json.verification || get().verification,
        });
        if (onBlocked) {
          onBlocked(json.message || "Cannot accept ride: Verification required.");
        }
        return false;
      }
      if (json.data && json.data.otp) {
        set((s) => (s.activeRide ? { activeRide: { ...s.activeRide, otp: json.data.otp } } : {}));
      }
    } catch {}

    return true;
  },

  declineDispatch: async () => {
    const dispatch = get().incomingDispatch;
    set({
      incomingDispatch: null,
      dutyState: get().isOnline ? "ONLINE_SEARCHING" : "OFFLINE",
    });

    if (dispatch && dispatch._id) {
      try {
        await fetch("/api/driver/rides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REJECT",
            rideId: dispatch._id,
            offerId: dispatch.offerId,
          }),
        });
      } catch (err) {
        console.error("[useDriverStore declineDispatch Error]:", err);
      }
    }
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

    try {
      const res = await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START", rideId: active._id, otp: enteredOtp }),
      });

      if (res.ok) {
        set({
          activeRide: {
            ...active,
            status: "IN_PROGRESS",
          },
        });
        return true;
      }
    } catch {}

    return false;
  },

  completeTrip: async (rating = 5, compliments: string[] = []) => {
    const active = get().activeRide;
    if (!active) return;

    const completedFare = active.fare;

    const newRecent: IDriverTripHistoryItem = {
      id: active._id,
      riderName: active.rider.name,
      pickup: active.pickup.address,
      dropoff: active.dropoff.address,
      fare: completedFare,
      tip: 0,
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
        todayEarnings: state.stats.todayEarnings + completedFare,
        weeklyEarnings: state.stats.weeklyEarnings + completedFare,
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
          riderCompliments: compliments,
        }),
      });
      // Refresh to ensure full db sync
      get().fetchDriverData();
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
      get().fetchDriverData();
    } catch {}
  },

  simulateIncomingRide: async (onBlocked?: (reason?: string) => void) => {
    const { verification, isOnline } = get();

    if (!verification.isVerified) {
      if (onBlocked) {
        onBlocked(
          verification.reason ||
          "Cannot receive ride requests: All driver identity and vehicle compliance documents must be verified first."
        );
      }
      return false;
    }

    if (!isOnline) {
      if (onBlocked) {
        onBlocked("You must go online to receive ride dispatches.");
      }
      return false;
    }

    try {
      const res = await fetch("/api/driver/dispatches", { method: "POST" });
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        if (json.verification) {
          set({ verification: json.verification, isOnline: false, dutyState: "OFFLINE" });
        }
        if (onBlocked) {
          onBlocked(json.message || "Ride request blocked: Documents pending review.");
        }
        return false;
      }
      if (json.data) {
        set({
          incomingDispatch: json.data,
          dutyState: "DISPATCH_ALERT",
        });
        return true;
      }
    } catch {}

    // Fallback simulation only if verified
    const simulated: IDriverDispatch = {
      _id: `ride-${Date.now()}`,
      riderName: "Ananya Iyer",
      riderPhone: "+91 98201 55670",
      riderRating: 4.96,
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
      fare: 420,
      surgeMultiplier: 1.4,
      vehicleType: "Cab Premium",
      paymentMethod: "UPI",
      expiresAt: Date.now() + 16000,
    };

    set({
      incomingDispatch: simulated,
      dutyState: "DISPATCH_ALERT",
    });
    return true;
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
      const res = await fetch(`/api/driver/rides/${active._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          set((s) => (s.activeRide ? { activeRide: { ...s.activeRide, messages: json.data } } : {}));
        }
      }
    } catch {}
  },

  updateLocation: async (coords: [number, number]) => {
    set({ driverCoordinates: coords });
    const active = get().activeRide;
    try {
      await fetch("/api/driver/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_LOCATION",
          rideId: active?._id,
          coordinates: coords,
        }),
      });
    } catch {}
  },
}));
