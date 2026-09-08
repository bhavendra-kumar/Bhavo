"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, Clock, MapPin, CarFront, Route,
  CalendarClock, ArrowRight, Star, Dog, Plus, Phone, MessageSquare,
  ShieldAlert, XCircle, RefreshCw, Zap
} from "lucide-react";
import { IDashboardData } from "@/hooks/user/useDashboardStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface MobileDashboardProps {
  data: IDashboardData | null;
  greeting: string;
  cancelRide: (id: string) => Promise<boolean>;
  advanceRideStatus: (id: string) => Promise<boolean>;
  toggleCommute: (id: string, active: boolean) => Promise<void>;
  setIsChatOpen: (val: boolean) => void;
  setIsCallOpen: (val: boolean) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function MobileDashboard({
  data,
  greeting,
  cancelRide,
  advanceRideStatus,
  toggleCommute,
  setIsChatOpen,
  setIsCallOpen,
  getStatusBadge,
}: MobileDashboardProps) {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const user = data?.user;
  const activeRide = data?.activeRide;
  const commutes = data?.commutes || [];
  const primaryCommute = commutes[0];

  return (
    <div className="flex flex-col gap-4 pb-8 flex-1 select-none">
      {/* ── 1. Live Active Ride Tracker Card (If Active) ── */}
      {activeRide && (
        <div className="card p-4 border-2 border-teal-500 bg-teal-50/40 flex flex-col gap-3 shadow-md">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            {getStatusBadge(activeRide.status)}
            <span className="text-[11px] font-mono font-bold text-slate-500">
              #{activeRide._id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Pilot Info & PIN */}
          <div className="p-3 rounded-xl bg-white border border-teal-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "B"}
                </div>
                <div>
                  <p className="font-bold text-[14px] text-slate-900 leading-tight">
                    {activeRide.driverDetails?.name || "Bhavo Pilot"}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-medium">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span>{activeRide.driverDetails?.rating || 4.9}</span>
                    <span>•</span>
                    <span>{activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}</span>
                  </div>
                </div>
              </div>

              {activeRide.driverDetails?.vehicleNumber && (
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-black text-slate-800 border border-slate-200">
                  {activeRide.driverDetails.vehicleNumber}
                </span>
              )}
            </div>

            {/* Start Ride PIN */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200">
              <div>
                <p className="text-[9.5px] uppercase font-bold text-teal-800 tracking-wider">Start PIN</p>
                <p className="text-[11px] text-teal-700">Share with driver on pickup</p>
              </div>
              <div className="px-3 py-0.5 bg-white rounded-md border border-teal-300 font-mono text-lg font-black text-teal-900 tracking-widest shadow-xs">
                {activeRide.otp}
              </div>
            </div>

            {/* Calling & Messaging Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsCallOpen(true)}
                className="col-span-2 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-transform cursor-pointer"
              >
                <Phone size={13} /> Call Driver
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-bold flex items-center justify-center gap-1 border border-slate-200 active:scale-98 transition-transform cursor-pointer"
              >
                <MessageSquare size={13} /> Chat
              </button>
              <button
                type="button"
                onClick={() =>
                  alert({
                    title: "Emergency SOS",
                    message: "Safety team and emergency services have been alerted.",
                    variant: "danger",
                  })
                }
                className="py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold flex items-center justify-center active:scale-98 transition-transform cursor-pointer"
                title="Emergency SOS"
              >
                <ShieldAlert size={15} />
              </button>
            </div>
          </div>

          {/* Route path */}
          <div className="p-3 rounded-xl bg-white border border-teal-100 flex flex-col gap-2">
            <div className="relative pl-5 flex flex-col gap-2 text-[12px]">
              <div className="absolute left-2 top-1.5 bottom-2 w-0.5 bg-teal-200" />
              <div className="relative flex items-start gap-2">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-teal-500 bg-white" />
                <p className="font-semibold text-slate-900 line-clamp-1">{activeRide.pickup.address}</p>
              </div>
              <div className="relative flex items-start gap-2">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-600 flex items-center justify-center">
                  <MapPin size={7} className="text-white" />
                </div>
                <p className="font-semibold text-slate-900 line-clamp-1">{activeRide.dropoff.address}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[12px]">
              <span className="text-slate-500">Trip Fare: <strong className="text-teal-700 text-[14px]">₹{activeRide.fare}</strong></span>
              <span className="text-slate-500">Distance: <strong className="text-slate-800">{activeRide.distance}</strong></span>
            </div>
          </div>

          {/* Quick Simulation & Cancel Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => advanceRideStatus(activeRide._id)}
              className="flex-1 py-2 rounded-lg bg-teal-100 active:bg-teal-200 text-teal-900 text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Advance Status
            </button>
            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Cancel ride?",
                  message: "Your driver is already on the way.",
                  confirmText: "Cancel ride",
                  cancelText: "Keep ride",
                  variant: "danger",
                });
                if (confirmed) await cancelRide(activeRide._id);
              }}
              className="py-2 px-3 rounded-lg bg-rose-50 active:bg-rose-100 text-rose-600 border border-rose-200 text-[11.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Greeting & Daily Commute Context Card ── */}
      <div className="card p-4.5 bg-linear-to-br from-white via-white to-teal-50/60 border border-teal-100 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="pill-teal text-[11px]">
            <Sparkles size={11} /> Auto Booking: {primaryCommute?.isActive ? "Active" : "Paused"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </span>
        </div>

        <div>
          <h2 className="text-[18px] font-black text-slate-900 tracking-tight leading-snug">
            {greeting}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h2>
          <p className="text-[12.5px] text-slate-600 font-medium mt-1 leading-relaxed">
            Next smart commute scheduled for{" "}
            <strong className="text-teal-700">{primaryCommute?.time || "8:45 AM"}</strong>.
          </p>
        </div>

        {/* Quick Route Status Strip */}
        <div className="p-3 rounded-xl bg-linear-to-r from-teal-50 to-emerald-50/60 border border-teal-200/80 flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-teal-950 truncate">Route Timing Calibrated</p>
              <p className="text-[10.5px] text-teal-700 truncate font-medium">Moderate traffic on primary corridor</p>
            </div>
          </div>

          <Link
            href="/user/my-commute"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 bg-white hover:bg-teal-50 px-3 py-1.5 rounded-full border border-teal-300/80 shadow-xs shrink-0 active:scale-95 transition-all"
          >
            <span>View</span>
            <ArrowRight size={11} className="text-teal-600" />
          </Link>
        </div>
      </div>

      {/* ── 3. Quick Action Grid (Rapido / Ola Style Big Touch Targets) ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-[14px] font-black text-slate-900 tracking-tight">Book or Commute</h3>
          <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
            Doorstep Rides
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Book Instant Ride", desc: "Cab, Bike, Auto", icon: CarFront, href: "/user/book-ride", badge: "Live GPS" },
            { label: "Daily Commute", desc: "Automated schedule", icon: CalendarClock, href: "/user/my-commute", badge: "Zero-Surge" },
            { label: "Schedule Ride", desc: "Pre-book a pilot", icon: Route, href: "/user/book-ride?tab=schedule", badge: "Guaranteed" },
            { label: "Pet-Friendly Ride", desc: "Travel with pets", icon: Dog, href: "/user/book-ride?tab=pet", badge: "Safe" },
          ].map(({ label, desc, icon: Icon, href, badge }, i) => (
            <button
              key={label}
              type="button"
              onClick={() => router.push(href)}
              className={`p-3.5 rounded-2xl flex flex-col justify-between text-left transition-all active:scale-[0.97] cursor-pointer border ${
                i === 0
                  ? "bg-linear-to-br from-[#064e3b] via-[#042f2e] to-[#022120] text-white border-teal-700/60 shadow-[0_4px_16px_rgba(6,78,59,0.25)]"
                  : "bg-white text-slate-900 border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-teal-200"
              }`}
              style={{ minHeight: "108px" }}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    i === 0 ? "bg-white/15 text-teal-200" : "bg-teal-50 text-teal-700 border border-teal-100/60"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span
                  className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    i === 0
                      ? "bg-teal-400 text-teal-950 font-extrabold shadow-xs"
                      : "bg-teal-50 text-teal-700 border border-teal-200/60"
                  }`}
                >
                  {badge}
                </span>
              </div>

              <div className="mt-2">
                <p className={`text-[13px] font-bold leading-tight ${i === 0 ? "text-white" : "text-slate-900"}`}>
                  {label}
                </p>
                <p className={`text-[10.5px] mt-0.5 font-medium ${i === 0 ? "text-teal-200/90" : "text-slate-500"}`}>
                  {desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Scheduled Commutes Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-[14px] font-black text-slate-900 tracking-tight">Your Commute Routines</h3>
          <button
            type="button"
            onClick={() => router.push("/user/my-commute")}
            className="flex items-center gap-1 text-[11.5px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200/60 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={12} /> Add New
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {commutes.length === 0 ? (
            <div className="card p-4 text-center text-[12px] text-slate-500 bg-white">
              No commute schedules set. Add your daily routine to automate weekday transit.
            </div>
          ) : (
            commutes.slice(0, 3).map((commute) => (
              <div key={commute._id} className="card p-3.5 bg-white border border-teal-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col gap-2.5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8.5 h-8.5 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <CarFront size={16} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{commute.title}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock size={10} className="text-teal-600" /> {commute.time} · {commute.days?.join(", ") || "Weekdays"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleCommute(commute._id, !commute.isActive)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      commute.isActive ? "bg-teal-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        commute.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11.5px]">
                  <p className="font-medium text-slate-600 truncate max-w-42.5 flex items-center gap-1">
                    <MapPin size={11} className="text-teal-600 shrink-0" />
                    <span className="truncate">{commute.dropoff?.address}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (commute.dropoff?.address) params.set("dest", commute.dropoff.address);
                      if (
                        typeof commute.dropoff?.coordinates?.[0] === "number" &&
                        typeof commute.dropoff?.coordinates?.[1] === "number" &&
                        !isNaN(commute.dropoff.coordinates[0]) &&
                        !isNaN(commute.dropoff.coordinates[1])
                      ) {
                        params.set("lat", String(commute.dropoff.coordinates[0]));
                        params.set("lng", String(commute.dropoff.coordinates[1]));
                      }
                      router.push(`/user/book-ride?${params.toString()}`);
                    }}
                    className="px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    Ride Now <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
