"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Power,
  Radio,
  Sparkles,
  Flame,
  Compass,
  Clock,
  ShieldCheck,
  TrendingUp,
  Lock,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DriverDutyHero() {
  const router = useRouter();
  const { alert } = useDialog();
  const {
    isOnline,
    dutyState,
    toggleOnline,
    simulateIncomingRide,
    stats,
    surgeAreas,
    verification,
  } = useDriverStore();

  const isVerified = verification?.isVerified !== false;
  const topSurge = surgeAreas && surgeAreas[0] ? surgeAreas[0] : null;

  const handleToggleDuty = async () => {
    if (!isVerified) {
      alert({
        title: "Document Verification Required",
        message:
          verification?.reason ||
          "All vehicle and driver identity documents must be verified and approved by Bhavo Compliance before you can come online and accept ride requests.",
        confirmText: "Go to Vehicle & Documents",
        variant: "warning",
      });
      router.push("/driver/vehicle");
      return;
    }

    await toggleOnline((reason) => {
      alert({
        title: "Online Switch Blocked",
        message:
          reason ||
          "All vehicle and driver documents must be verified before coming online.",
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
        confirmText: "Go to Documents",
        variant: "warning",
      });
      router.push("/driver/vehicle");
      return;
    }

    if (!isOnline) {
      alert({
        title: "Captain Offline",
        message: "You must turn on your duty switch and go online before receiving ride dispatches.",
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

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 md:p-7 text-white shadow-xl border transition-all ${
      !isVerified
        ? "bg-linear-to-br from-[#1c1917] via-[#292524] to-[#0c0a09] border-amber-500/30 shadow-amber-950/20"
        : "bg-linear-to-br from-[#042f2e] via-[#064e3b] to-[#022c22] border-teal-500/20 shadow-teal-950/20"
    }`}>
      {/* Background Decorative Glow */}
      <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
        !isVerified ? "bg-amber-500/15" : "bg-teal-500/15"
      }`} />
      <div className={`absolute bottom-0 left-1/3 -mb-16 w-56 h-56 rounded-full blur-2xl pointer-events-none ${
        !isVerified ? "bg-rose-500/10" : "bg-emerald-500/10"
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Status & Sonar Pulse */}
        <div className="flex items-start gap-4">
          {/* Duty Pulse Icon */}
          <div className="relative shrink-0 mt-1">
            {!isVerified ? (
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                <Lock size={26} className="text-amber-400" />
              </div>
            ) : isOnline ? (
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <span className="absolute w-full h-full rounded-2xl bg-emerald-400/20 animate-ping" />
                <Radio size={28} className="animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400">
                <Power size={28} />
              </div>
            )}
          </div>

          {/* Status Text Details */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              {!isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold uppercase tracking-wider border bg-amber-500/20 border-amber-400/40 text-amber-300">
                  <AlertTriangle size={13} className="text-amber-400" />
                  <span>Verification Required • Duty Locked</span>
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold uppercase tracking-wider border ${
                    isOnline
                      ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  {dutyState === "ON_TRIP"
                    ? "Active Trip In Progress"
                    : isOnline
                    ? "Online • Ready for Dispatches"
                    : "Offline • On Break"}
                </span>
              )}

              {isVerified && isOnline && topSurge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-400/30 text-amber-300">
                  <Flame size={12} className="text-amber-400" />
                  {topSurge.multiplier}x Surge in {topSurge.name.split("&")[0].trim()}
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white mt-1.5 tracking-tight">
              {!isVerified
                ? "Vehicle & Driver Verification Incomplete"
                : dutyState === "ON_TRIP"
                ? "Passenger On Board"
                : isOnline
                ? "Searching for riders nearby..."
                : "You are currently offline"}
            </h2>

            <p className="text-[13px] text-slate-200/80 mt-1 max-w-xl">
              {!isVerified
                ? (verification?.reason || "All vehicle documents and driver license/identity credentials must be verified before coming online or accepting rides.")
                : isOnline
                ? "GPS active and receiving high-demand ride dispatches. Stay within 3 km of Cyber City or IT Hub for quickest requests."
                : "Turn on your duty switch to start receiving ride requests and earning daily quest bonuses."}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          {!isVerified ? (
            <button
              onClick={() => router.push("/driver/vehicle")}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-[13px] bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <FileCheck2 size={16} />
              <span>Review & Verify Docs</span>
            </button>
          ) : (
            isOnline && dutyState !== "ON_TRIP" && (
              <button
                onClick={handleSimulate}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Sparkles size={16} className="text-teal-300" />
                <span>Simulate Rider Request</span>
              </button>
            )
          )}

          {/* Master Duty Switch */}
          <button
            onClick={handleToggleDuty}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-black text-[14px] transition-all shadow-lg active:scale-95 cursor-pointer ${
              !isVerified
                ? "bg-slate-800/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 shadow-slate-900/50"
                : isOnline
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30 border border-rose-400"
                : "bg-linear-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-emerald-500/25 border border-emerald-300 font-extrabold"
            }`}
          >
            {!isVerified ? (
              <>
                <Lock size={16} className="text-amber-400" />
                <span>Duty Locked</span>
              </>
            ) : (
              <>
                <Power size={18} />
                <span>{isOnline ? "Go Offline" : "GO ONLINE"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Shift Summary Bar */}
      <div className="mt-6 pt-4 border-t border-teal-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300">
            <TrendingUp size={15} />
          </div>
          <div>
            <span className="text-teal-200/60 block text-[11px]">Shift Earnings</span>
            <span className="font-extrabold text-[14px] text-white">₹{stats.todayEarnings}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300">
            <Clock size={15} />
          </div>
          <div>
            <span className="text-teal-200/60 block text-[11px]">Online Time</span>
            <span className="font-extrabold text-[14px] text-white">
              {Math.floor(stats.onlineMinutes / 60)}h {stats.onlineMinutes % 60}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300">
            <Compass size={15} />
          </div>
          <div>
            <span className="text-teal-200/60 block text-[11px]">Completed Trips</span>
            <span className="font-extrabold text-[14px] text-white">{stats.tripsCompleted} Rides</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-300">
            <ShieldCheck size={15} />
          </div>
          <div>
            <span className="text-teal-200/60 block text-[11px]">Acceptance Rate</span>
            <span className="font-extrabold text-[14px] text-emerald-300">{stats.acceptanceRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
