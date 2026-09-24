"use client";

import React from "react";
import dynamic from "next/dynamic";
import DriverDutyHero from "./DriverDutyHero";
import IncomingDispatchModal from "./IncomingDispatchModal";
import ActiveTripManager from "./ActiveTripManager";
import DriverMetricsGrid from "./DriverMetricsGrid";
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
import {
  Compass,
  Fuel,
  Headphones,
  ChevronRight,
} from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DriverDashboard() {
  const { activeRide } = useDriverStore();
  const { alert } = useDialog();

  const handleDestinationMode = () => {
    alert({
      title: "Driver Destination Mode (Heading Home)",
      message:
        "Destination filter enabled! You will only be dispatched rides heading in your direction (Home: Sector 62, Noida). 2 destination filters remaining today.",
      confirmText: "Activate Destination Filter",
      variant: "info",
    });
  };

  const handleEvPartnerHub = () => {
    alert({
      title: "Bhavo Captain EV & Fuel Partner Network",
      message:
        "Enjoy flat 15% cashback on fast DC charging at all Tata Power EV stations & ₹2.50/L rebate on HPCL fuel with your Bhavo Captain Fleet Card.",
      confirmText: "Got It",
      variant: "info",
    });
  };

  return (
    <div className="flex flex-col gap-6 flex-1 pb-10">
      {/* ── Incoming Ride Dispatch Overlay Modal ── */}
      <IncomingDispatchModal />

      {/* ── Driver Duty Control & Status Hero ── */}
      <DriverDutyHero />

      {/* ── Active Ride Commander (If Ride in Progress) ── */}
      {activeRide && <ActiveTripManager />}

      {/* ── Shift Metrics & Performance Grid ── */}
      <DriverMetricsGrid />

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

          {/* EV Charging & Partner Hub */}
          <div className="bg-linear-to-br from-emerald-950 to-[#042f2e] rounded-3xl p-5 border border-emerald-500/30 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PARTNER PERKS
                </span>
                <Fuel size={18} className="text-emerald-400" />
              </div>

              <h4 className="font-black text-lg text-white mt-3">
                15% EV Fast Charge Rebate
              </h4>
              <p className="text-xs text-emerald-100/70 mt-1">
                Show your Bhavo Captain ID at any Tata Power or Statiq charging hub to redeem instant discount.
              </p>
            </div>

            <button
              onClick={handleEvPartnerHub}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Find Nearby Partner Stations</span>
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
