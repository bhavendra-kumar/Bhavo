"use client";

import React, { useState } from "react";
import { Bell, Zap, MapPin, Gift, ShieldAlert, Check } from "lucide-react";

const FILTERS = ["All", "Rides", "AI Alerts", "Offers"];

const NOTIFICATIONS = [
  {
    id: 1,
    type: "AI Alerts",
    title: "Smart Schedule Adjusted",
    message: "Your evening commute has been pushed back 15 mins due to heavy rain and traffic.",
    time: "10 mins ago",
    icon: Zap,
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    glow: "rgba(245,158,11,0.3)",
    unread: true,
  },
  {
    id: 2,
    type: "Rides",
    title: "Ride Completed",
    message: "Your ride to Bhavo HQ is complete. ₹380 deducted from your wallet.",
    time: "2 hours ago",
    icon: MapPin,
    gradient: "linear-gradient(135deg, #0d9488, #059669)",
    glow: "rgba(13,148,136,0.3)",
    unread: false,
  },
  {
    id: 3,
    type: "Offers",
    title: "Green Commuter Reward 🎁",
    message: "You've unlocked 10% off your next 3 rides for consistently choosing Eco vehicles!",
    time: "Yesterday",
    icon: Gift,
    gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    glow: "rgba(139,92,246,0.3)",
    unread: false,
  },
  {
    id: 4,
    type: "All",
    title: "New Login Detected",
    message: "We noticed a new login from a Mac device in Bangalore.",
    time: "2 days ago",
    icon: ShieldAlert,
    gradient: "linear-gradient(135deg, #e11d48, #f43f5e)",
    glow: "rgba(244,63,94,0.3)",
    unread: false,
  },
];

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? NOTIFICATIONS
    : NOTIFICATIONS.filter((n) => n.type === activeFilter);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
            >
              <Bell size={18} className="text-white" />
            </div>
            Notifications
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Stay up-to-date with your rides and AI alerts.</p>
        </div>
        <button className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors">
          <Check size={14} /> Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex bg-white p-1.5 rounded-2xl w-full md:w-max overflow-x-auto no-scrollbar gap-1"
        style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)" }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="flex-1 md:flex-none px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
            style={{
              background: activeFilter === f ? "#0f172a" : "transparent",
              color: activeFilter === f ? "white" : "#94a3b8",
              boxShadow: activeFilter === f ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
      >
        {filtered.map((notif, idx) => (
          <div
            key={notif.id}
            className="flex items-start gap-4 px-5 py-5 cursor-pointer hover:bg-slate-50 transition-colors relative"
            style={{
              borderBottom: idx < filtered.length - 1 ? "1px solid rgba(15,23,42,0.05)" : "none",
              background: notif.unread ? "rgba(13,148,136,0.02)" : "transparent",
            }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: notif.gradient, boxShadow: `0 4px 14px ${notif.glow}` }}
            >
              <notif.icon size={18} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-1">
                <h4
                  className="text-sm truncate"
                  style={{ fontWeight: notif.unread ? 700 : 600, color: notif.unread ? "#0f172a" : "#334155" }}
                >
                  {notif.title}
                </h4>
                <span className="text-xs font-medium text-slate-400 shrink-0">{notif.time}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
            </div>

            {/* Unread dot */}
            {notif.unread && (
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                style={{ background: "#14b8a6", boxShadow: "0 0 8px rgba(20,184,166,0.6)" }}
              />
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center text-center text-slate-400">
            <Bell size={32} className="mb-3 opacity-30" />
            <p className="font-bold text-sm">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
