import { create } from "zustand";

interface UserState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    rating: number;
    walletBalance: number;
    role: string;
  } | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  
  user: null,
  loading: true,
  
  fetchUser: async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const json = await res.json();
        set({ user: json.data, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (e) {
      console.error("Failed to fetch user:", e);
      set({ user: null, loading: false });
    }
  },
}));
