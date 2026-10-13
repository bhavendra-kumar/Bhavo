"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  KeyRound,
  Compass,
  Star,
  AlertCircle,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DriverChatModal from "./DriverChatModal";
import DriverCallModal from "./DriverCallModal";
import { useDialog } from "@/components/ui/DialogProvider";

export default function ActiveTripManager() {
  const {
    activeRide,
    markArrived,
    verifyOtp,
    completeTrip,
    confirmCashCollection,
    cancelTrip,
  } = useDriverStore();
  const { confirm } = useDialog();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [riderRating, setRiderRating] = useState(5);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [cashCollected, setCashCollected] = useState(true);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  if (!activeRide) return null;

  const status = activeRide.status;

  const handleStartTrip = async () => {
    if (!enteredOtp || enteredOtp.length < 4) {
      setOtpError(true);
      return;
    }

    const success = await verifyOtp(enteredOtp);
    if (!success) {
      setOtpError(true);
    } else {
      setOtpError(false);
      setEnteredOtp("");
    }
  };

  const handleCompleteTrip = async () => {
    const ok = await confirm({
      title: "Complete Trip & Confirm Payment?",
      message: `Total Fare to collect is ₹${activeRide.fare} via ${activeRide.paymentMethod}. Confirm passenger has reached the destination safely?`,
      confirmText: `Confirm & Collect ₹${activeRide.fare}`,
      cancelText: "Go Back",
      variant: "success",
    });

    if (ok) {
      setShowRatingModal(true);
    }
  };

  const handleFinalRatingSubmit = async () => {
    if (!activeRide) return;
    setIsSubmittingCompletion(true);
    try {
      const rideId = activeRide._id;
      await completeTrip(riderRating, selectedCompliments);
      if (cashCollected) {
        await confirmCashCollection(rideId);
      }
      setShowRatingModal(false);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleCancelClick = async () => {
    const ok = await confirm({
      title: "Cancel this Ride?",
      message:
        "Cancelling active rides may affect your shift acceptance score. Do you wish to cancel?",
      confirmText: "Yes, Cancel Ride",
      cancelText: "Continue Ride",
      variant: "danger",
    });
    if (ok) {
      await cancelTrip("Driver requested cancellation");
    }
  };

  const toggleCompliment = (comp: string) => {
    if (selectedCompliments.includes(comp)) {
      setSelectedCompliments(selectedCompliments.filter((c) => c !== comp));
    } else {
      setSelectedCompliments([...selectedCompliments, comp]);
    }
  };

  return (
    <div
      id="active-trip"
      className="bg-white rounded-3xl border-2 border-teal-500 shadow-xl overflow-hidden flex flex-col transition-all"
    >
      {/* ── Active Ride Status Banner ── */}
      <div className="px-6 py-4 bg-linear-to-r from-teal-900 to-[#042f2e] text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </span>
          <div>
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
              Active Assignment
            </span>
            <h3 className="text-[16px] font-black tracking-tight text-white">
              {status === "ACCEPTED" && "Stage 1: En Route to Pickup Point"}
              {status === "ARRIVED" && "Stage 2: Arrived at Pickup • Awaiting Passenger"}
              {status === "IN_PROGRESS" && "Stage 3: On Trip • Navigating to Destination"}
              {status === "COMPLETED" && "Stage 4: Trip Concluded"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold">
            {activeRide.vehicleType}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold">
            ₹{activeRide.fare} ({activeRide.paymentMethod})
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col gap-6">
        {/* ── Rider Profile & Rapid Contact Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3.5">
            <Avatar className="w-13 h-13 rounded-2xl border-2 border-teal-500/30 shadow-xs">
              <AvatarImage src={activeRide.rider.avatar || ""} />
              <AvatarFallback className="bg-teal-700 text-white font-black text-lg">
                {activeRide.rider.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-[16px] text-slate-900">
                  {activeRide.rider.name}
                </h4>
                <div className="flex items-center text-[12px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Star size={12} className="fill-amber-400 mr-0.5" />
                  {activeRide.rider.rating}
                </div>
              </div>
              <span className="text-[12px] text-slate-500 font-medium">
                Passenger • {activeRide.rider.phone}
              </span>
            </div>
          </div>

          {/* Quick Communication & Safety Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-teal-50 text-teal-700 border border-slate-200 text-[13px] font-bold shadow-xs transition-colors"
            >
              <MessageSquare size={16} className="text-teal-600" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setIsCallOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-xs transition-colors"
            >
              <Phone size={16} />
              <span>Call Rider</span>
            </button>

            <button
              onClick={handleCancelClick}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Cancel Ride"
            >
              <span className="text-[12px] font-bold text-rose-600">Cancel</span>
            </button>
          </div>
        </div>

        {/* ── Route Step Details ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              status === "ACCEPTED" || status === "ARRIVED"
                ? "bg-teal-50/70 border-teal-300 ring-1 ring-teal-400/50"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pickup Location
              </span>
              {(status === "ACCEPTED" || status === "ARRIVED") && (
                <span className="text-teal-700 font-extrabold">TARGET POINT</span>
              )}
            </div>
            <p className="text-[14px] font-extrabold text-slate-900 leading-snug">
              {activeRide.pickup.address}
            </p>
            {activeRide.pickup.landmark && (
              <span className="text-[12px] text-slate-500 mt-1 block">
                Near: {activeRide.pickup.landmark}
              </span>
            )}
          </div>

          {/* Dropoff Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              status === "IN_PROGRESS"
                ? "bg-teal-50/70 border-teal-300 ring-1 ring-teal-400/50"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="text-rose-700 flex items-center gap-1.5">
                <MapPin size={12} className="text-rose-600" />
                Dropoff Destination
              </span>
              {status === "IN_PROGRESS" && (
                <span className="text-teal-700 font-extrabold">TARGET POINT</span>
              )}
            </div>
            <p className="text-[14px] font-extrabold text-slate-900 leading-snug">
              {activeRide.dropoff.address}
            </p>
            <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-1">
              <span>{activeRide.distance}</span>
              <span>•</span>
              <span>~{activeRide.duration}</span>
            </div>
          </div>
        </div>

        {/* ── Dynamic Action Controls By Trip Stage ── */}

        {/* Stage 1: ACCEPTED -> Navigate to Pickup & "I Have Arrived" */}
        {status === "ACCEPTED" && (
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Navigation size={20} />
              </div>
              <div>
                <h5 className="font-extrabold text-[15px] text-slate-900">
                  Drive to Rider&apos;s Pickup Location
                </h5>
                <p className="text-[12px] text-slate-600">
                  Rider is tracking your vehicle&apos;s approach in real-time.
                </p>
              </div>
            </div>

            <button
              onClick={markArrived}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[14px] shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>I Have Arrived at Pickup</span>
            </button>
          </div>
        )}

        {/* Stage 2: ARRIVED -> Enter 4-digit PIN/OTP to start trip */}
        {status === "ARRIVED" && (
          <div className="p-6 rounded-2xl bg-amber-50/80 border-2 border-amber-300 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h5 className="font-black text-[16px] text-slate-900">
                    Ask Passenger for 4-Digit Ride PIN / OTP
                  </h5>
                  <p className="text-[12px] text-slate-600">
                    Verify rider PIN before starting to ensure passenger identity & insurance coverage.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Enter 4-Digit PIN"
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/\D/g, ""));
                    setOtpError(false);
                  }}
                  className={`w-full text-center tracking-[0.4em] font-mono text-2xl font-black py-2.5 rounded-xl border-2 bg-white text-slate-900 focus:outline-hidden ${
                    otpError
                      ? "border-rose-500 ring-2 ring-rose-200"
                      : "border-teal-400 focus:border-teal-600"
                  }`}
                />
                {otpError && (
                  <span className="text-[11px] font-bold text-rose-600 mt-1 flex items-center justify-center gap-1">
                    <AlertCircle size={12} /> Incorrect PIN code. Please ask the passenger for their PIN.
                  </span>
                )}
              </div>

              <button
                onClick={handleStartTrip}
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[15px] shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>Verify PIN & Start Trip</span>
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: IN_PROGRESS -> Live trip speedometer & Complete button */}
        {status === "IN_PROGRESS" && (
          <div className="p-6 rounded-2xl bg-teal-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-teal-700/50">
            <div className="flex items-center gap-5 w-full md:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
                <Compass size={28} className="animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 block">
                  Trip In Progress
                </span>
                <h4 className="text-xl font-black text-white mt-0.5">
                  Heading to: {activeRide.dropoff.address.split(",")[0]}
                </h4>
                <div className="flex items-center gap-3 text-xs text-teal-200/80 mt-1">
                  <span>Remaining: <strong>{activeRide.distance}</strong></span>
                  <span>•</span>
                  <span>Est: <strong>{activeRide.duration}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-300 font-extrabold">Fare Meter: ₹{activeRide.fare}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCompleteTrip}
              className="w-full md:w-auto py-3.5 px-8 rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[15px] shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <CheckCircle2 size={19} />
              <span>Complete Ride & Collect ₹{activeRide.fare}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Rating Passenger Modal upon completion ── */}
      {showRatingModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          style={{ zIndex: 9999 }}
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center border border-teal-500/30">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-2xl font-black text-slate-900">Trip Concluded!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Cash Fare: <strong className="text-slate-900 font-bold">₹{activeRide.fare}</strong> collected directly from passenger.
            </p>
            <p className="text-[11px] text-teal-700 font-medium mt-0.5">
              Pilot payment: cash collected in hand. Platform wallet balance is unaffected.
            </p>

            {/* Star Rating for Passenger */}
            <div className="my-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Rate your experience with {activeRide.rider.name}
              </span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRiderRating(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={32}
                      className={
                        star <= riderRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Compliment Badges */}
            <div className="w-full mb-5">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                Add compliments:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {["Polite", "Ready on Time", "Friendly", "Clean Manners", "Generous Tipper"].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => toggleCompliment(c)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        selectedCompliments.includes(c)
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {c}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Cash Collection Confirmation */}
            <div className="w-full mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left flex items-start gap-3">
              <input
                id="cash-collection-confirm"
                type="checkbox"
                checked={cashCollected}
                onChange={(e) => setCashCollected(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="cash-collection-confirm" className="text-xs text-emerald-950 font-semibold cursor-pointer">
                Confirm Cash of <strong className="font-extrabold text-emerald-900">₹{activeRide.fare}</strong> received in hand from passenger
                <span className="block text-[11px] text-emerald-700 font-normal mt-0.5">
                  Records idempotent non-monetary collection in platform ledger.
                </span>
              </label>
            </div>

            <button
              onClick={handleFinalRatingSubmit}
              disabled={isSubmittingCompletion}
              className="w-full py-3.5 px-6 rounded-xl bg-linear-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-[15px] shadow-lg shadow-teal-700/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingCompletion ? (
                <span>Concluding Trip...</span>
              ) : (
                <span>Submit Feedback & Conclude Trip</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DriverChatModal
        rideId={activeRide._id}
        riderName={activeRide.rider.name}
        riderRating={activeRide.rider.rating}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onCallRider={() => {
          setIsChatOpen(false);
          setIsCallOpen(true);
        }}
      />

      <DriverCallModal
        riderName={activeRide.rider.name}
        riderPhone={activeRide.rider.phone}
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
      />
    </div>
  );
}
