import { create } from "zustand";

export interface IRideData {
  _id: string;
  rider: string;
  driver?: string | null;
  driverDetails?: {
    name: string;
    phone: string;
    rating: number;
    vehicleNumber: string;
    vehicleModel: string;
    avatar?: string | null;
  };
  driverCoordinates?: [number, number];
  messages?: Array<{ sender: "rider" | "driver"; text: string; timestamp: string }>;
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
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  otp: string;
  scheduledFor?: string | null;
  paymentMethod: "WALLET" | "CASH" | "UPI";
  paymentStatus: "PENDING" | "PAID";
  locationStatus?: "FRESH" | "STALE" | "UNAVAILABLE" | "TERMINAL";
  isLocationFresh?: boolean;
  locationAgeSeconds?: number | null;
  trackingVersion?: number;
  driverCoordinatesUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICommuteData {
  _id: string;
  title: string;
  pickup: { address: string; coordinates?: [number, number] };
  dropoff: { address: string; coordinates?: [number, number] };
  time: string;
  days: string[];
  vehicleType: string;
  isActive: boolean;
}

export interface IDashboardStats {
  ridesThisMonth: number;
  walletBalance: number;
  rating: number;
  timeSavedMinutes: number;
  onTimeRate?: number;
  co2SavedKg?: number;
  corporatePassRemaining?: number;
  monthExpenseTotal?: number;
}

export interface ISavedPlace {
  _id: string;
  name: string;
  address: string;
  tag: "Home" | "Work" | "Gym" | "Favourite" | "Other";
  coordinates?: [number, number];
  isFavorite?: boolean;
}

export interface IDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletBalance: number;
    rating: number;
    avatar?: string | null;
  };
  activeRide: IRideData | null;
  upcomingRides: IRideData[];
  commutes: ICommuteData[];
  recentRides?: IRideData[];
  savedPlaces?: ISavedPlace[];
  stats: IDashboardStats;
}

interface DashboardState {
  data: IDashboardData | null;
  loading: boolean;
  error: string | null;
  activeStream: EventSource | null;
  activePollTimer: ReturnType<typeof setInterval> | null;

  fetchDashboard: () => Promise<void>;
  cancelRide: (id: string) => Promise<boolean>;
  advanceRideStatus: (id: string) => Promise<boolean>;
  toggleCommute: (id: string, isActive: boolean) => Promise<void>;
  subscribeToActiveRide: (rideId: string) => void;
  unsubscribeFromActiveRide: () => void;
  setActiveRide: (ride: IRideData | null) => void;
  clearActiveRide: () => void;
  submitRating: (rideId: string, rating: number, comment?: string, tipAmount?: number) => Promise<boolean>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: true,
  error: null,
  activeStream: null,
  activePollTimer: null,

  fetchDashboard: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/user/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const json = await res.json();
      set({ data: json.data, loading: false });

