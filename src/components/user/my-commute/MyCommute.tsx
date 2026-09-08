"use client";

import React, { useState, useEffect } from "react";
import {
  Zap, Plus, Clock, MapPin, Check, Trash2, CalendarClock,
  CarFront, ArrowRight, X, AlertCircle, Sparkles
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import LocationSearch from "../book-ride/LocationSearch";
import { useDialog } from "@/components/ui/DialogProvider";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VEHICLE_OPTIONS = ["Cab Economy", "Cab Premium", "Auto", "Bike"];

interface CommuteItem {
  _id: string;
  title: string;
  pickup: { address: string; coordinates?: [number, number] };
  dropoff: { address: string; coordinates?: [number, number] };
  time: string;
  days: string[];
  vehicleType: string;
  isActive: boolean;
}

export default function MyCommutePage() {
  const router = useRouter();
  const { confirm } = useDialog();
  const [commutes, setCommutes] = useState<CommuteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoBookingGlobal, setAutoBookingGlobal] = useState(true);

  // Modal State for New Commute Route
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formPickup, setFormPickup] = useState("Connaught Place, New Delhi");
  const [formPickupCoords, setFormPickupCoords] = useState<[number, number]>([28.6139, 77.2090]);
  const [formDropoff, setFormDropoff] = useState("DLF Cyber City, Gurugram");
  const [formDropoffCoords, setFormDropoffCoords] = useState<[number, number]>([28.5355, 77.3910]);
  const [formTime, setFormTime] = useState("08:45 AM");
  const [formDays, setFormDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [formVehicle, setFormVehicle] = useState("Cab Premium");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCommutes = () => {
    fetch("/api/user/commutes")
      .then((res) => res.json())
      .then((json) => {
        setCommutes(json.data || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch commutes:", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/user/commutes")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          setCommutes(json.data || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Failed to fetch commutes:", e);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const toggleCommuteActive = async (id: string, currentActive: boolean) => {
    try {
      // Optimistic update
      setCommutes((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: !currentActive } : c))
      );
      const res = await fetch("/api/user/commutes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (!res.ok) {
        fetchCommutes();
      }
    } catch {
      fetchCommutes();
    }
  };

  const deleteCommute = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete schedule?",
      message: "Automated rides for this commute will stop.",
      confirmText: "Delete",
      cancelText: "Keep",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/user/commutes?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCommutes((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (e) {
      console.error("Failed to delete commute:", e);
    }
  };

  const handleCreateCommute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPickup || !formDropoff || !formTime) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await fetch("/api/user/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          pickup: {
            address: formPickup,
            coordinates: formPickupCoords,
          },
          dropoff: {
            address: formDropoff,
            coordinates: formDropoffCoords,
          },
          time: formTime,
          days: formDays,
          vehicleType: formVehicle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.message || "Failed to create commute schedule");
        setSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setFormTitle("");
      fetchCommutes();
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDaySelection = (day: string) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Smart Commute Schedules</h2>
          <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-0.5">
            Automate your daily rides with pre-assigned top-tier drivers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 h-9 sm:h-10 px-4 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} /> <span>New Schedule</span>
        </button>
      </div>

      {/* Global Setting Strip */}
      <div className="card p-4 sm:p-5 flex items-center justify-between gap-3 bg-linear-to-r from-teal-50 to-emerald-50 border border-teal-200/90 shadow-xs rounded-2xl">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-teal-600 text-white shadow-xs shrink-0">
            <Zap size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] sm:text-[15px] font-bold text-slate-900 truncate">Automatic Ride Dispatch</p>
            <p className="text-[11px] sm:text-[12px] font-medium text-slate-600 line-clamp-2">
              {autoBookingGlobal
                ? "Active: Drivers matched 10m before scheduled time."
                : "Paused: Automated dispatching is turned off."}
            </p>
          </div>
        </div>

        <Switch
          checked={autoBookingGlobal}
          onCheckedChange={setAutoBookingGlobal}
          className="data-[state=checked]:bg-teal-600 shrink-0"
        />
      </div>

      {/* Commutes List */}
      <div className="flex flex-col gap-3.5">
        {loading ? (
          <div className="card p-12 text-center text-slate-500 text-sm rounded-2xl">
            Loading your commute schedules from database...
          </div>
        ) : commutes.length === 0 ? (
          <div className="card p-10 flex flex-col items-center justify-center text-center rounded-2xl">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3 border border-teal-100">
              <CalendarClock size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No Commute Schedules Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-4">
              Save time on your daily office or university transit by creating an automated commute routine.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Add Your First Commute
            </button>
          </div>
        ) : (
          commutes.map((commute) => (
            <div
              key={commute._id}
              className={`card p-4 sm:p-5 border rounded-2xl transition-all shadow-xs ${
                commute.isActive ? "border-teal-200 bg-white" : "border-slate-200 bg-slate-50/60 opacity-85"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9.5 h-9.5 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                    <CarFront size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-slate-900 leading-snug">{commute.title}</h3>
                      <span
                        className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          commute.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {commute.isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    {/* Clean structured badge tags for Time, Frequency, Vehicle */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                        <Clock size={10} className="text-teal-600" />
                        {commute.time}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {commute.days?.length === 7 ? "Every Day" : commute.days?.length === 5 && !commute.days.includes("Sat") && !commute.days.includes("Sun") ? "Weekdays" : commute.days?.join(", ") || "Weekdays"}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        {commute.vehicleType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile-optimized action buttons bar */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => toggleCommuteActive(commute._id, commute.isActive)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-all active:scale-95 cursor-pointer text-center ${
                      commute.isActive
                        ? "bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {commute.isActive ? "Pause Auto-Book" : "Activate"}
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (commute.dropoff?.address) params.set("dest", commute.dropoff.address);
                        if (
                          typeof commute.dropoff?.coordinates?.[0] === "number" &&
                          typeof commute.dropoff?.coordinates?.[1] === "number" &&
                          !isNaN(commute.dropoff.coordinates[0]) &&
                          !isNaN(commute.dropoff.coordinates[1])
                        ) {
                          params.set("lat", String(commute.dropoff.coordinates[0]));
                          params.set("lng", String(commute.dropoff.coordinates[1]));
                        }
                        router.push(`/user/book-ride?${params.toString()}`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11.5px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Book Now</span> <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => deleteCommute(commute._id)}
                      className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 active:scale-90 transition-all cursor-pointer shrink-0"
                      title="Delete Commute"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3">
                <div className="relative pl-5 flex flex-col gap-2.5">
                  <div className="absolute left-2 top-2 bottom-3 w-px bg-teal-200" />
                  <div className="relative flex items-start gap-2">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-teal-500 bg-white" />
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase text-teal-600 tracking-wider">Pickup</p>
                      <p className="text-[12.5px] font-semibold text-slate-900 line-clamp-1">{commute.pickup.address}</p>
                    </div>
                  </div>
                  <div className="relative flex items-start gap-2">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-600 flex items-center justify-center">
                      <MapPin size={7} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase text-teal-600 tracking-wider">Drop-off</p>
                      <p className="text-[12.5px] font-semibold text-slate-900 line-clamp-1">{commute.dropoff.address}</p>
                    </div>
                  </div>
                </div>

                {/* Day Badges */}
                <div className="flex flex-col justify-between gap-2.5">
                  <div>
                    <p className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Scheduled Days</p>
                    <div className="flex gap-1 flex-wrap">
                      {ALL_DAYS.map((d) => {
                        const active = commute.days?.includes(d);
                        return (
                          <span
                            key={d}
                            className={`min-w-8 h-6.5 px-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center transition-all ${
                              active
                                ? "bg-teal-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {d}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium">
                    <Sparkles size={12} className="shrink-0 text-teal-600" />
                    <span className="truncate">AI Route Optimization calibrated for traffic</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal: Add New Commute Schedule (Bottom Sheet on Mobile) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock size={20} className="text-teal-300" />
                <h3 className="font-bold text-[16px]">Create Commute Schedule</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCommute} className="p-5 overflow-y-auto flex flex-col gap-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g., Morning Office Commute"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                />
              </div>

              {/* Location Selectors */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <LocationSearch
                  label="Pickup Location"
                  placeholder="Enter starting point..."
                  defaultValue={formPickup}
                  iconBg="#0f766e"
                  icon={<div className="w-2 h-2 bg-white rounded-full" />}
                  onSelect={(lat, lon, name) => {
                    setFormPickupCoords([lat, lon]);
                    setFormPickup(name);
                  }}
                />
                <LocationSearch
                  label="Drop-off Destination"
                  placeholder="Enter arrival destination..."
                  defaultValue={formDropoff}
                  iconBg="#0d9488"
                  icon={<MapPin size={13} className="text-white" />}
                  onSelect={(lat, lon, name) => {
                    setFormDropoffCoords([lat, lon]);
                    setFormDropoff(name);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase text-slate-600">Pickup Time</label>
                  <input
                    type="text"
                    placeholder="e.g., 8:45 AM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase text-slate-600">Vehicle Type</label>
                  <select
                    value={formVehicle}
                    onChange={(e) => setFormVehicle(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500 bg-white"
                  >
                    {VEHICLE_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase text-slate-600">Active Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ALL_DAYS.map((d) => {
                    const selected = formDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDaySelection(d)}
                        className={`flex-1 min-w-10 py-1.5 rounded-lg text-[12px] font-bold border transition-all cursor-pointer ${
                          selected
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {d}
                        {selected && <Check size={10} className="inline ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-[13px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
