"use client";

import React, { useState } from "react";
import { Zap, Plus, Clock, MapPin, Settings2, Check, Pencil, Trash2, CalendarOff, Home, Banknote, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MyCommutePage() {
  const [autoBooking, setAutoBooking] = useState(true);
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4]);
  const toggleDay = (i: number) =>
    setActiveDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: "#0d9488" }}>
          <Plus size={15} /> New Route
        </button>
      </div>

      {/* Auto-Booking Toggle & Preferred Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ccfbf1", border: "1px solid #99f6e4" }}>
            <Zap size={18} style={{ color: autoBooking ? "#14b8a6" : "#5eead4" }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>Auto-Booking</p>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>
              {autoBooking ? "Rides booked automatically." : "Auto-booking is paused."}
            </p>
          </div>
          <Switch checked={autoBooking} onCheckedChange={setAutoBooking} className="data-[state=checked]:bg-teal-500 shrink-0" />
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ccfbf1", border: "1px solid #99f6e4" }}>
            <Star size={18} style={{ color: "#14b8a6" }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>Preferred Drivers</p>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>Match with your 3 saved drivers first.</p>
          </div>
          <button className="text-[12px] font-bold text-teal-700 px-3 py-1.5 rounded bg-teal-50 hover:bg-teal-100 transition-colors">
            Manage
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#0f766e" }}>Active Schedules</p>

          {/* Morning Card */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ccfbf1" }}>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "#042f2e" }}>Morning Office Commute</p>
                <p className="text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>Home → Bhavo HQ · Mon–Fri</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="pill-teal">Active</span>
                <button className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color: "#5eead4" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ccfbf1"; (e.currentTarget as HTMLElement).style.color = "#0d9488"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#5eead4"; }}>
                  <Pencil size={13} />
                </button>
                <button className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color: "#5eead4" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#5eead4"; }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#0f766e" }}>Route</p>
                <div className="relative pl-5 flex flex-col gap-4">
                  <div className="absolute left-1.75 top-2 bottom-6 w-px" style={{ background: "#99f6e4" }} />
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: "#5eead4" }} />
                    <div>
                      <p className="text-[12px] font-medium flex items-center gap-1 mb-0.5" style={{ color: "#0f766e" }}><Clock size={10} /> Pickup · 8:45 AM</p>
                      <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>123 Tech Park Avenue</p>
                    </div>
                  </div>
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "#14b8a6" }}>
                      <MapPin size={6} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium mb-0.5" style={{ color: "#0f766e" }}>Arrival · ~9:30 AM</p>
                      <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>Bhavo Headquarters</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#0f766e" }}>Settings</p>
                <div className="flex flex-col gap-2.5">
                  {[{ l: "Vehicle", v: "Premium Sedan" }, { l: "Target Arrival", v: "9:30 AM" }].map(({ l, v }) => (
                    <div key={l} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #f0fdfa" }}>
                      <span className="text-[13px] font-medium" style={{ color: "#0f766e" }}>{l}</span>
                      <span className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>{v}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium" style={{ color: "#0f766e" }}>AI Adjustment</span>
                    <span className="pill-teal">Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid #ccfbf1", background: "#f0fdfa" }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#0f766e" }}>Active Days</p>
              <div className="flex gap-2">
                {DAYS.map((d, i) => {
                  const on = activeDays.includes(i);
                  return (
                    <button key={d} onClick={() => toggleDay(i)}
                      className="flex-1 flex flex-col items-center py-2 rounded-lg text-[12px] font-semibold transition-all"
                      style={{
                        background: on ? "#0d9488" : "#ffffff",
                        color: on ? "#ffffff" : "#5eead4",
                        border: on ? "1px solid #0d9488" : "1px solid #ccfbf1",
                      }}>
                      {d}
                      {on && <Check size={10} className="mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Evening Card */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ccfbf1" }}>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "#042f2e" }}>Evening Return</p>
                <p className="text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>Bhavo HQ → Home · Mon–Fri</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="pill-teal">Active</span>
                <button className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: "#5eead4" }}><Pencil size={13} /></button>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[{ l: "Pickup", v: "6:30 PM" }, { l: "Vehicle", v: "Eco Hatch" }, { l: "Days", v: "Mon–Fri" }].map(({ l, v }) => (
                  <div key={l} className="p-3 rounded-lg" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#0f766e" }}>{l}</p>
                    <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Rules & AI Recommendations */}
        <div className="flex flex-col gap-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#0f766e" }}>Smart Rules</p>
          <div className="card p-5 flex flex-col gap-5">
            {[
              { icon: CalendarOff, bg: "#fce7f3", color: "#db2777", label: "Skip Public Holidays", desc: "Don't auto-book on national holidays.", on: true },
              { icon: Home, bg: "#ccfbf1", color: "#14b8a6", label: "WFH Mode", desc: "Auto-detect when you are working from home.", on: true },
              { icon: Zap, bg: "#fef9c3", color: "#ca8a04", label: "Dynamic Pickup", desc: "Adjusts pickup by ±15 min based on traffic.", on: true },
              { icon: Settings2, bg: "#ede9fe", color: "#7c3aed", label: "Rainy Day Upgrade", desc: "Switches to Premium on heavy rain days.", on: false },
              { icon: Banknote, bg: "#dcfce7", color: "#16a34a", label: "Surge Limit (₹500)", desc: "Pause auto-booking if surge exceeds limit.", on: true },
            ].map(({ icon: Icon, bg, color, label, desc, on }, i, arr) => (
              <div key={label} className="flex gap-3 pb-5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #ccfbf1" : "none" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>{label}</p>
                  <p className="text-[11px] font-medium mt-0.5 leading-relaxed" style={{ color: "#0f766e" }}>{desc}</p>
                </div>
                <Switch defaultChecked={on} className="data-[state=checked]:bg-teal-500 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>

          <div className="card p-5 mt-2" style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", borderColor: "#0f766e" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <p className="text-[13px] font-bold text-white uppercase tracking-wider">AI Insight</p>
            </div>
            <p className="text-[13px] text-teal-50 font-medium leading-relaxed mb-4">
              You are currently spending 15% more on surges on Tuesdays. Enabling &quot;Flexible Departure&quot; for Tuesdays could save you ₹400/month.
            </p>
            <button className="w-full py-2 rounded bg-white text-[12px] font-bold transition-all hover:bg-teal-50" style={{ color: "#0f766e" }}>
              Enable Flexible Departure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
