"use client";

import React, { useEffect } from "react";
import {
  MapPin, Star, Phone, MessageSquare,
  ShieldAlert, XCircle, RefreshCw
} from "lucide-react";
import { useDashboardStore } from "@/hooks/user/useDashboardStore";
import DriverChatModal from "@/components/user/rides/DriverChatModal";
import DriverCallModal from "@/components/user/rides/DriverCallModal";
import MobileDashboard from "@/components/user/mobile/MobileDashboard";
import { useDialog } from "@/components/ui/DialogProvider";
import CommuteCommandHero from "./CommuteCommandHero";
import WeeklyCommutePlanner from "./WeeklyCommutePlanner";
import QuickCommuteHub from "./QuickCommuteHub";
import CommuterPerksMetrics from "./CommuterPerksMetrics";
import RecentCommutesSnapshot from "./RecentCommutesSnapshot";

export default function DashboardPage() {
  const { confirm, alert } = useDialog();
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isCallOpen, setIsCallOpen] = React.useState(false);
  const {
    data,
    fetchDashboard,
    cancelRide,
    advanceRideStatus,
    toggleCommute,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const user = data?.user;
  const activeRide = data?.activeRide;
  const commutes = data?.commutes || [];
  const primaryCommute = commutes[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SEARCHING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Finding Nearest Driver...
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Driver Confirmed (ETA ~4 mins)
          </span>
        );
      case "ARRIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Driver at Pickup Point
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-teal-600 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            On Trip to Destination
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* ── Dedicated Mobile Dashboard (< 1024px) ── */}
      <div className="flex lg:hidden flex-col flex-1">
        <MobileDashboard
          data={data}
          greeting={greeting}
          cancelRide={cancelRide}
          advanceRideStatus={advanceRideStatus}
          toggleCommute={toggleCommute}
          setIsChatOpen={setIsChatOpen}
          setIsCallOpen={setIsCallOpen}
          getStatusBadge={getStatusBadge}
        />
      </div>

      {/* ── Desktop Dashboard (>= 1024px) — 100% Preserved ── */}
      <div className="hidden lg:flex flex-col gap-6 pb-8 flex-1">
        {/* ── Active Ride Live Tracker (If Active) ── */}
        {activeRide && (
        <div
          className="card p-6 border-2 flex flex-col gap-5 relative overflow-hidden transition-all shadow-md"
          style={{ borderColor: "#14b8a6", background: "#f0fdfa" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {getStatusBadge(activeRide.status)}
              <span className="text-[12px] font-semibold text-slate-500">
                Ride #{activeRide._id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => advanceRideStatus(activeRide._id)}
                title="Simulate Next Ride Status"
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-800 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={11} /> Simulate Progress
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
                  if (confirmed) {
                    await cancelRide(activeRide._id);
                  }
                }}
                className="px-3 py-1 rounded-md text-[12px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <XCircle size={13} /> Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Left: Driver Card */}
            <div className="p-4 rounded-xl bg-white border border-teal-100 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 border-2 border-teal-500 flex items-center justify-center font-bold text-teal-800 text-[15px] shrink-0">
                  {activeRide.driverDetails?.name?.split(" ")[0] || "Driver"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-[14px] truncate">{activeRide.driverDetails?.name || "Assigned Driver"}</p>
                    <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold">
                      <Star size={11} fill="currentColor" /> {activeRide.driverDetails?.rating || 4.9}
                    </div>
                  </div>
                  <p className="text-[12px] text-slate-500 truncate font-medium">
                    {activeRide.driverDetails?.vehicleModel} · {activeRide.driverDetails?.vehicleNumber}
                  </p>
                </div>
              </div>

              {/* Driver Contact Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsCallOpen(true)}
                  className="flex-1 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[12px] font-bold text-teal-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone size={13} /> Call Driver
                </button>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex-1 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[12px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                  className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[12px] font-semibold flex items-center justify-center transition-colors cursor-pointer"
                  title="Emergency SOS"
                >
                  <ShieldAlert size={14} />
                </button>
              </div>
            </div>

            {/* Middle: Route & Stops */}
            <div className="lg:col-span-2 flex flex-col justify-between gap-4 p-4 rounded-xl bg-white border border-teal-100">
              <div className="relative pl-6 flex flex-col gap-4">
                <div className="absolute left-2.5 top-2 bottom-4 w-0.5 bg-teal-200" />
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-teal-500 bg-white" />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-teal-600 tracking-wider">Pickup</p>
                    <p className="text-[14px] font-bold text-slate-900">{activeRide.pickup.address}</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 flex items-center justify-center">
                    <MapPin size={8} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-teal-600 tracking-wider">Destination</p>
                    <p className="text-[14px] font-bold text-slate-900">{activeRide.dropoff.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[13px]">
                <div className="flex items-center gap-4 text-slate-600">
                  <span>Vehicle: <strong className="text-slate-900">{activeRide.vehicleType}</strong></span>
                  <span>Distance: <strong className="text-slate-900">{activeRide.distance}</strong></span>
                </div>
                <div>
                  <span className="text-slate-500 mr-2">Estimated Fare:</span>
                  <span className="text-[16px] font-black text-teal-700">₹{activeRide.fare}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. Today's Ride Hero ── */}
      <CommuteCommandHero
        userName={user?.name}
        primaryCommute={primaryCommute}
        returnCommute={commutes[1]}
        onToggleActive={(id, active) => toggleCommute(id, active)}
      />

      {/* ── 2. "Where to?" Search + Quick Destinations ── */}
      <QuickCommuteHub savedPlaces={data?.savedPlaces} />

      {/* ── 3. Compact Stats Bar ── */}
      <CommuterPerksMetrics stats={data?.stats} />

      {/* ── 4. Weekly Commute Strip ── */}
      <WeeklyCommutePlanner
        commutes={commutes}
        onToggleCommute={(id, active) => toggleCommute(id, active)}
      />

      {/* ── 5. Recent Rides ── */}
      <RecentCommutesSnapshot recentRides={data?.recentRides} />
      </div>

      {/* Driver Chat Modal */}
      {activeRide && (
        <DriverChatModal
          rideId={activeRide._id}
          driverName={activeRide.driverDetails?.name || "Bhavo Pilot"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || "DL-01-AB-1234"}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onCallDriver={() => {
            setIsChatOpen(false);
            setIsCallOpen(true);
          }}
        />
      )}

      {/* Driver Call Modal */}
      {activeRide && (
        <DriverCallModal
          driverName={activeRide.driverDetails?.name || "Bhavo Pilot"}
          driverPhone={activeRide.driverDetails?.phone || "+91 98765 43210"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleModel={activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || "DL-01-AB-1234"}
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
        />
      )}
    </div>
  );
}
