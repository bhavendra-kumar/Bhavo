"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, X, Navigation } from "lucide-react";

export interface PlaceResult {
  id?: string;
  place_id: number | string;
  name?: string;
  display_name: string;
  short_name?: string;
  lat: string | number;
  lon: string | number;
  category?: string;
  categoryLabel?: string;
  glyph?: string;
  city?: string;
  subtext?: string;
  distanceKm?: number;
  approxMinutes?: number;
  fareEstimateBike?: number;
  fareEstimateCab?: number;
}

interface LocationSearchProps {
  label: string;
  placeholder: string;
  iconBg: string;
  icon: React.ReactNode;
  onSelect: (lat: number, lon: number, name: string) => void;
  onClear?: () => void;
  defaultValue?: string;
  userCoords?: [number, number] | null;
}

export default function LocationSearch({
  label,
  placeholder,
  iconBg,
  icon,
  onSelect,
  onClear,
  defaultValue,
  userCoords,
}: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue || "");
  const [prevDefault, setPrevDefault] = useState(defaultValue);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setQuery(defaultValue || "");
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPopularAreas = async () => {
    setLoading(true);
    try {
      const url = userCoords
        ? `/api/places?nearby=true&lat=${userCoords[0]}&lon=${userCoords[1]}`
        : "/api/places?nearby=true";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
        setIsOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch nearby places", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query || query === defaultValue) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const url = userCoords
          ? `/api/places?q=${encodeURIComponent(query)}&lat=${userCoords[0]}&lon=${userCoords[1]}`
          : `/api/places?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data)) {
          setResults(data);
          if (data.length > 0) setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch places", err);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(delayDebounceFn);
  }, [query, defaultValue, userCoords]);

  const handleSelect = (place: PlaceResult) => {
    const shortName = place.short_name || place.name || place.display_name.split(",")[0];
    setQuery(shortName);
    setIsOpen(false);
    onSelect(
      typeof place.lat === "number" ? place.lat : parseFloat(place.lat),
      typeof place.lon === "number" ? place.lon : parseFloat(place.lon),
      shortName
    );
  };

  const getCategoryGlyph = (category?: string, glyph?: string) => {
    if (glyph) return glyph;
    switch (category) {
      case "transit":
        return "🚌";
      case "railway":
        return "🚆";
      case "metro_station":
        return "🚇";
      case "airport":
        return "✈️";
      case "hospital":
        return "🏥";
      case "landmark":
        return "🛕";
      case "market":
      case "mall":
        return "🛍️";
      case "education":
        return "🎓";
      case "tech_park":
        return "🏢";
      default:
        return "📍";
    }
  };

  const filteredResults = results.filter((place) => {
    if (!activeFilter || activeFilter === "all") return true;
    if (activeFilter === "transit") return place.category === "transit" || place.category === "metro_station";
    if (activeFilter === "railway") return place.category === "railway";
    if (activeFilter === "hospital") return place.category === "hospital";
    if (activeFilter === "landmark") return place.category === "landmark";
    if (activeFilter === "market") return place.category === "market" || place.category === "mall";
    if (activeFilter === "education") return place.category === "education";
    return true;
  });

  return (
    <div className="flex items-center gap-3 relative" ref={dropdownRef}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 relative">
        {label && <label className="text-[11px] font-bold uppercase tracking-widest block mb-1 text-slate-500">{label}</label>}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val) {
                setResults([]);
                onClear?.();
                fetchPopularAreas();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredResults.length > 0) {
                e.preventDefault();
                handleSelect(filteredResults[0]);
              }
            }}
            onFocus={() => {
              if (!query) {
                fetchPopularAreas();
              } else if (results.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="w-full text-[14px] font-medium px-3 py-2.5 pr-14 rounded-lg focus:outline-none transition-all bg-slate-50 border border-slate-200 text-slate-900 focus:border-teal-500"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  onClear?.();
                  fetchPopularAreas();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Clear location"
              >
                <X size={13} />
              </button>
            )}
            {loading && <Loader2 size={14} className="animate-spin text-teal-600" />}
          </div>
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl z-50 border border-slate-200 max-h-80 overflow-y-auto">
            {!query && (
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Navigation size={11} className="text-teal-600" />
                    Recommended Spots Near You
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full">
                    Live Real-Time
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  {[
                    { id: "all", label: "All" },
                    { id: "transit", label: "Bus 🚌" },
                    { id: "railway", label: "Rail 🚆" },
                    { id: "hospital", label: "Hospital 🏥" },
                    { id: "landmark", label: "Landmark 🛕" },
                    { id: "market", label: "Market 🛍️" },
                    { id: "education", label: "College 🎓" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilter(cat.id);
                      }}
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-all cursor-pointer ${
                        activeFilter === cat.id
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No destinations matching this filter.
              </div>
            ) : (
              filteredResults.map((place, idx) => (
                <button
                  key={place.id || place.place_id || `place-${idx}`}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3.5 py-2.5 border-b border-slate-100 last:border-0 flex items-start gap-3 transition-colors hover:bg-teal-50/60 cursor-pointer group"
                >
                  <span className="text-base mt-0.5 shrink-0 select-none">
                    {getCategoryGlyph(place.category, place.glyph)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-900 group-hover:text-teal-900 truncate">
                        {place.short_name || place.name || place.display_name.split(",")[0]}
                      </p>
                      {place.categoryLabel && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800 px-1.5 py-0.5 rounded shrink-0 transition-colors">
                          {place.categoryLabel}
                        </span>
                      )}
                      {place.distanceKm !== undefined && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0 ml-auto">
                          {place.distanceKm} km
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-slate-500 truncate leading-tight mt-0.5">
                      {place.subtext || place.display_name}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
