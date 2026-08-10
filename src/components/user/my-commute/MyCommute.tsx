"use client";

import React, { useState } from "react";
import { CalendarClock, Zap, Settings2, Plus, Clock, MapPin } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MyCommutePage() {
  const [autoBooking, setAutoBooking] = useState(true);

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
              <CalendarClock size={18} className="text-white" />
            </div>
            My Commute
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Manage recurring rides and AI-powered scheduling.</p>
        </div>

        {/* Master Toggle */}
        <div
          className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl shrink-0"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)" }}
        >
          <div>
            <p className="font-bold text-slate-900 text-sm">Auto-Booking</p>
            <p className="text-xs text-slate-500">{autoBooking ? "Currently active" : "Currently paused"}</p>
          </div>
          <button
            onClick={() => setAutoBooking(!autoBooking)}
            className="relative transition-colors duration-200"
            style={{
              width: "48px",
              height: "26px",
              background: autoBooking ? "linear-gradient(135deg, #0d9488, #059669)" : "#e2e8f0",
              borderRadius: "999px",
              boxShadow: autoBooking ? "0 0 12px rgba(13,148,136,0.4)" : "none",
            }}
          >
            <div
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
              style={{ left: autoBooking ? "calc(100% - 22px)" : "2px" }}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Schedule card */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl p-6 flex flex-col gap-6"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Schedules</h2>
            <button
              className="flex items-center gap-1.5 text-xs font-bold text-teal-600 px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: "rgba(13,148,136,0.08)" }}
            >
              <Plus size={14} /> New Route
            </button>
          </div>

          {/* Schedule card */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: "rgba(13,148,136,0.03)", border: "1px solid rgba(13,148,136,0.1)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
                >
                  M
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Morning Office Commute</h3>
                  <p className="text-xs text-slate-500">Home → Bhavo HQ</p>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
              >
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div
                className="p-4 rounded-xl"
                style={{ background: "white", border: "1px solid rgba(15,23,42,0.07)" }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
                  <Clock size={12} /> Target Arrival
                </div>
                <p className="font-black text-2xl text-slate-900">9:30 AM</p>
                <p className="text-[11px] text-slate-400 mt-1">AI adjusts for traffic</p>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: "white", border: "1px solid rgba(15,23,42,0.07)" }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
                  <MapPin size={12} /> Vehicle
                </div>
                <p className="font-bold text-base text-slate-900">Premium Sedan</p>
                <p className="text-[11px] text-slate-400 mt-1">Auto-upgrades if needed</p>
              </div>
            </div>

            {/* Day selector */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Active Days</p>
              <div className="flex gap-2">
                {DAYS.map((day, i) => {
                  const active = i < 5;
                  return (
                    <button
                      key={day}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: active ? "linear-gradient(135deg, #0d9488, #059669)" : "#f1f5f9",
                        color: active ? "white" : "#94a3b8",
                        boxShadow: active ? "0 2px 8px rgba(13,148,136,0.25)" : "none",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Rules + AI Insight */}
        <div className="flex flex-col gap-4">

          {/* Smart Rules */}
          <div
            className="bg-white rounded-2xl p-5 flex flex-col gap-4"
            style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
          >
            <h2 className="text-base font-bold text-slate-900">Smart Rules</h2>

            {[
              { icon: Zap, iconBg: "rgba(245,158,11,0.1)", iconColor: "#d97706", title: "Dynamic Pickup", desc: "Auto-adjusts pickup by ±15 mins based on traffic." },
              { icon: Settings2, iconBg: "rgba(59,130,246,0.1)", iconColor: "#2563eb", title: "Rainy Day Upgrade", desc: "Switches to Premium during heavy rain automatically." },
            ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 pb-4 last:pb-0 last:border-0"
                style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: iconBg }}
                >
                  <Icon size={16} style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                    <div
                      className="w-8 h-4 rounded-full relative cursor-pointer shrink-0"
                      style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 0 8px rgba(13,148,136,0.3)" }}
                    >
                      <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight card */}
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0c0f14 0%, #1e293b 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #14b8a6, transparent)", transform: "translate(30%, -30%)" }}
            />
            <h3 className="font-bold text-base mb-2 flex items-center gap-2">
              <Zap size={16} className="text-amber-400 fill-amber-400" /> AI Insight
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              You often skip Thursday evenings. Want us to pause auto-booking for Thursdays?
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 bg-white text-slate-900 text-xs font-bold py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Yes, Pause
              </button>
              <button
                className="flex-1 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Keep Active
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
