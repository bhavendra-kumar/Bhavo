"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Car,
  ChevronRight,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

interface IDriverTripRecord {
  id?: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  tip?: number;
  distance: string;
  time: string;
  vehicleType?: string;
  paymentMethod?: string;
}

export default function RecentDriverTrips() {
  const { recentTrips } = useDriverStore();

  if (!recentTrips || recentTrips.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm text-center">
        <p className="text-sm text-slate-500 font-semibold">No rides completed yet during this shift.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
            Recent Completed Trips
          </h3>
          <p className="text-xs text-slate-500">
            Earnings and ride receipts from today&apos;s active shift
          </p>
        </div>

        <Link
          href="/driver/trips"
          className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
        >
          <span>View All Trips</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {recentTrips.slice(0, 4).map((trip: IDriverTripRecord, idx: number) => (
          <div
            key={trip.id || idx}
            className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
          >
            {/* Left: Rider & Route */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center shrink-0 mt-0.5">
                <Car size={16} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-[14px] text-slate-900 truncate">
                    {trip.riderName}
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {trip.vehicleType || "Cab"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 truncate">
                  <span className="truncate max-w-35 md:max-w-50 font-medium text-slate-700">
                    {trip.pickup}
                  </span>
                  <ArrowRight size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate max-w-35 md:max-w-50 font-medium text-slate-700">
                    {trip.dropoff}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{trip.distance}</span>
                  <span>•</span>
                  <span>{trip.time}</span>
                </div>
              </div>
            </div>

            {/* Right: Fare, Tip & Payment Method */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-slate-900">
                  ₹{trip.fare}
                </span>
                {Boolean(trip.tip && trip.tip > 0) && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                    +₹{trip.tip} tip
                  </span>
                )}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:mt-0.5">
                Paid via {trip.paymentMethod || "UPI"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
