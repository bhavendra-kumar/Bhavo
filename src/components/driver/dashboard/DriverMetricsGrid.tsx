"use client";

import React from "react";
import {
  TrendingUp,
  Award,
  Star,
  Clock,
  BatteryCharging,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

export default function DriverMetricsGrid() {
  const { stats, vehicle } = useDriverStore();

  const questProgressPercent = Math.min(
    100,
    Math.round((stats.tripsCompleted / stats.targetTrips) * 100)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Daily Earnings Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Today&apos;s Earnings
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              ₹{stats.todayEarnings}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +14% vs avg
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Weekly total: <strong>₹{stats.weeklyEarnings}</strong>
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Net Tips: ₹85</span>
          <button className="text-teal-700 font-bold hover:underline flex items-center gap-0.5">
            Cashout <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* 2. Daily Quest Bonus Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Daily Shift Quest
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award size={16} />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {stats.tripsCompleted} / {stats.targetTrips}{" "}
              <span className="text-xs font-normal text-slate-500">Rides</span>
            </span>
            <span className="text-xs font-black text-amber-600">
              +₹{stats.targetBonus} Bonus
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${questProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {stats.targetTrips - stats.tripsCompleted > 0
              ? `${stats.targetTrips - stats.tripsCompleted} more rides to unlock`
              : "Quest Completed! 🎉"}
          </span>
          <span className="font-bold text-amber-700">Expires 11 PM</span>
        </div>
      </div>

      {/* 3. Shift Time & Performance */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Shift & Acceptance
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Clock size={16} />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {Math.floor(stats.onlineMinutes / 60)}h {stats.onlineMinutes % 60}m
            </span>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {stats.acceptanceRate}% Accept
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold mt-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{stats.rating} Rating (Top 5% Captains)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Cancellation: 1.2%</span>
          <span className="font-bold text-emerald-600">Excellent Standing</span>
        </div>
      </div>

      {/* 4. Vehicle & Compliance Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Vehicle Telemetry
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <BatteryCharging size={16} />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {vehicle.batteryOrFuelLevel}%
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ~210 km range
            </span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium mt-0.5 block truncate">
            {vehicle.model}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="font-mono text-slate-600 font-bold">{vehicle.numberPlate}</span>
          <span className="font-bold text-emerald-600 flex items-center gap-0.5">
            <ShieldCheck size={12} /> Docs OK
          </span>
        </div>
      </div>
    </div>
  );
}
