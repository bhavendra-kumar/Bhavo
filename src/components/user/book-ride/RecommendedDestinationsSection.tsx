"use client";

import React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import type { RecommendedPlace } from "../mobile/MobileBookRide";

interface RecommendedDestinationsSectionProps {
  recsLoading: boolean;
  recommendedPlaces: RecommendedPlace[];
  desktopRecFilter: string;
  setDesktopRecFilter: (filter: string) => void;
  onSelectDestination: (address: string, coords: [number, number]) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Spots" },
  { id: "transit", label: "Bus Stand 🚌" },
  { id: "railway", label: "Railway 🚆" },
  { id: "hospital", label: "Hospitals 🏥" },
  { id: "landmark", label: "Landmarks 🛕" },
  { id: "market", label: "Markets 🛍️" },
  { id: "education", label: "Colleges 🎓" },
];

export default function RecommendedDestinationsSection({
  recsLoading,
  recommendedPlaces,
  desktopRecFilter,
  setDesktopRecFilter,
  onSelectDestination,
}: RecommendedDestinationsSectionProps) {
  const filteredPlaces = recommendedPlaces.filter((place) => {
    if (!desktopRecFilter || desktopRecFilter === "all") return true;
    if (desktopRecFilter === "transit") return place.category === "transit" || place.category === "metro_station";
    if (desktopRecFilter === "railway") return place.category === "railway";
    if (desktopRecFilter === "hospital") return place.category === "hospital";
    if (desktopRecFilter === "landmark") return place.category === "landmark";
    if (desktopRecFilter === "market") return place.category === "market" || place.category === "mall";
    if (desktopRecFilter === "education") return place.category === "education";
    return true;
  });

  return (
    <div className="card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
              Recommended Destinations
            </h3>
            <p className="text-[11.5px] text-slate-500">
              Popular transit hubs, landmarks & destinations near your pickup
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Local Recommendations
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setDesktopRecFilter(cat.id)}
            className={`text-[11.5px] font-bold px-3 py-1 rounded-full shrink-0 transition-all cursor-pointer ${
              desktopRecFilter === cat.id
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {recsLoading && recommendedPlaces.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No recommended places found for this category. Select &quot;All Spots&quot; or search above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredPlaces.slice(0, 8).map((place, idx) => {
            const displayName = place.short_name || place.name || place.display_name.split(",")[0];
            const lat = typeof place.lat === "number" ? place.lat : parseFloat(place.lat);
            const lon = typeof place.lon === "number" ? place.lon : parseFloat(place.lon);

            return (
              <button
                key={place.id || place.place_id || `desk-rec-${idx}`}
                type="button"
                onClick={() => onSelectDestination(displayName, [lat, lon])}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 flex items-start gap-3 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
              >
                <span className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-lg shrink-0 transition-colors">
                  {place.glyph || "📍"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold text-slate-900 group-hover:text-teal-900 truncate">
                      {displayName}
                    </p>
                    {place.categoryLabel && (
                      <span className="text-[9.5px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded shrink-0">
                        {place.categoryLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-slate-500 truncate leading-tight mt-0.5">
                    {place.subtext || place.display_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {place.distanceKm !== undefined && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                        {place.distanceKm} km away
                      </span>
                    )}
                    {place.fareEstimateBike !== undefined && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Bike ~₹{place.fareEstimateBike}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11.5px] text-slate-400 font-medium">
        <span>Click any spot to calculate route & live vehicle fares</span>
        <span className="text-teal-600 font-bold flex items-center gap-1">
          Instant 1-Tap Drop <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
}
