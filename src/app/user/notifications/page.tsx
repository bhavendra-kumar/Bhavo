"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell, CheckCheck, Trash2, ArrowRight,
  Wallet, CarFront, CalendarClock, ShieldCheck, Clock
} from "lucide-react";
import { NotificationItem } from "@/components/user/Navbar";

const FULL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Wallet Cashback Credited",
    message: "₹50 promotional cashback has been credited to your Bhavo Wallet from your previous weekday rides!",
    time: "5 minutes ago",
    read: false,
    type: "wallet",
    href: "/user/wallet",
  },
  {
    id: "notif-2",
    title: "Smart Commute Route Alert",
    message: "Traffic is moving 15% faster on your usual morning route today. Estimated travel time reduced to 18 mins.",
    time: "25 minutes ago",
    read: false,
    type: "commute",
    href: "/user/my-commute",
  },
  {
    id: "notif-3",
    title: "Trip Safety & SOS Verified",
    message: "24/7 SOS safety, pilot background verification, and live journey sharing are active for your security.",
    time: "2 hours ago",
    read: false,
    type: "system",
    href: "/user/support",
  },
  {
    id: "notif-4",
    title: "Ride Completed Receipt",
    message: "Your trip from Connaught Place to Sector 44 has ended. Fare of ₹240 paid via Bhavo Wallet. Rating: 5 stars.",
    time: "Yesterday, 6:40 PM",
    read: true,
    type: "ride",
    href: "/user/trips",
  },
  {
    id: "notif-5",
    title: "Welcome to Bhavo Smart Commute",
    message: "Your commuter account is active! Enjoy zero-surge daily bookings, verified pilots, and doorstep pickup.",
    time: "3 days ago",
    read: true,
    type: "system",
    href: "/user/dashboard",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(FULL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread" | "wallet" | "ride">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "wallet") return n.type === "wallet";
    if (filter === "ride") return n.type === "ride";
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Bell size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-black text-slate-900">Notification Center</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Live updates on your rides, daily commutes, wallet cashbacks, and safety alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(
          [
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "wallet", label: "Wallet & Cashbacks" },
            { id: "ride", label: "Rides & Trips" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer border ${
              filter === tab.id
                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800">No notifications found</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {filter === "unread"
                  ? "You have read all your notifications!"
                  : "Notifications for this category will appear here."}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !notif.read
                  ? "bg-teal-50/40 border-teal-200 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === "wallet"
                      ? "bg-amber-100 text-amber-700"
                      : notif.type === "ride"
                      ? "bg-teal-100 text-teal-700"
                      : notif.type === "commute"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {notif.type === "wallet" ? (
                    <Wallet size={18} />
                  ) : notif.type === "ride" ? (
                    <CarFront size={18} />
                  ) : notif.type === "commute" ? (
                    <CalendarClock size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-slate-900 truncate">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                    <Clock size={11} /> {notif.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleRead(notif.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  {notif.read ? "Mark unread" : "Mark read"}
                </button>
                {notif.href && (
                  <Link
                    href={notif.href}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                  >
                    Open <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
