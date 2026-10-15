"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
      { name: "Incentive Quests", href: "/driver/incentives", icon: Award },
    ],
  },
  {
    section: "VEHICLE & SAFETY",
    links: [
      { name: "Vehicle & Docs", href: "/driver/vehicle", icon: Car },
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
    verification,
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
        width: collapsed ? "70px" : "268px",
        background: BG,
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      <div
        className={`h-16 shrink-0 overflow-hidden relative flex items-center ${
          collapsed ? "justify-center px-2" : "px-4"
        }`}
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={collapsed ? toggleSidebar : undefined}
            className={`flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white shadow-sm transition-all ${
              collapsed ? "cursor-pointer hover:ring-2 hover:ring-teal-400 hover:scale-105 active:scale-95" : ""
            }`}
            style={{ width: 38, height: 38 }}
            title={collapsed ? "Expand sidebar" : undefined}
          >
            <Image src="/bhavo-logo.png" alt="Bhavo Logo" width={38} height={38} className="w-full h-full object-contain p-1" />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-[18px] tracking-tight">BHAVO</span>
                <span className="text-[9.5px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                  CAPTAIN
                </span>
              </div>
              <span className="text-[11px] text-teal-200/70 font-semibold truncate mt-0.5">
                Command Center
              </span>
            </div>
          )}
        </div>
      </div>

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
                  className={`flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all relative group ${
                    collapsed ? "justify-center px-0" : "px-3"
                  }`}
                  title={collapsed ? item.name : undefined}
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
                    <span className="truncate flex-1">{item.name}</span>
                  )}
                  {item.href === "/driver/vehicle" && verification?.isVerified === false && (
                    <span
                      className={`rounded-full bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 shrink-0 ${
                        collapsed ? "w-2 h-2 p-0 -ml-2 -mt-2" : ""
                      }`}
                      title="Documents pending verification"
                    >
                      {!collapsed && "Review"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div
        className="p-3 shrink-0"
        style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.18)" }}
      >
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center flex-col" : "justify-between"}`}>
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
