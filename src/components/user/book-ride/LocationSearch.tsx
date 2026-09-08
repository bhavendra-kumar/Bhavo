"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface PlaceResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  label: string;
  placeholder: string;
  iconBg: string;
  icon: React.ReactNode;
  onSelect: (lat: number, lon: number, name: string) => void;
  onClear?: () => void;
  defaultValue?: string;
}


export default function LocationSearch({
  label,
  placeholder,
  iconBg,
  icon,
  onSelect,
  onClear,
  defaultValue,
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query === defaultValue) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
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
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, defaultValue]);

  const handleSelect = (place: PlaceResult) => {
    const shortName = place.display_name.split(",")[0];
    setQuery(shortName);
    setIsOpen(false);
    onSelect(parseFloat(place.lat), parseFloat(place.lon), shortName);
  };

  return (
    <div className="flex items-center gap-3 relative" ref={dropdownRef}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 relative">
        <label className="text-[11px] font-bold uppercase tracking-widest block mb-1 text-slate-500">{label}</label>
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
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length > 0) {
                e.preventDefault();
                handleSelect(results[0]);
              }
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
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

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 border border-slate-200 max-h-60 overflow-y-auto">
            {results.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelect(place)}
                className="w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 flex items-start gap-3 transition-colors hover:bg-slate-50"
              >
                <MapPin size={16} className="shrink-0 mt-0.5 text-teal-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate">{place.display_name.split(",")[0]}</p>
                  <p className="text-[11px] text-slate-500 truncate">{place.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

