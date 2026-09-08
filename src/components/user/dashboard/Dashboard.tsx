"use client";

import React, { useEffect } from "react";
import {
  Sparkles, Navigation, Clock, MapPin, CarFront, Route,
  CalendarClock, ArrowRight, Star, Dog, Plus, Phone, MessageSquare,
  ShieldAlert, XCircle, RefreshCw
} from "lucide-react";
import { useDashboardStore } from "@/hooks/user/useDashboardStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DriverChatModal from "@/components/user/rides/DriverChatModal";
import DriverCallModal from "@/components/user/rides/DriverCallModal";
import MobileDashboard from "@/components/user/mobile/MobileDashboard";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DashboardPage() {
  const router = useRouter();
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

      {/* ── Regular Hero Commute Banner ── */}
      <div className="card p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="pill-teal inline-flex items-center gap-1.5">
                <Sparkles size={10} /> Auto Booking: {primaryCommute?.isActive ? "Active" : "Paused"}
              </span>
            </div>

            <h2 className="text-[20px] font-bold leading-snug mt-3 text-slate-900">
              {greeting}, {user?.name?.split(" ")[0] ?? "there"} —<br />
              Your commute is on track for{" "}
              <span className="text-teal-600">{primaryCommute?.time || "8:45 AM"}</span>.
            </h2>
            <p className="text-[13px] font-medium mt-2 text-slate-600">
              <span className="text-amber-600 font-bold">Traffic Alert:</span> Moderate congestion on primary corridor. We&apos;ve calibrated your route timing for smooth arrival.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/user/my-commute"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "#0d9488" }}
            >
              View Route <ArrowRight size={14} />
            </Link>
            <Link
              href="/user/book-ride"
              className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ccfbf1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")}
            >
              Book Instant Ride
            </Link>
          </div>
        </div>

        <div className="hidden md:block w-px" style={{ background: "#ccfbf1" }} />

        {/* Upcoming Ride / Commute Preview */}
        <div className="md:w-72 shrink-0 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-slate-900">
              {data?.upcomingRides?.length ? "Scheduled Ride" : "Daily Commute"}
            </p>
            <span className="pill-slate">
              {data?.upcomingRides?.length ? "Confirmed" : primaryCommute?.time || "8:45 AM"}
            </span>
          </div>

          <div className="relative pl-5 flex flex-col gap-5">
            <div className="absolute left-1.75 top-2 bottom-6 w-px" style={{ background: "#99f6e4" }} />
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white" style={{ borderColor: "#5eead4" }} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1 mb-0.5 text-slate-500">
                  <Clock size={10} className="text-teal-600" /> {primaryCommute?.time || "8:45 AM"} · Pickup
                </p>
                <p className="text-[14px] font-semibold text-slate-900">
                  {primaryCommute?.pickup?.address || "123 Tech Park Avenue"}
                </p>
              </div>
            </div>

            <div className="relative flex items-start gap-3">
              <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-teal-600">
                <MapPin size={8} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5 text-slate-500">
                  Drop-off
                </p>
                <p className="text-[14px] font-semibold text-slate-900">
                  {primaryCommute?.dropoff?.address || "Bhavo Headquarters, Sector 44"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-50">
                <CarFront size={16} className="text-teal-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">
                  {primaryCommute?.vehicleType || "Cab Premium"}
                </p>
                <p className="text-[11px] font-medium flex items-center gap-1 text-slate-500">
                  Mon-Fri Commute
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/user/book-ride")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-teal-600 hover:bg-teal-700 transition-transform active:scale-95"
            >
              <Navigation size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-[15px] font-bold mb-3 tracking-tight text-slate-900">Book a Ride</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Book Now", icon: CarFront, href: "/user/book-ride" },
            { label: "Schedule Ride", icon: CalendarClock, href: "/user/book-ride?tab=schedule" },
            { label: "My Commute", icon: Route, href: "/user/my-commute" },
            { label: "Pet Ride", icon: Dog, href: "/user/book-ride?tab=pet" },
          ].map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className="card p-4 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-slate-50"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-50">
                <Icon size={18} className="text-teal-600" />
              </div>
              <span className="text-[13px] font-semibold text-slate-900">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scheduled Commutes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-bold tracking-tight text-slate-900">Your Commute Schedules</p>
          <button
            onClick={() => router.push("/user/book-ride?tab=schedule")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <Plus size={14} /> Add New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commutes.map((commute) => (
            <div key={commute._id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{commute.title}</p>
                  <p className="text-[12px] font-medium mt-0.5 flex items-center gap-1.5 text-slate-500">
                    <CalendarClock size={12} className="text-teal-600" /> {commute.days?.join(", ") || "Weekdays"} · {commute.time}
                  </p>
                </div>
                <button
                  onClick={() => toggleCommute(commute._id, !commute.isActive)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${commute.isActive ? "bg-teal-500" : "bg-slate-300"
                    }`}
                  title={commute.isActive ? "Pause Auto-Booking" : "Activate Auto-Booking"}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${commute.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-[12px] font-medium flex items-center gap-1 truncate max-w-50 text-slate-600">
                  <MapPin size={11} className="text-teal-600 shrink-0" /> To: <span className="font-semibold text-slate-800">{commute.dropoff?.address}</span>
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-teal-50 text-teal-700">
                  {commute.vehicleType}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
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
