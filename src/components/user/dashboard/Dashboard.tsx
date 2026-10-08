"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin, Star, Phone, MessageSquare,
  ShieldAlert, XCircle, RefreshCw, Radio,
  CheckCircle2, Check
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  // Rating & Tip Modal state
  const [userRating, setUserRating] = useState(5);
  const [userCompliments, setUserCompliments] = useState<string[]>(["On Time", "Clean Car"]);
  const [userTip, setUserTip] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const {
    data,
    fetchDashboard,
    cancelRide,
    advanceRideStatus,
    toggleCommute,
    submitRating,
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

      {/* ── Desktop Dashboard (>= 1024px) ── */}
      <div className="hidden lg:flex flex-col gap-6 pb-8 flex-1">
        {/* ── Active Ride Live Tracker (If Active) ── */}
        {activeRide && activeRide.status !== "COMPLETED" && (
          <div
            className="card p-6 border-2 flex flex-col gap-5 relative overflow-hidden transition-all shadow-md"
            style={{ borderColor: "#14b8a6", background: "#f0fdfa" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {getStatusBadge(activeRide.status)}
                <span className="text-[12px] font-semibold text-slate-500 font-mono">
                  Ride #{activeRide._id.slice(-6).toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => advanceRideStatus(activeRide._id)}
                  title="Simulate Next Ride Status"
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} /> Simulate Progress
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: "Cancel ride?",
                      message: activeRide.status === "SEARCHING"
                        ? "Are you sure you want to stop searching for drivers?"
                        : "Your driver is already on the way.",
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

            {/* If SEARCHING, show dispatch radar broadcasting card */}
            {activeRide.status === "SEARCHING" ? (
              <div className="p-6 rounded-2xl bg-white border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-14 h-14 rounded-full bg-teal-400/30 animate-ping" />
                    <span className="absolute w-10 h-10 rounded-full bg-teal-400/50 animate-pulse" />
                    <div className="relative w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md">
                      <Radio size={22} className="animate-spin" style={{ animationDuration: "3s" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">Broadcasting to Nearby Pilots...</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        LIVE RADAR
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contacting closest verified {activeRide.vehicleType} captains within a 3km radius
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-teal-50/80 px-4 py-2.5 rounded-xl border border-teal-100">
                  <div>
                    <span className="text-[10px] text-teal-600 uppercase font-bold block">Vehicle</span>
                    <span className="font-extrabold text-slate-900">{activeRide.vehicleType}</span>
                  </div>
                  <div className="w-px h-6 bg-teal-200" />
                  <div>
                    <span className="text-[10px] text-teal-600 uppercase font-bold block">Distance</span>
                    <span className="font-extrabold text-slate-900">{activeRide.distance}</span>
                  </div>
                  <div className="w-px h-6 bg-teal-200" />
                  <div>
                    <span className="text-[10px] text-teal-600 uppercase font-bold block">Estimated Fare</span>
                    <span className="font-extrabold text-teal-700 text-sm">₹{activeRide.fare}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Left: Driver Card */}
                <div className="p-4 rounded-xl bg-white border border-teal-100 flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-600 border-2 border-teal-500 flex items-center justify-center font-bold text-white text-[15px] shrink-0">
                      {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "P"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-[14px] truncate">
                          {activeRide.driverDetails?.name || "Rajesh Kumar"}
                        </p>
                        <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold">
                          <Star size={11} fill="currentColor" /> {activeRide.driverDetails?.rating || 4.9}
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-500 truncate font-medium">
                        {activeRide.driverDetails?.vehicleModel || "Tata Tigor EV"} ·{" "}
                        <span className="font-mono font-bold text-slate-700">
                          {activeRide.driverDetails?.vehicleNumber || "DL-01-EV-4429"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Start Ride PIN / OTP */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Start PIN / OTP</p>
                      <p className="text-[11px] text-teal-700 font-medium">Share with driver upon arrival</p>
                    </div>
                    <div className="px-3 py-0.5 bg-white rounded-md border border-teal-300 font-mono text-base font-black text-teal-900 tracking-widest shadow-xs">
                      {activeRide.otp}
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
            )}
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
          driverName={activeRide.driverDetails?.name || "Rajesh Kumar"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || "DL-01-EV-4429"}
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
          driverName={activeRide.driverDetails?.name || "Rajesh Kumar"}
          driverPhone={activeRide.driverDetails?.phone || "+91 98765 43210"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleModel={activeRide.driverDetails?.vehicleModel || "Tata Tigor EV"}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || "DL-01-EV-4429"}
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
        />
      )}

      {/* Celebratory Ride Completed & Payment Receipt Modal */}
      {activeRide && activeRide.status === "COMPLETED" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-teal-200 animate-in zoom-in-95 duration-200 flex flex-col gap-4 text-center">
            {/* Success Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">You&apos;ve Arrived!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Trip concluded safely at {activeRide.dropoff.address.split(",")[0]}
              </p>
            </div>

            {/* Fare & Payment Box */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Total Fare Paid
                </span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{activeRide.fare + userTip}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <Check size={12} /> Paid via {activeRide.paymentMethod}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                  {activeRide.distance} • {activeRide.duration}
                </span>
              </div>
            </div>

            {/* Driver Info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "R"}
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900">
                    {activeRide.driverDetails?.name || "Rajesh Kumar"}
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    {activeRide.driverDetails?.vehicleModel || "Tata Tigor EV"} • {activeRide.driverDetails?.vehicleNumber || "DL-01-EV-4429"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{activeRide.driverDetails?.rating || 4.9}</span>
              </div>
            </div>

            {/* Rate Driver Stars */}
            <div className="py-1">
              <span className="text-xs font-bold text-slate-700 block mb-2">Rate your Bhavo Captain</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
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
                  onClick={() =>
                    setUserCompliments((prev) =>
                      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
                    )
                  }
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
              onClick={async () => {
                setIsSubmittingFeedback(true);
                await submitRating(
                  activeRide._id,
                  userRating,
                  userCompliments.join(", "),
                  userTip
                );
                setIsSubmittingFeedback(false);
              }}
              disabled={isSubmittingFeedback}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-extrabold shadow-lg shadow-teal-600/20 active:scale-98 transition-all cursor-pointer mt-1"
            >
              {isSubmittingFeedback ? "Saving Feedback..." : "Done & Finish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
