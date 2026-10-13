"use client";

import React from "react";
import {
  MapPin, Star, Phone, MessageSquare, XCircle, RefreshCw, Radio
} from "lucide-react";
import type { ActiveRide } from "./types";

interface DesktopActiveRideCardProps {
  activeRide: ActiveRide;
  isRefreshing: boolean;
  onRefreshStatus: () => void;
  onCancelRide: () => void;
  onCallDriver: () => void;
  onChatDriver: () => void;
}

export default function DesktopActiveRideCard({
  activeRide,
  isRefreshing,
  onRefreshStatus,
  onCancelRide,
  onCallDriver,
  onChatDriver,
}: DesktopActiveRideCardProps) {
  const driverName = activeRide.driverDetails?.name || "Bhavo Pilot";
  const driverInitial = driverName ? driverName[0] : "B";

  return (
    <div className="card p-5 border-2 border-teal-500 bg-teal-50/40 flex flex-col gap-4 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
          {activeRide.status === "SEARCHING"
            ? "Searching Nearest Driver..."
            : activeRide.status === "ACCEPTED"
              ? "Driver Confirmed (En Route)"
              : activeRide.status === "ARRIVED"
                ? "Driver Arrived at Pickup Point"
                : "Trip In Progress"}
        </span>

        <span className="text-[12px] font-mono text-slate-500">
          #{activeRide._id.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Driver Details Card */}
      {activeRide.status === "SEARCHING" ? (
        <div className="p-6 rounded-2xl bg-white border border-teal-100 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 text-teal-600">
            <span className="absolute w-full h-full rounded-full bg-teal-400/30 animate-ping" />
            <Radio size={26} className="relative z-10 animate-pulse text-teal-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-[15px] text-slate-900">
              Broadcasting to Nearest Captains
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Connecting with nearby Bhavo Captains in Sector 62 / NCR. Awaiting driver acceptance.
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-linear-to-r from-teal-400 to-emerald-500 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white border border-teal-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-bold text-lg flex items-center justify-center">
                {driverInitial}
              </div>
              <div>
                <p className="font-bold text-[15px] text-slate-900">{driverName}</p>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{activeRide.driverDetails?.rating || 4.9}</span>
                  <span>•</span>
                  <span>{activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}</span>
                </div>
              </div>
            </div>

            {activeRide.driverDetails?.vehicleNumber && (
              <span className="px-2.5 py-1 rounded bg-slate-100 font-mono text-[12px] font-bold text-slate-800 border border-slate-200">
                {activeRide.driverDetails.vehicleNumber}
              </span>
            )}
          </div>

          {/* OTP Pin */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-200">
            <div>
              <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Start PIN</p>
              <p className="text-[11px] text-teal-700">Share with captain on arrival</p>
            </div>
            <div className="px-3.5 py-1 bg-white rounded-lg border border-teal-300 font-mono text-xl font-black text-teal-900 tracking-widest shadow-sm">
              {activeRide.otp}
            </div>
          </div>

          {/* Real-Time Calling & Chat Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onCallDriver}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-98 cursor-pointer"
            >
              <Phone size={14} /> Call Driver
            </button>
            <button
              type="button"
              onClick={onChatDriver}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-98 cursor-pointer"
            >
              <MessageSquare size={14} /> Message Driver
            </button>
          </div>
        </div>
      )}

      {/* Route Summary */}
      <div className="p-4 rounded-xl bg-white border border-teal-100 flex flex-col gap-3">
        <div className="relative pl-6 flex flex-col gap-3">
          <div className="absolute left-2.5 top-2 bottom-3 w-0.5 bg-teal-200" />
          <div className="relative flex items-start gap-2">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-teal-500 bg-white" />
            <div>
              <p className="text-[11px] font-bold uppercase text-teal-600">Pickup</p>
              <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{activeRide.pickup.address}</p>
            </div>
          </div>
          <div className="relative flex items-start gap-2">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 flex items-center justify-center">
              <MapPin size={8} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-teal-600">Destination</p>
              <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{activeRide.dropoff.address}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[13px]">
          <span className="text-slate-500">Trip Fare: <strong className="text-teal-700 text-[16px]">₹{activeRide.fare}</strong></span>
          <span className="text-slate-500">Distance: <strong className="text-slate-800">{activeRide.distance}</strong></span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRefreshStatus}
          disabled={isRefreshing}
          className="flex-1 py-2 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Status"}</span>
        </button>
        <button
          type="button"
          onClick={onCancelRide}
          className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <XCircle size={14} /> Cancel Ride
        </button>
      </div>
    </div>
  );
}
