"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Power,
  ShieldAlert,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

const DRIVER_PAGE_TITLES: Record<string, string> = {
  "/driver": "Shift Operations",
  "/driver/trips": "Trips Log & History",
  "/driver/earnings": "Earnings & Bank Transfers",
  "/driver/incentives": "Incentive Quests & Shift Bonuses",
  "/driver/vehicle": "Vehicle Telemetry & Compliance",
  "/driver/ratings": "Captain Ratings & Feedback",
  "/driver/support": "Captain Assistance & SOS Safety",
  "/driver/settings": "Captain Settings & Dispatch Filters",
};

export default function DriverNavbar() {
  const pathname = usePathname();
  const cleanPath = pathname?.replace(/\/$/, "") || "/driver";
  const currentSection = DRIVER_PAGE_TITLES[cleanPath] || "Shift Operations";
  const router = useRouter();
  const {
    isOnline,
    toggleOnline,
    simulateIncomingRide,
    driverProfile,
    stats,
    vehicle,
    isSidebarCollapsed,
    toggleSidebar,
    verification,
  } = useDriverStore();
  const { alert } = useDialog();

  const isVerified = verification?.isVerified !== false;

  const handleToggleDuty = async () => {
    if (!isVerified) {
      alert({
        title: "Duty Switch Locked",
        message:
          verification?.reason ||
          "All driver identity and vehicle compliance documents must be verified before going online and accepting rides.",
        confirmText: "Go to Vehicle & Documents",
        variant: "warning",
      });
      router.push("/driver/vehicle");
      return;
    }

    await toggleOnline((reason) => {
      alert({
        title: "Online Switch Blocked",
        message: reason || "Document verification required.",
        confirmText: "View Documents",
        variant: "warning",
      });
      router.push("/driver/vehicle");
    });
  };

  const handleSimulate = async () => {
    if (!isVerified) {
      alert({
        title: "Dispatches Disabled",
        message:
          verification?.reason ||
          "Cannot dispatch rides: All vehicle and driver documents must be verified first.",
        confirmText: "Review Documents",
        variant: "warning",
      });
      router.push("/driver/vehicle");
      return;
    }

    if (!isOnline) {
      alert({
        title: "Captain Offline",
        message: "You must go online to receive ride requests.",
        confirmText: "Understood",
        variant: "info",
      });
      return;
    }

    await simulateIncomingRide((reason) => {
      alert({
        title: "Simulation Blocked",
        message: reason || "Document verification required.",
        confirmText: "OK",
        variant: "warning",
      });
    });
  };

  const handleSos = async () => {
    try {
      await fetch("/api/driver/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSos: true }),
      });
    } catch { }

    alert({
      title: "Driver Safety SOS Triggered",
      message:
        "Emergency protocol activated! Bhavo Safety Response Team and local highway patrol dispatch have been alerted with your live GPS location: 28.6250 N, 77.3750 E.",
      confirmText: "Understood",
      variant: "danger",
    });
  };

  return (
    <header className="h-16 border-b border-teal-900/20 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 hover:border-teal-300 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] sm:text-[15px] font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 truncate">
              <span className="shrink-0">Driver Hub</span>
              <span className="text-slate-300 shrink-0">/</span>
              <span className="text-teal-700 font-semibold truncate">{currentSection}</span>
            </h1>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Vehicle: <strong className="text-slate-700">{vehicle.model}</strong> • {vehicle.numberPlate}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isVerified ? (
          <Link
            href="/driver/vehicle"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-xs"
            title="Documents pending verification"
          >
            <ShieldAlert size={14} className="text-amber-600" />
            <span>Verification Required</span>
          </Link>
        ) : (
          <button
            onClick={handleSimulate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-xs cursor-pointer"
            title="Simulate a new incoming rider dispatch to test ride acceptance"
          >
            <Sparkles size={13} className="text-indigo-600" />
            <span>Simulate Ride</span>
          </button>
        )}

        <button
          onClick={handleSos}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shadow-xs cursor-pointer"
          title="Trigger emergency roadside assistance or safety SOS"
        >
          <ShieldAlert size={14} className="text-rose-500" />
          <span className="hidden sm:inline">SOS</span>
        </button>

        <button
          onClick={handleToggleDuty}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all shadow-xs border cursor-pointer ${
            !isVerified
              ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              : isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          }`}
        >
          {!isVerified ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>LOCKED</span>
              <Power size={13} className="text-amber-600" />
            </>
          ) : (
            <>
              <span
                className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
              />
              <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
              <Power size={13} className={isOnline ? "text-emerald-600" : "text-slate-400"} />
            </>
          )}
        </button>

        <Link
          href="/driver/notifications"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <Avatar className="w-8 h-8 rounded-full border border-teal-500/40">
            <AvatarImage src={driverProfile?.avatar || ""} />
            <AvatarFallback className="bg-teal-700 text-white text-[12px] font-bold">
              {driverProfile?.name?.charAt(0) || "D"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col text-left leading-tight">
            <span className="text-[12px] font-bold text-slate-800">
              {driverProfile?.name || "Driver"}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">
              ★ {stats.rating} Rating
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
