"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  Home,
  Briefcase,
  Heart,
  MapPin,
  ArrowRight,
  Plus,
  Navigation,
  ChevronRight,
} from "lucide-react";
import type { SavedPlace } from "./types";
import type { IRideData } from "@/hooks/user/useDashboardStore";

interface RecommendedDestinationsSectionProps {
  savedPlaces?: SavedPlace[];
  recentRides?: IRideData[];
  onSelectDestination: (address: string, coords?: [number, number]) => void;
  onSelectTrip?: (
    pickupAddress: string,
    pickupCoords?: [number, number],
    dropoffAddress?: string,
    dropoffCoords?: [number, number]
  ) => void;
  // Optional legacy props so any older caller doesn't error
  recsLoading?: boolean;
  recommendedPlaces?: unknown[];
  desktopRecFilter?: string;
  setDesktopRecFilter?: (filter: string) => void;
}

export default function RecommendedDestinationsSection({
  savedPlaces = [],
  recentRides = [],
  onSelectDestination,
  onSelectTrip,
}: RecommendedDestinationsSectionProps) {
  // Deduplicate recent rides by dropoff address to avoid repeated entries
  const uniqueRecentDropoffs: IRideData[] = [];
  const seenDropoffs = new Set<string>();

  for (const ride of recentRides) {
    const key = (ride.dropoff?.address || "").trim().toLowerCase();
    if (key && !seenDropoffs.has(key)) {
      seenDropoffs.add(key);
      uniqueRecentDropoffs.push(ride);
    }
    if (uniqueRecentDropoffs.length >= 4) break;
  }

  const hasSavedPlaces = savedPlaces.length > 0;
  const hasRecentRides = uniqueRecentDropoffs.length > 0;

  return (
    <div className="card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-4">
      {/* Saved Places Row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Saved Places
          </span>
          <Link
            href="/user/places"
            className="text-[11.5px] font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Add Place
          </Link>
        </div>

        {hasSavedPlaces ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {savedPlaces.map((place) => {
              const Icon =
                place.tag === "Home"
                  ? Home
                  : place.tag === "Work"
                  ? Briefcase
                  : Heart;

              return (
                <button
                  key={place._id}
                  type="button"
                  onClick={() =>
                    onSelectDestination(place.address, place.coordinates)
                  }
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-slate-900 group-hover:text-teal-900 truncate">
                      {place.name}
                    </p>
                    <p className="text-[10.5px] text-slate-400 truncate">
                      {place.address}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Link
            href="/user/places"
            className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 hover:bg-teal-50/40 hover:border-teal-300 transition-all group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200/60 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-teal-100 group-hover:text-teal-700">
                <Home size={13} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700 group-hover:text-teal-900">
                  Save Home &amp; Work
                </p>
                <p className="text-[10.5px] text-slate-400">
                  Fast 1-tap bookings anytime
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Set up <ArrowRight size={11} />
            </span>
          </Link>
        )}
      </div>

      {/* Recent Trips Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Recent Destinations
            </span>
          </div>
          {hasRecentRides && (
            <Link
              href="/user/trips"
              className="text-[11.5px] font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 transition-colors"
            >
              All Trips <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {hasRecentRides ? (
          <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {uniqueRecentDropoffs.map((ride, idx) => {
              const dropoffTitle =
                ride.dropoff?.address?.split(",")[0] ||
                ride.dropoff?.address ||
                "Destination";
              const pickupSub =
                ride.pickup?.address?.split(",")[0] || ride.pickup?.address || "";
              const dateStr = ride.createdAt
                ? new Date(ride.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })
                : "";

              return (
                <button
                  key={ride._id || `recent-ride-${idx}`}
                  type="button"
                  onClick={() => {
                    if (onSelectTrip && ride.pickup && ride.dropoff) {
                      onSelectTrip(
                        ride.pickup.address,
                        ride.pickup.coordinates,
                        ride.dropoff.address,
                        ride.dropoff.coordinates
                      );
                    } else {
                      onSelectDestination(
                        ride.dropoff?.address || "",
                        ride.dropoff?.coordinates
                      );
                    }
                  }}
                  className="flex items-center justify-between p-3 hover:bg-teal-50/50 transition-colors text-left group cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-teal-100 text-slate-600 group-hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 group-hover:text-teal-900 truncate">
                        {dropoffTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {pickupSub ? `From ${pickupSub}` : ""}{" "}
                        {dateStr ? `• ${dateStr}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ride.vehicleType && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ride.vehicleType}
                      </span>
                    )}
                    <span className="text-teal-600 text-[11.5px] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Select <ChevronRight size={13} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Navigation size={18} />
            </div>
            <div>
              <p className="text-[12.5px] font-bold text-slate-800">
                Where are you heading today?
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Type your destination in the search box above to see route, live fares, and driver availability.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
