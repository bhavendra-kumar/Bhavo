"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  Power,
  ShieldAlert,
  Sparkles,
  Flame,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DriverNavbar() {
  const {
    isOnline,
    toggleOnline,
    simulateIncomingRide,
    driverProfile,
    stats,
    vehicle,
  } = useDriverStore();
  const { alert } = useDialog();

  const handleSos = () => {
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
      {/* Left: Command Status & Surge Badge */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Driver Hub</span>
              <span className="text-slate-300">/</span>
              <span className="text-teal-700 font-semibold">Shift Operations</span>
            </h1>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Vehicle: <strong className="text-slate-700">{vehicle.model}</strong> • {vehicle.numberPlate}
          </span>
        </div>

        {/* Live Surge Ticker */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[11px] font-bold shadow-xs">
          <Flame size={13} className="text-amber-500 animate-bounce" />
          <span>Surge 1.4x (Sector 62 IT Park)</span>
        </div>
      </div>

      {/* Right: Master Duty Switch, Test Dispatch trigger, SOS & Profile */}
      <div className="flex items-center gap-3">
        {/* Test Simulator Trigger Button */}
        <button
          onClick={simulateIncomingRide}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-xs"
          title="Simulate a new incoming rider dispatch to test ride acceptance"
        >
          <Sparkles size={13} className="text-indigo-600" />
          <span>Simulate Ride</span>
        </button>

        {/* SOS Emergency Button */}
        <button
          onClick={handleSos}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shadow-xs"
          title="Trigger emergency roadside assistance or safety SOS"
        >
          <ShieldAlert size={14} className="text-rose-500" />
          <span className="hidden sm:inline">SOS</span>
        </button>

        {/* Master Duty Online Switch Pill */}
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all shadow-xs border ${
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
          <Power size={13} className={isOnline ? "text-emerald-600" : "text-slate-400"} />
        </button>

        {/* Driver Notification */}
        <Link
          href="/driver/notifications"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
        </Link>

        {/* Driver Avatar & Rating */}
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