      // If there is an active ride, subscribe to real-time updates
      if (json.data?.activeRide?._id) {
        get().subscribeToActiveRide(json.data.activeRide._id);
      }
    } catch (err) {
      console.error("[useDashboardStore.fetchDashboard]", err);
      set({ error: (err as Error).message, loading: false });
    }
  },

  setActiveRide: (ride) => {
    const current = get().data;
    if (current) {
      set({ data: { ...current, activeRide: ride } });
    }
  },

  clearActiveRide: () => {
    get().unsubscribeFromActiveRide();
    const current = get().data;
    if (current) {
      set({ data: { ...current, activeRide: null } });
    }
    get().fetchDashboard();
  },

  submitRating: async (rideId: string, rating: number, comment?: string, tipAmount?: number) => {
    try {
      const res = await fetch(`/api/user/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rate_trip", rating, comment, tipAmount }),
      });
      if (res.ok) {
        get().clearActiveRide();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useDashboardStore.submitRating]", err);
      return false;
    }
  },

  cancelRide: async (id: string) => {
    try {
      const res = await fetch(`/api/user/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        get().unsubscribeFromActiveRide();
        await get().fetchDashboard();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useDashboardStore.cancelRide]", err);
      return false;
    }
  },

  advanceRideStatus: async (id: string) => {
    try {
      const res = await fetch(`/api/user/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance_status" }),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedRide = json.data as IRideData;
        const current = get().data;
        if (current) {
          set({ data: { ...current, activeRide: updatedRide } });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useDashboardStore.advanceRideStatus]", err);
      return false;
    }
  },

  toggleCommute: async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/user/commutes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (res.ok) {
        const json = await res.json();
        const current = get().data;
        if (current) {
          const updated = current.commutes.map((c) => (c._id === id ? json.data : c));
          set({ data: { ...current, commutes: updated } });
        }
      }
    } catch (err) {
      console.error("[useDashboardStore.toggleCommute]", err);
    }
  },

  subscribeToActiveRide: (rideId: string) => {
    get().unsubscribeFromActiveRide();

    if (typeof window === "undefined") return;

    // Helper to safely apply state updates without stale version overwrites
    const applyRideUpdate = (updatedRide: IRideData) => {
      const current = get().data;
      if (!current) return;

      const currentActive = current.activeRide;
      if (currentActive && currentActive._id === updatedRide._id) {
        const curVer = currentActive.trackingVersion ?? 0;
        const newVer = updatedRide.trackingVersion ?? 0;
        // Monotonic guard: discard out-of-order or stale events
        if (newVer < curVer) {
          return;
        }
      }

      if (updatedRide.status === "COMPLETED") {
        set({ data: { ...current, activeRide: updatedRide } });
        get().unsubscribeFromActiveRide();
      } else if (updatedRide.status === "CANCELLED") {
        set({ data: { ...current, activeRide: null } });
        get().unsubscribeFromActiveRide();
        get().fetchDashboard();
      } else {
        set({ data: { ...current, activeRide: updatedRide } });
      }
    };

    // Adaptive fallback polling (only active when SSE is unavailable)
    const startFallbackPolling = () => {
      if (get().activePollTimer) return;
      let pollDelay = 3000;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const pollStep = async () => {
        try {
          const res = await fetch(`/api/user/rides/${rideId}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              applyRideUpdate(json.data);
              pollDelay = 3000; // Reset backoff on success
            }
          } else if (res.status === 404 || res.status === 401 || res.status === 403) {
            get().unsubscribeFromActiveRide();
            return;
          } else {
            pollDelay = Math.min(pollDelay * 1.5, 10000);
          }
        } catch {
          pollDelay = Math.min(pollDelay * 1.5, 10000);
        }

        // Schedule next step if still active
        const currentActive = get().data?.activeRide;
        if (currentActive && currentActive.status !== "COMPLETED" && currentActive.status !== "CANCELLED") {
          timeoutId = setTimeout(pollStep, pollDelay);
          set({ activePollTimer: timeoutId as unknown as ReturnType<typeof setInterval> });
        }
      };

      timeoutId = setTimeout(pollStep, pollDelay);
      set({ activePollTimer: timeoutId as unknown as ReturnType<typeof setInterval> });
    };

    // Try EventSource connection first
    try {
      const es = new EventSource(`/api/user/rides/${rideId}/stream`);

      es.onmessage = (event) => {
        try {
          const updatedRide = JSON.parse(event.data) as IRideData;
          applyRideUpdate(updatedRide);
        } catch (err) {
          console.error("[SSE parse error]", err);
        }
      };

      es.onerror = () => {
        // Stream failed or closed by server; switch to adaptive fallback polling
        const stream = get().activeStream;
        if (stream) {
          stream.close();
          set({ activeStream: null });
        }
        startFallbackPolling();
      };

      set({ activeStream: es });
    } catch {
      // EventSource failed to instantiate; fallback to adaptive polling immediately
      startFallbackPolling();
    }
  },

  unsubscribeFromActiveRide: () => {
    const stream = get().activeStream;
    if (stream) {
      stream.close();
      set({ activeStream: null });
    }
    const timer = get().activePollTimer;
    if (timer) {
      clearTimeout(timer as unknown as ReturnType<typeof setTimeout>);
      clearInterval(timer);
      set({ activePollTimer: null });
    }
  },
}));
