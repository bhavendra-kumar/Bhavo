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
  stats: {
    ridesThisMonth: number;
    walletBalance: number;
    rating: number;
    timeSavedMinutes: number;
  };
}

interface DashboardState {
  data: IDashboardData | null;
  loading: boolean;
  error: string | null;
  activeStream: EventSource | null;

  fetchDashboard: () => Promise<void>;
  cancelRide: (id: string) => Promise<boolean>;
  advanceRideStatus: (id: string) => Promise<boolean>;
  toggleCommute: (id: string, isActive: boolean) => Promise<void>;
  subscribeToActiveRide: (rideId: string) => void;
  unsubscribeFromActiveRide: () => void;
  setActiveRide: (ride: IRideData | null) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: true,
  error: null,
  activeStream: null,

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
        get().setActiveRide(updatedRide.status === "COMPLETED" ? null : updatedRide);
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

    try {
      const es = new EventSource(`/api/user/rides/${rideId}/stream`);

      es.onmessage = (event) => {
        try {
          const updatedRide = JSON.parse(event.data) as IRideData;
          const current = get().data;
          if (current) {
            if (updatedRide.status === "COMPLETED" || updatedRide.status === "CANCELLED") {
              set({ data: { ...current, activeRide: null } });
              get().unsubscribeFromActiveRide();
              get().fetchDashboard();
            } else {
              set({ data: { ...current, activeRide: updatedRide } });
            }
          }
        } catch (err) {
          console.error("[SSE parse error]", err);
        }
      };

      es.onerror = () => {
        // SSE error / disconnected, close gracefully
        get().unsubscribeFromActiveRide();
      };

      set({ activeStream: es });
    } catch (err) {
      console.error("[subscribeToActiveRide]", err);
    }
  },

  unsubscribeFromActiveRide: () => {
    const stream = get().activeStream;
    if (stream) {
      stream.close();
      set({ activeStream: null });
    }
  },
}));
