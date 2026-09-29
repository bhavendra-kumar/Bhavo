"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Wallet,
  Award,
  Car,
  Star,
  LifeBuoy,
  Settings,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

const DRIVER_NAV_ITEMS = [
  {
    section: "MAIN",
    links: [
      { name: "Command Center", href: "/driver", icon: LayoutDashboard },
      { name: "Trips History", href: "/driver/trips", icon: Map },
    ],
  },
  {
    section: "FINANCE",
    links: [
      { name: "Earnings & Payouts", href: "/driver/earnings", icon: Wallet },
      { name: "Incentive Quests", href: "/driver/incentives", icon: Award, badge: "₹350 Bonus" },
    ],
  },
  {
    section: "VEHICLE & SAFETY",
    links: [
      { name: "Vehicle & Docs", href: "/driver/vehicle", icon: Car, badge: "Verified" },
      { name: "Driver Support & SOS", href: "/driver/support", icon: LifeBuoy },
    ],
  },
  {
    section: "ACCOUNT",
    links: [
      { name: "Ratings & Badges", href: "/driver/ratings", icon: Star },
      { name: "Preferences", href: "/driver/settings", icon: Settings },
    ],
  },
];

const BG = "#042f2e";
const BG_HOVER = "rgba(255, 255, 255, 0.08)";
const BG_ACTIVE = "rgba(20, 184, 166, 0.18)";
const BORDER = "rgba(255, 255, 255, 0.08)";
const ACCENT = "#2dd4bf";
const SECTION_LABEL = "#94a3b8";
const TEXT_INACTIVE = "#cbd5e1";
const TEXT_ACTIVE = "#ffffff";

export default function DriverSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    driverProfile,
    vehicle,
    isSidebarCollapsed: collapsed,
    toggleSidebar,
    stats,
  } = useDriverStore();
  const { confirm } = useDialog();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "End Shift & Sign Out?",
      message: "You will go offline and ride requests will stop. Are you sure?",
      confirmText: "Go Offline & Sign Out",
      cancelText: "Stay on Shift",
      variant: "warning",
    });
    if (!ok) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside
      className="relative h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out select-none"
      style={{
        width: collapsed ? "68px" : "260px",
        background: BG,
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      {/* Logo & Driver Brand */}
      <div
        className="flex items-center justify-between h-22 px-4 shrink-0 overflow-hidden relative"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={collapsed ? toggleSidebar : undefined}
            className={`flex items-center justify-center shrink-0 rounded-2xl overflow-hidden bg-white shadow-md transition-all ${
              collapsed ? "cursor-pointer hover:ring-2 hover:ring-teal-400 hover:scale-105 active:scale-95" : ""
            }`}
            style={{ width: 44, height: 44 }}
            title={collapsed ? "Open sidebar" : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/trimmed-logo.png" alt="Bhavo Logo" className="w-full h-full object-contain p-1" />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-[19px] tracking-tight">BHAVO</span>
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  CAPTAIN
                </span>
              </div>
              <span className="text-[11px] text-teal-200/70 font-semibold truncate mt-0.5">
                Command Center
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-teal-200/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 py-2 space-y-5">
        {DRIVER_NAV_ITEMS.map((group) => (
          <div key={group.section} className="space-y-1">
            {!collapsed && (
              <p
                className="px-3 text-[10px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: SECTION_LABEL }}
              >
                {group.section}
              </p>
            )}
            {group.links.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all relative group"
                  style={{
                    color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE,
                    background: isActive ? BG_ACTIVE : "transparent",
                    borderLeft: isActive ? `3px solid ${ACCENT}` : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = BG_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon
                    size={18}
                    className="shrink-0 transition-colors"
                    style={{ color: isActive ? ACCENT : "#94a3b8" }}
                  />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Driver Profile Footer */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.18)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="w-8 h-8 rounded-lg border border-teal-500/30 shrink-0">
              <AvatarImage src={driverProfile?.avatar || ""} />
              <AvatarFallback className="bg-teal-800 text-white text-[12px] font-bold">
                {driverProfile?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-bold text-white truncate">
                    {driverProfile?.name || "Driver"}
                  </span>
                  <div className="flex items-center text-[10px] text-amber-300 font-bold">
                    <Star size={10} className="fill-amber-400 text-amber-400 mr-0.5" />
                    {stats.rating}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  {vehicle.numberPlate}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
