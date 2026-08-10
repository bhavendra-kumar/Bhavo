"use client";

import React from "react";
import { BarChart3, TrendingUp, Clock, Banknote, ShieldCheck, Zap, Leaf } from "lucide-react";
import StatCard from "@/components/user/ui/StatCard";

const BAR_DATA = [65, 40, 80, 55, 90, 70, 45];
const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

export default function MobilityInsightsPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
            >
              <BarChart3 size={18} className="text-white" />
            </div>
            Mobility Insights
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Your travel statistics and AI-driven recommendations.</p>
        </div>

        {/* Period selector */}
        <div
          className="flex bg-white p-1 rounded-xl shrink-0"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          {["This Month", "Last Month", "This Year"].map((label, i) => (
            <button
              key={label}
              className="px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap"
              style={{
                background: i === 0 ? "#0f172a" : "transparent",
                color: i === 0 ? "white" : "#94a3b8",
                boxShadow: i === 0 ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Time Saved" value="12h 45m" icon={Clock} color="blue" trend={{ value: 15, isPositive: true }} />
        <StatCard title="Money Spent" value="₹14,250" icon={Banknote} color="amber" trend={{ value: 8, isPositive: false }} />
        <StatCard title="Auto-Booked" value="42" icon={ShieldCheck} color="teal" subtitle="Trips automated" />
        <StatCard title="Carbon Saved" value="85 kg" icon={TrendingUp} color="teal" subtitle="Via Eco rides" />
      </div>

      {/* Chart + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar Chart */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col"
          style={{
            border: "1px solid rgba(15,23,42,0.07)",
            boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)",
            minHeight: "320px",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Commute Trends</h3>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Weekly</span>
          </div>

          <div className="flex-1 flex items-end gap-3 pb-2">
            {BAR_DATA.map((pct, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="w-full flex-1 flex flex-col justify-end relative group">
                  <div
                    className="w-full rounded-t-xl transition-all duration-300 group-hover:opacity-80 relative"
                    style={{
                      height: `${pct}%`,
                      background: i === 4
                        ? "linear-gradient(to top, #0d9488, #14b8a6)"
                        : "linear-gradient(to top, #e2e8f0, #f1f5f9)",
                      boxShadow: i === 4 ? "0 -4px 12px rgba(13,148,136,0.3)" : "none",
                    }}
                  />
                  {/* Tooltip */}
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none"
                    style={{ background: "#0f172a" }}
                  >
                    {pct} trips
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{WEEK_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div
          className="rounded-2xl p-5 text-white flex flex-col gap-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0c0f14 0%, #1e293b 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #14b8a6, transparent)", transform: "translate(30%, -30%)" }}
          />

          <h3 className="font-bold flex items-center gap-2 relative z-10">
            <Zap size={16} className="text-amber-400 fill-amber-400" /> AI Insights
          </h3>

          <div
            className="relative z-10 p-4 rounded-xl flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h4 className="text-xs font-bold text-teal-300">Optimal Departure</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leaving 15 mins earlier saves ~₹1,200/month in peak surcharges.
            </p>
            <button
              className="mt-1 self-start text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Adjust Schedule
            </button>
          </div>

          <div
            className="relative z-10 p-4 rounded-xl flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <Leaf size={12} /> Eco Hero
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              80% of your rides were Eco this month. Keep it up to unlock the Green Commuter badge!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
