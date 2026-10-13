"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin, Star, Phone, MessageSquare,
  ShieldAlert, XCircle, RefreshCw, Radio, Navigation
} from "lucide-react";
import { IDashboardData } from "@/hooks/user/useDashboardStore";
import { useDialog } from "@/components/ui/DialogProvider";
import CommuteCommandHero from "@/components/user/dashboard/CommuteCommandHero";
import QuickCommuteHub from "@/components/user/dashboard/QuickCommuteHub";
import CommuterPerksMetrics from "@/components/user/dashboard/CommuterPerksMetrics";
import WeeklyCommutePlanner from "@/components/user/dashboard/WeeklyCommutePlanner";
import RecentCommutesSnapshot from "@/components/user/dashboard/RecentCommutesSnapshot";

interface MobileDashboardProps {
  data: IDashboardData | null;
  greeting: string;
  cancelRide: (id: string) => Promise<boolean>;
  refreshActiveRide?: (id: string) => Promise<boolean>;
  advanceRideStatus: (id: string) => Promise<boolean>;
  toggleCommute: (id: string, active: boolean) => Promise<void>;
  setIsChatOpen: (val: boolean) => void;
  setIsCallOpen: (val: boolean) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function MobileDashboard({
  data,
  cancelRide,
  refreshActiveRide,
  advanceRideStatus,
  toggleCommute,
  setIsChatOpen,
  setIsCallOpen,
  getStatusBadge,
}: MobileDashboardProps) {
  const { confirm, alert } = useDialog();
  const user = data?.user;
  const activeRide = data?.activeRide;
  const commutes = data?.commutes || [];
  const primaryCommute = commutes[0];

  return (
    <div className="flex flex-col gap-4 pb-8 flex-1 select-none">
      {/* ── 1. Live Active Ride Tracker Card (If Active) ── */}
      {activeRide && activeRide.status !== "COMPLETED" && (
        <div className="card p-4 border-2 border-teal-500 bg-teal-50/40 flex flex-col gap-3 shadow-md">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            {getStatusBadge(activeRide.status)}
            <span className="text-[11px] font-mono font-bold text-slate-500">
              #{activeRide._id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* If SEARCHING, show dispatch radar card */}
          {activeRide.status === "SEARCHING" ? (
            <div className="p-4 rounded-xl bg-white border border-teal-200 flex flex-col items-center text-center gap-3">
              <div className="relative flex items-center justify-center py-2">
                <span className="absolute w-12 h-12 rounded-full bg-teal-400/30 animate-ping" />
                <div className="relative w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md">
                  <Radio size={18} className="animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <p className="font-extrabold text-[13px] text-slate-900">Broadcasting to Nearby Pilots...</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Finding nearest Bhavo Captain for your {activeRide.vehicleType}</p>
              </div>
            </div>
          ) : (
            /* Pilot Info & PIN */
            <div className="p-3 rounded-xl bg-white border border-teal-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "R"}
                  </div>
                  <div>
                    <p className="font-bold text-[14px] text-slate-900 leading-tight">
                      {activeRide.driverDetails?.name || "Assigned Pilot"}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-medium">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span>{activeRide.driverDetails?.rating || 4.9}</span>
                      <span>•</span>
                      <span>{activeRide.driverDetails?.vehicleModel || "Bhavo Fleet"}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-black text-slate-800 border border-slate-200">
                  {activeRide.driverDetails?.vehicleNumber || "Assigned"}
                </span>
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
          )}

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

          {/* Quick Tracking & Status Row */}
          <div className="flex items-center gap-2">
            <Link
              href="/user/book-ride"
              className="flex-1 py-2 rounded-lg bg-teal-600 active:bg-teal-700 text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Track live driver approach and route progress"
            >
              <Navigation size={12} /> Track Live
            </Link>
            <button
              type="button"
              onClick={() => (refreshActiveRide ? refreshActiveRide(activeRide._id) : advanceRideStatus(activeRide._id))}
              className="py-2 px-3 rounded-lg bg-teal-100 active:bg-teal-200 text-teal-900 text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh authoritative ride status from server"
            >
              <RefreshCw size={12} /> Refresh
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

      {/* ── 2. Today's Ride Hero Card ── */}
      <CommuteCommandHero
        userName={user?.name}
        primaryCommute={primaryCommute}
        returnCommute={commutes[1]}
        onToggleActive={(id, active) => toggleCommute(id, active)}
      />

      {/* ── 3. Interactive Pickup & Drop-off Search Dock ── */}
      <QuickCommuteHub savedPlaces={data?.savedPlaces} />

      {/* ── 4. Compact Stats Bar ── */}
      <CommuterPerksMetrics stats={data?.stats} />

      {/* ── 5. Weekly Commute Strip ── */}
      <WeeklyCommutePlanner
        commutes={commutes}
        onToggleCommute={(id, active) => toggleCommute(id, active)}
      />

      {/* ── 6. Recent Rides ── */}
      <RecentCommutesSnapshot recentRides={data?.recentRides} />
    </div>
  );
}
