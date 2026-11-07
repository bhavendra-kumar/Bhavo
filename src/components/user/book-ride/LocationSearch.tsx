"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";

export interface PlaceResult {
  id?: string;
  place_id: number | string;
  name?: string;
  display_name: string;
  short_name?: string;
  lat: string | number;
  lon: string | number;
  glyph?: string;
  city?: string;
  area?: string;
  subtext?: string;
  category?: string;
  categoryLabel?: string;
  distanceKm?: number;
  approxMinutes?: number;
  fareEstimateBike?: number;
  fareEstimateCab?: number;
}

interface LocationSearchProps {
  label?: string;
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
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setQuery(defaultValue || "");
  }

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for places like in landing page
  useEffect(() => {
    if (!query || query === defaultValue) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = userCoords
          ? `/api/places?q=${encodeURIComponent(query)}&lat=${userCoords[0]}&lon=${userCoords[1]}`
          : `/api/places?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setResults(data);
            setIsOpen(data.length > 0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch location suggestions", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, defaultValue, userCoords]);

  const handleSelect = (place: PlaceResult) => {
    const name = place.short_name || place.name || place.display_name.split(",")[0];
    setQuery(name);
    setIsOpen(false);
    onSelect(
      typeof place.lat === "number" ? place.lat : parseFloat(place.lat),
      typeof place.lon === "number" ? place.lon : parseFloat(place.lon),
      name
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

  return (
    <div className="flex items-center gap-3 relative" ref={dropdownRef}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 relative">
        {label && (
          <label className="text-[11px] font-bold uppercase tracking-widest block mb-1 text-slate-500">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val) {
                setResults([]);
                setIsOpen(false);
                onClear?.();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length > 0) {
                e.preventDefault();
                handleSelect(results[0]);
              }
            }}
            onFocus={() => {
              if (results.length > 0) {
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
                  setIsOpen(false);
                  onClear?.();
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

        {/* Location Suggestions Dropdown (Styled identically to landing page) */}
        {isOpen && results.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border-[1.5px] border-[#d5e5e2] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-50 max-h-55 overflow-y-auto"
            role="listbox"
          >
            {results.map((item, idx) => (
              <div
                key={item.id || item.place_id || `place-${idx}`}
                role="option"
                aria-selected={false}
                tabIndex={0}
                onClick={() => handleSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(item);
                  }
                }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[#f1f5f9] last:border-b-0 cursor-pointer hover:bg-[#f0f7f5] transition-colors focus:bg-[#f0f7f5] focus:outline-none"
              >
                <span className="text-base select-none shrink-0">
                  {getCategoryGlyph(item.category, item.glyph)}
                </span>
                <div className="flex flex-col gap-px min-w-0 flex-1 overflow-hidden">
                  <span className="text-[13px] font-bold text-[#142B29] truncate leading-tight">
                    {item.short_name || item.name || item.display_name.split(",")[0]}
                  </span>
                  <span className="text-[11px] text-[#64748b] truncate leading-tight">
                    {item.city || item.area || item.subtext || item.display_name}
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
