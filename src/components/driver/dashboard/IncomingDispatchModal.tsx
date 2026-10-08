"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Star,
  Clock,
  Flame,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

export default function IncomingDispatchModal() {
  const { incomingDispatch, acceptDispatch, declineDispatch, verification } = useDriverStore();
  const { alert } = useDialog();
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!incomingDispatch) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          declineDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setSecondsLeft(15);
    };
  }, [incomingDispatch, declineDispatch]);

  if (!incomingDispatch) return null;

  const handleAccept = async () => {
    if (verification && !verification.isVerified) {
      declineDispatch();
      alert({
        title: "Cannot Accept Ride",
        message:
          verification.reason ||
          "All vehicle and driver identity documents must be verified before accepting rides.",
        confirmText: "Go to Vehicle & Documents",
        variant: "warning",
      });
      return;
    }

    setIsAccepting(true);
    await acceptDispatch((reason) => {
      alert({
        title: "Ride Acceptance Blocked",
        message: reason || "Document verification required.",
        confirmText: "Understood",
        variant: "warning",
      });
    });
    setIsAccepting(false);
  };

  const progressPercent = (secondsLeft / 15) * 100;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ zIndex: 9999 }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-teal-500/30 flex flex-col my-auto">
        {/* Animated Countdown Progress Bar at Top */}
        <div className="h-2 w-full bg-slate-100 shrink-0">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              secondsLeft <= 5 ? "bg-rose-500" : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 bg-linear-to-r from-teal-900 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <h3 className="font-extrabold text-[16px] tracking-wide uppercase text-teal-100">
              New Ride Request
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-teal-200">
              Auto-declines in:
            </span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[13px] text-white shadow-xs ${
                secondsLeft <= 5 ? "bg-rose-500 animate-bounce" : "bg-emerald-600"
              }`}
            >
              {secondsLeft}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto overscroll-contain flex-1">
          {/* Estimated Driver Fare Box */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50/80 border border-teal-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">
                Estimated Net Earning
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-slate-900">
                  ₹{incomingDispatch.fare}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({incomingDispatch.paymentMethod} Payment)
                </span>
              </div>
            </div>

            <div className="text-right space-y-1">
              {incomingDispatch.surgeMultiplier > 1 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold border border-amber-300">
                  <Flame size={12} className="text-amber-600" />
                  {incomingDispatch.surgeMultiplier}x Surge
                </div>
              )}
              <span className="block text-[11px] font-bold text-teal-700">
                {incomingDispatch.vehicleType}
              </span>
            </div>
          </div>

          {/* Passenger Info */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Avatar className="w-11 h-11 rounded-full border-2 border-teal-500/40">
                <AvatarImage src={incomingDispatch.riderAvatar || ""} />
                <AvatarFallback className="bg-teal-700 text-white font-bold">
                  {incomingDispatch.riderName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-extrabold text-slate-800 text-[15px]">
                  {incomingDispatch.riderName}
                </h4>
                <div className="flex items-center text-[12px] font-semibold text-slate-500 gap-2">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star size={12} className="fill-amber-400 mr-0.5" />
                    {incomingDispatch.riderRating}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck size={12} /> Verified Passenger
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">Pickup ETA</span>
              <span className="text-[14px] font-extrabold text-slate-800 flex items-center justify-end gap-1">
                <Clock size={13} className="text-teal-600" />
                ~{incomingDispatch.pickup.etaMinutes} mins
              </span>
            </div>
          </div>

          {/* Route Details (Pickup & Dropoff) */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>PICKUP ({incomingDispatch.pickup.distanceText})</span>
                </div>
                <p className="text-[13px] font-bold text-slate-800 truncate">
                  {incomingDispatch.pickup.address}
                </p>
              </div>
            </div>

            {/* Connecting dashed line */}
            <div className="ml-2.5 w-0.5 h-3 border-l-2 border-dashed border-slate-300" />

            {/* Dropoff */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 border border-rose-300">
                <MapPin size={12} className="text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>DESTINATION ({incomingDispatch.dropoff.distanceText})</span>
                  <span>~{incomingDispatch.dropoff.estDurationMinutes} mins trip</span>
                </div>
                <p className="text-[13px] font-bold text-slate-800 truncate">
                  {incomingDispatch.dropoff.address}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 shrink-0">
            <button
              onClick={declineDispatch}
              className="flex-1 py-3.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[14px] transition-colors"
            >
              Decline
            </button>

            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-2 py-3.5 px-6 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[15px] shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isAccepting ? (
                <span>Confirming Ride...</span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>ACCEPT RIDE (₹{incomingDispatch.fare})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
