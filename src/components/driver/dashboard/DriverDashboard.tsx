"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import DriverDutyHero from "./DriverDutyHero";
import DriverMetricsGrid from "./DriverMetricsGrid";
import IncomingDispatchModal from "./IncomingDispatchModal";
import ActiveTripManager from "./ActiveTripManager";
import RecentDriverTrips from "./RecentDriverTrips";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

const DriverHeatmap = dynamic(() => import("./DriverHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-88 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center text-slate-400 font-semibold text-sm">
      Loading Driver Live Map & Surge Zones...
    </div>
  ),
});
import Link from "next/link";
import {
  Compass,
  Headphones,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DriverDashboard() {
  const { activeRide, isOnline, pollDispatches, updateLocation, fetchDriverData, verification } = useDriverStore();
  const { alert } = useDialog();

  // Fetch initial real backend data from MongoDB
  useEffect(() => {
    fetchDriverData();
    const refreshTimer = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchDriverData();
      }
    }, 6000);

    return () => clearInterval(refreshTimer);
  }, [fetchDriverData]);

  // Real-time dispatch listener polling
  useEffect(() => {
    if (!isOnline || activeRide || !verification?.isVerified) return;

    let isPolling = false;
    const executePoll = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (isPolling) return;
      isPolling = true;
      try {
        await pollDispatches();
      } finally {
        isPolling = false;
      }
    };

    executePoll();
    const interval = setInterval(executePoll, 1500);

    return () => clearInterval(interval);
  }, [isOnline, activeRide, pollDispatches, verification?.isVerified]);

  // Live telemetry updater during active trip
  useEffect(() => {
    if (!activeRide) return;

    const interval = setInterval(() => {
      // Simulate minor vehicle GPS updates
      const targetCoords =
        activeRide.status === "ACCEPTED" || activeRide.status === "ARRIVED"
          ? activeRide.pickup.coordinates
          : activeRide.dropoff.coordinates;

      if (targetCoords) {
        const deltaLat = (Math.random() - 0.5) * 0.0003;
        const deltaLng = (Math.random() - 0.5) * 0.0003;
        updateLocation([targetCoords[0] + deltaLat, targetCoords[1] + deltaLng]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRide, updateLocation]);

  const handleDestinationMode = () => {
    alert({
      title: "Driver Destination Mode (Heading Home)",
      message:
        "Destination filter enabled! You will only be dispatched rides heading in your direction (Home: Sector 62, Noida). 2 destination filters remaining today.",
      confirmText: "Activate Destination Filter",
      variant: "info",
    });
  };

  return (
    <div className="flex flex-col gap-6 flex-1 pb-10">
      {/* ── Incoming Ride Dispatch Overlay Modal ── */}
      <IncomingDispatchModal />

      {/* ── Document Compliance Warning Banner (When Unverified) ── */}
      {verification && !verification.isVerified && (
        <div className="bg-linear-to-r from-amber-500/15 via-amber-500/10 to-rose-500/10 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={22} className="text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-[15px] text-slate-900">
                  Compliance Action Required: Documents Under Verification
                </h3>
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Duty Restricted
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                All vehicle and driver identity documents must be 100% verified by Bhavo Compliance before coming online. Until verification is complete, ride dispatches and acceptance remain strictly locked.
              </p>
              <div className="flex items-center gap-4 mt-2.5 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${verification.driverDocsVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
                  Driver Documents: {verification.driverDocsVerified ? "Verified" : "Pending Action"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${verification.vehicleDocsVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
                  Vehicle Documents: {verification.vehicleDocsVerified ? "Verified" : "Pending Action"}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/driver/vehicle"
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <span>Review & Verify Documents</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Driver Duty Control & Status Hero ── */}
      <DriverDutyHero />

      {/* ── 4-Bento Driver Shift Metrics Grid (Live from DB) ── */}
      <DriverMetricsGrid />

      {/* ── Active Ride Commander (If Ride in Progress) ── */}
      {activeRide && <ActiveTripManager />}

      {/* ── Main Operations Row: Map & Recent Trips ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Surge Radar & Map */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <DriverHeatmap />
          <RecentDriverTrips />
        </div>

        {/* Right 1 Col: Quick Captain Tools & Safety Hub */}
        <div className="flex flex-col gap-6">
          {/* Destination Filter Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Compass size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px] text-slate-900">
                  Destination Mode
                </h4>
                <p className="text-xs text-slate-500">Only get rides heading towards home</p>
              </div>
            </div>

            <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Home Address
              </span>
              <p className="font-bold text-slate-800 mt-0.5">
                Block C, Sector 62, Noida
              </p>
            </div>

            <button
              onClick={handleDestinationMode}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Set Route Filter (2 left)</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 24/7 Road Assistance Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Headphones size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-[14px] text-slate-900">
                  24/7 Captain Helpline
                </h4>
                <p className="text-[11px] text-slate-500">Instant roadside or trip emergency</p>
              </div>
            </div>

            <a
              href="tel:1800123456"
              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-colors shrink-0"
            >
              Call Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
