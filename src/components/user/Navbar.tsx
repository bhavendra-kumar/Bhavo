"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/user/dashboard":          { title: "Dashboard",         subtitle: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) },
  "/user/book-ride":          { title: "Book a Ride",        subtitle: "Get a ride in minutes. Your preferred vehicles are ready." },
  "/user/my-commute":         { title: "My Commute",         subtitle: "Your daily routes and smart commute insights." },
  "/user/trips":              { title: "My Trips",           subtitle: "View your past and upcoming trips." },
  "/user/wallet":             { title: "Bhavo Wallet",       subtitle: "Manage your balance, rewards and payments." },
  "/user/places":             { title: "Places",             subtitle: "Your saved and frequent locations." },
  "/user/notifications":      { title: "Notifications",      subtitle: "Stay up to date with your activity." },
  "/user/mobility-insights":  { title: "Mobility Insights",  subtitle: "Analytics on your travel patterns and savings." },
  "/user/profile":            { title: "My Profile",         subtitle: "Manage your personal information and preferences." },
  "/user/settings":           { title: "Settings",           subtitle: "Customize your Bhavo experience." },
};

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const meta = PAGE_META[pathname] ?? { title: "Bhavo", subtitle: "" };

  return (
    <header
      className="flex items-center justify-between h-16 px-6 lg:px-8 shrink-0"
      style={{ background: "#042f2e", borderBottom: "1px solid #115e59" }}
    >
      {/* Page title block */}
      <div className="flex flex-col justify-center">
        <h1 className="text-[17px] font-black tracking-tight leading-none" style={{ color: "#ffffff" }}>
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className="text-[11px] font-medium mt-0.5 hidden sm:block" style={{ color: "#99f6e4" }}>
            {meta.subtitle}
          </p>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3 pointer-events-none" style={{ color: "#5eead4" }} />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 pl-9 pr-4 text-[13px] rounded-lg transition-all w-48 focus:w-64 focus:outline-none placeholder:text-teal-600"
            style={{ background: "#115e59", border: "1px solid #134e4a", color: "#ffffff" }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "#2dd4bf";
              (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(45,212,191,0.12)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "#134e4a";
              (e.target as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Bell */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "#5eead4", background: "#115e59", border: "1px solid #134e4a" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#134e4a")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#115e59")}
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 border-2 border-white" />
        </button>

        <div className="w-px h-6" style={{ background: "#115e59" }} />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8" style={{ border: "1px solid #115e59" }}>
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? undefined} />
            <AvatarFallback className="text-[12px] font-bold" style={{ background: "#115e59", color: "#5eead4" }}>
              {user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block">
            <p className="text-[13px] font-semibold leading-none" style={{ color: "#ffffff" }}>{user?.name}</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "#5eead4" }}>★ {user?.rating}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
