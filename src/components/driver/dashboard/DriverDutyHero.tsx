"use client";

import React from "react";
import {
  Power,
  Radio,
  Sparkles,
  Flame,
  Compass,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

export default function DriverDutyHero() {
  const {
    isOnline,
    dutyState,
    toggleOnline,
    simulateIncomingRide,
    stats,
  } = useDriverStore();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#042f2e] via-[#064e3b] to-[#022c22] border border-teal-500/20 p-5 md:p-7 text-white shadow-xl">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Status & Sonar Pulse */}
        <div className="flex items-start gap-4">
          {/* Duty Pulse Icon */}
          <div className="relative shrink-0 mt-1">
            {isOnline ? (
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

              {isOnline && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-400/30 text-amber-300">
                  <Flame size={12} className="text-amber-400" />
                  1.4x Surge in Sector 62
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white mt-1.5 tracking-tight">
              {dutyState === "ON_TRIP"
                ? "Passenger On Board"
                : isOnline
                ? "Searching for riders nearby..."
                : "You are currently offline"}
            </h2>

            <p className="text-[13px] text-teal-100/70 mt-1 max-w-xl">
              {isOnline
                ? "GPS active and receiving high-demand ride dispatches. Stay within 3 km of Cyber City or IT Hub for quickest requests."
                : "Turn on your duty switch to start receiving ride requests and earning daily quest bonuses."}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          {/* Simulate incoming ride button for quick testing */}
          {isOnline && dutyState !== "ON_TRIP" && (
            <button
              onClick={simulateIncomingRide}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 transition-all active:scale-95 shadow-sm"
            >
              <Sparkles size={16} className="text-teal-300" />
              <span>Simulate Rider Request</span>
            </button>
          )}

          {/* Master Duty Switch */}
          <button
            onClick={toggleOnline}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-black text-[14px] transition-all shadow-lg active:scale-95 ${
              isOnline
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30 border border-rose-400"
                : "bg-linear-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-emerald-500/25 border border-emerald-300 font-extrabold"
            }`}
          >
            <Power size={18} />
            <span>{isOnline ? "Go Offline" : "GO ONLINE"}</span>
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
