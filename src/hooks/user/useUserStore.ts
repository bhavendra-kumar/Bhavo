import { create } from "zustand";

interface UserState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Dummy user data
  user: {
    name: string;
    email: string;
    avatar: string;
    rating: number;
    walletBalance: number;
  };
}

export const useUserStore = create<UserState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  
  user: {
    name: "Alex Doe",
    email: "alex@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    rating: 4.92,
    walletBalance: 1250,
  }
}));
