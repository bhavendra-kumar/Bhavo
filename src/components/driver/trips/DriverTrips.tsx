"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Car, ShieldCheck, Clock, Loader2 } from "lucide-react";

interface IDriverTripRecord {
  id?: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  tip?: number;
  distance: string;
  duration?: string;
  time: string;
  date?: string;
  vehicleType?: string;
  paymentMethod?: string;
  status?: string;
}

export default function DriverTrips() {
  const [filter, setFilter] = useState("ALL");
  const [trips, setTrips] = useState<IDriverTripRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/driver/trips?filter=${filter}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setTrips(json.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [filter]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Trips Log & History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Complete record of your fulfilled passenger journeys from database</p>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "TODAY", "THIS WEEK"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filter === tab
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin text-teal-600" />
            <span className="text-xs font-bold">Loading trip records...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No trips found for this filter period.</p>
            <span className="text-xs text-slate-400">Completed rides will appear here automatically.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trips.map((trip: IDriverTripRecord, idx: number) => (
              <div
                key={trip.id || idx}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Car size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[15px] text-slate-900">{trip.riderName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {trip.vehicleType || "Cab"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-800">{trip.pickup}</span>
                      <ArrowRight size={12} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{trip.dropoff}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{trip.distance}</span>
                      <span>•</span>
                      <span>{trip.time}</span>
                      {trip.date && (
                        <>
                          <span>•</span>
                          <span>{trip.date}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <ShieldCheck size={11} /> {trip.status || "Completed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-900">₹{trip.fare}</span>
                    {Boolean(trip.tip && trip.tip > 0) && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        +₹{trip.tip} tip
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {trip.paymentMethod || "UPI"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
