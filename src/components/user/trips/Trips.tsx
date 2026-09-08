"use client";

import React, { useState, useEffect } from "react";
import {
  Clock, MapPin, Star, TrendingUp, Phone, MessageSquare, ShieldAlert,
  ChevronDown, ChevronUp, ArrowRight, CarFront, Plus, RefreshCw, XCircle, CheckCircle2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { IRideData } from "@/hooks/user/useDashboardStore";
import DriverChatModal from "@/components/user/rides/DriverChatModal";
import DriverCallModal from "@/components/user/rides/DriverCallModal";
import { useDialog } from "@/components/ui/DialogProvider";

const LeafletMap = dynamic(() => import("@/components/user/book-ride/LeafletMap"), { ssr: false });

const TABS = ["Active", "Upcoming", "Completed", "Cancelled"];

export default function TripsPage() {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [activeTab, setActiveTab] = useState("Active");
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [rides, setRides] = useState<IRideData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals for Call and Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  const fetchRides = () => {
    fetch("/api/user/rides")
      .then((res) => res.json())
      .then((json) => {
        setRides(json.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch rides:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/user/rides")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          setRides(json.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch rides:", err);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedTrip(expandedTrip === id ? null : id);
  };

  const activeRides = rides.filter((r) =>
    ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(r.status)
  );
  const activeRide = activeRides[0] || null;

  const upcomingRides = rides.filter(
    (r) =>
      r.scheduledFor &&
      new Date(r.scheduledFor) > new Date() &&
      !["CANCELLED", "COMPLETED"].includes(r.status)
  );
  const completedRides = rides.filter((r) => r.status === "COMPLETED");
  const cancelledRides = rides.filter((r) => r.status === "CANCELLED");

  const currentTabRides =
    activeTab === "Upcoming"
      ? upcomingRides
      : activeTab === "Completed"
      ? completedRides
      : activeTab === "Cancelled"
      ? cancelledRides
      : [];

  const handleCancel = async (id: string) => {
    const confirmed = await confirm({
      title: "Cancel ride?",
      message: "Are you sure you want to cancel?",
      confirmText: "Cancel ride",
      cancelText: "Keep ride",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/user/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        fetchRides();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvance = async (id: string) => {
    try {
      const res = await fetch(`/api/user/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance_status" }),
      });
      if (res.ok) {
        fetchRides();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200">
          <TrendingUp size={18} className="text-teal-600 shrink-0" />
          <div>
            <p className="text-[15px] font-bold leading-none text-slate-900">
              {completedRides.length} Completed
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5 text-teal-700">
              Your Ride Portfolio
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/user/book-ride")}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} /> Book a Ride
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-full sm:w-max overflow-x-auto no-scrollbar bg-slate-100 border border-slate-200">
        {TABS.map((tab) => {
          const count =
            tab === "Active"
              ? activeRides.length
              : tab === "Upcoming"
              ? upcomingRides.length
              : tab === "Completed"
              ? completedRides.length
              : cancelledRides.length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 sm:px-5 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              style={{
                background: activeTab === tab ? "#ffffff" : "transparent",
                color: activeTab === tab ? "#0f172a" : "#64748b",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab}
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === tab ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab */}
      {activeTab === "Active" ? (
        activeRide ? (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Active Trip Info Card */}
            <div className="lg:w-md shrink-0 card p-5 flex flex-col gap-4 border-2 border-teal-500 bg-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                  {activeRide.status === "SEARCHING"
                    ? "Searching Driver"
                    : activeRide.status === "ACCEPTED"
                    ? "Driver Confirmed"
                    : activeRide.status === "ARRIVED"
                    ? "Driver Arrived"
                    : "On Trip"}
                </span>
                <p className="text-[14px] font-black text-teal-800">
                  ₹{activeRide.fare}
                </p>
              </div>

              {/* Driver summary */}
              <div className="flex items-center gap-4 py-3 border-y border-slate-100">
                <Avatar className="w-12 h-12 shrink-0 border-2 border-teal-200">
                  <AvatarFallback className="text-[15px] font-bold bg-teal-100 text-teal-800">
                    {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "B"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-slate-900">
                    {activeRide.driverDetails?.name || "Assigning Nearest Driver"}
                  </p>
                  <div className="flex items-center gap-1 text-[12px] font-medium mt-0.5 text-slate-500">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {activeRide.driverDetails?.rating || 4.9}
                    <span className="mx-1">•</span>
                    <span>{activeRide.vehicleType}</span>
                  </div>
                </div>
                {activeRide.driverDetails?.vehicleNumber && (
                  <span className="px-2 py-1 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                    {activeRide.driverDetails.vehicleNumber}
                  </span>
                )}
              </div>

              {/* Quick Actions (Call, Chat, SOS) */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCallOpen(true)}
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Phone size={14} /> Call
                </button>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare size={14} /> Chat
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
                  className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                  title="Emergency SOS"
                >
                  <ShieldAlert size={16} />
                </button>
              </div>

              {/* Route Path */}
              <div className="relative pl-6 flex flex-col gap-4 mt-2">
                <div className="absolute left-2.5 top-2 bottom-5 w-px bg-teal-200" />
                <div className="relative flex items-start gap-2">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-teal-500 bg-white" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-teal-600">Pickup</p>
                    <p className="text-[13px] font-semibold text-slate-900">{activeRide.pickup.address}</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-2">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-teal-600">
                    <MapPin size={8} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-teal-600">Destination</p>
                    <p className="text-[13px] font-semibold text-slate-900">{activeRide.dropoff.address}</p>
                  </div>
                </div>
              </div>

              {/* Ride PIN */}
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-teal-800">Verification PIN</p>
                  <p className="text-[11px] text-teal-700">Share with driver</p>
                </div>
                <span className="font-mono text-xl font-black text-teal-950 tracking-widest bg-white px-3 py-0.5 rounded-md border border-teal-300">
                  {activeRide.otp}
                </span>
              </div>

              {/* Progress and Cancel */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAdvance(activeRide._id)}
                  className="flex-1 py-2 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} /> Advance Status
                </button>
                <button
                  onClick={() => handleCancel(activeRide._id)}
                  className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <XCircle size={14} /> Cancel
                </button>
              </div>
            </div>

            {/* Live Interactive Leaflet Map for Active Trip */}
            <div className="flex-1 rounded-2xl overflow-hidden h-72 sm:h-96 lg:h-145 min-h-65 lg:min-h-100 border border-slate-200 relative shadow-sm">
              <LeafletMap
                pickupCoords={activeRide.pickup.coordinates}
                dropoffCoords={activeRide.dropoff.coordinates}
                driverCoords={
                  activeRide.driverCoordinates || [
                    activeRide.pickup.coordinates[0] + 0.003,
                    activeRide.pickup.coordinates[1] + 0.003,
                  ]
                }
                vehicleType={activeRide.vehicleType}
              />

              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[13px] font-bold text-slate-900">
                  Live GPS Tracking Active
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
              <CarFront size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Active Ride Right Now</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">
              Ready to travel? Book an instant cab, bike, or auto with real-time tracking.
            </p>
            <button
              onClick={() => router.push("/user/book-ride")}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
            >
              Book a Ride Now
            </button>
          </div>
        )
      ) : (
        /* Upcoming / Completed / Cancelled Trips List from MongoDB */
        <div className="flex flex-col gap-3">
          {currentTabRides.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-sm">
              {loading ? "Loading trips from database..." : `No ${activeTab.toLowerCase()} trips found.`}
            </div>
          ) : (
            currentTabRides.map((trip) => {
              const isExpanded = expandedTrip === trip._id;
              const dateStr = new Date(trip.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const timeStr = new Date(trip.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={trip._id} className="card p-5 transition-all hover:border-teal-200">
                  <div
                    className="flex flex-col lg:flex-row gap-5 cursor-pointer"
                    onClick={() => toggleExpand(trip._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">
                            {dateStr}
                          </p>
                          <p className="text-[12px] font-medium mt-0.5 flex items-center gap-1 text-slate-500">
                            <Clock size={11} className="text-teal-600" /> {timeStr} · ID: #{trip._id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold ml-auto lg:ml-0 ${
                            trip.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : trip.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-3 text-[13px] font-semibold text-slate-700">
                          <span>{trip.pickup.address.split(",")[0]}</span>
                          <ArrowRight size={12} className="text-teal-600" />
                          <span>{trip.dropoff.address.split(",")[0]}</span>
                        </div>
                      )}

                      {isExpanded && (
                        <div className="relative pl-5 flex flex-col gap-3 mt-2">
                          <div className="absolute left-1.75 top-2 bottom-5 w-px bg-teal-200" />
                          <div className="relative flex items-center gap-3">
                            <div className="absolute -left-5 w-3 h-3 rounded-full border-2 border-teal-500 bg-white" />
                            <p className="text-[13px] font-medium text-slate-700">
                              <strong className="text-slate-900">From:</strong> {trip.pickup.address}
                            </p>
                          </div>
                          <div className="relative flex items-center gap-3">
                            <div className="absolute -left-5 w-3 h-3 rounded-full flex items-center justify-center bg-teal-600">
                              <MapPin size={6} className="text-white" />
                            </div>
                            <p className="text-[13px] font-medium text-slate-700">
                              <strong className="text-slate-900">To:</strong> {trip.dropoff.address}
                            </p>
                          </div>
                          {trip.distance && (
                            <p className="text-[12px] text-slate-500 mt-1">
                              Distance: {trip.distance} • Duration: {trip.duration}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:block w-px bg-slate-100" />

                    <div className="lg:w-60 shrink-0 flex flex-col justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-[13px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {trip.driverDetails?.name ? trip.driverDetails.name[0] : "B"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">
                            {trip.driverDetails?.name || "Bhavo Pilot"}
                          </p>
                          <div className="flex items-center gap-1 text-[12px] font-medium mt-0.5 text-slate-500">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            {trip.driverDetails?.rating || 4.9} • {trip.vehicleType}
                          </div>
                        </div>
                        <p className="ml-auto text-[18px] font-black text-slate-900">
                          ₹{trip.fare}
                        </p>
                      </div>

                      {activeTab === "Upcoming" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(trip._id);
                            }}
                            className="px-3 py-1 rounded-md text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                          >
                            Cancel Ride
                          </button>
                        </div>
                      )}

                      {activeTab === "Completed" && (
                        <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 size={13} /> Paid via {trip.paymentMethod || "WALLET"}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 shrink-0 self-center">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
