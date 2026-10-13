"use client";

import React, { useState } from "react";
import { Check, Star, CheckCircle2 } from "lucide-react";
export interface CompletedRideSummary {
  _id: string;
  fare: number;
  distance?: string;
  duration?: string;
  paymentMethod?: string;
  dropoff?: { address?: string };
  vehicleType?: string;
  driverDetails?: {
    name?: string;
    rating?: number;
    vehicleModel?: string;
    vehicleNumber?: string;
  };
}

interface CompletedRideModalProps {
  ride: CompletedRideSummary | null;
  onClose: () => void;
}

export default function CompletedRideModal({ ride, onClose }: CompletedRideModalProps) {
  const [userRating, setUserRating] = useState(5);
  const [userTip, setUserTip] = useState(0);
  const [userCompliments, setUserCompliments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ride) return null;

  const toggleCompliment = (comp: string) => {
    if (userCompliments.includes(comp)) {
      setUserCompliments(userCompliments.filter((c) => c !== comp));
    } else {
      setUserCompliments([...userCompliments, comp]);
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/user/rides/${ride._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate_trip",
          rating: userRating,
          tip: userTip,
          compliments: userCompliments,
        }),
      });
    } catch {
      // Graceful error ignore on post-trip rating
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const driverName = ride.driverDetails?.name || "Bhavo Pilot";
  const driverInitial = driverName ? driverName[0] : "B";
  const vehicleDesc = [
    ride.driverDetails?.vehicleModel || ride.vehicleType,
    ride.driverDetails?.vehicleNumber,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-teal-200 animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-center">
        {/* Success Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900">You&apos;ve Arrived!</h3>
          <p className="text-xs text-slate-500 mt-1">
            Trip concluded safely at {ride.dropoff?.address?.split(",")[0] || "Destination"}
          </p>
        </div>

        {/* Fare & Payment Box */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
              Total Fare Paid
            </span>
            <span className="text-2xl font-black text-slate-900">
              ₹{(ride.fare || 0) + userTip}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              <Check size={12} /> Paid via {ride.paymentMethod || "WALLET"}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1 font-mono">
              {ride.distance} • {ride.duration}
            </span>
          </div>
        </div>

        {/* Driver Info */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
              {driverInitial}
            </div>
            <div>
              <h5 className="font-extrabold text-sm text-slate-900">{driverName}</h5>
              {vehicleDesc && (
                <span className="text-[11px] text-slate-500">{vehicleDesc}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span>{ride.driverDetails?.rating || 4.9}</span>
          </div>
        </div>

        {/* Rate Driver Stars */}
        <div className="py-1">
          <span className="text-xs font-bold text-slate-700 block mb-2">Rate your Bhavo Captain</span>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setUserRating(star)}
                className="p-1 hover:scale-110 transition-transform cursor-pointer"
              >
                <Star
                  size={28}
                  className={star <= userRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Compliment Tags */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {["Clean Car", "Smooth Route", "Polite Captain", "On Time"].map((comp) => (
            <button
              key={comp}
              type="button"
              onClick={() => toggleCompliment(comp)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                userCompliments.includes(comp)
                  ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {comp}
            </button>
          ))}
        </div>

        {/* Add Tip Options */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-1.5">Add a Tip for Good Service (Optional)</span>
          <div className="grid grid-cols-4 gap-2">
            {[0, 20, 30, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setUserTip(amt)}
                className={`py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  userTip === amt
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {amt === 0 ? "No Tip" : `+₹${amt}`}
              </button>
            ))}
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={handleSubmitFeedback}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-extrabold shadow-lg shadow-teal-600/20 active:scale-98 transition-all cursor-pointer mt-1 disabled:opacity-50"
        >
          {isSubmitting ? "Saving Feedback..." : "Done & Finish"}
        </button>
      </div>
    </div>
  );
}
