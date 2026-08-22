"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

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
  defaultValue?: string;
}

export default function LocationSearch({ label, placeholder, iconBg, icon, onSelect, defaultValue }: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue || "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <label className="text-[11px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#0f766e" }}>{label}</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setResults([]);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full text-[14px] font-medium px-3 py-2.5 pr-8 rounded-lg focus:outline-none transition-all"
            style={{ background: "#f0fdfa", border: "1px solid #99f6e4", color: "#042f2e" }}
          />
          {loading && <Loader2 size={14} className="absolute right-3 top-3 animate-spin" style={{ color: "#0d9488" }} />}
        </div>
        
        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 border max-h-60 overflow-y-auto" style={{ borderColor: "#ccfbf1" }}>
            {results.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelect(place)}
                className="w-full text-left px-4 py-3 border-b last:border-0 flex items-start gap-3 transition-colors hover:bg-teal-50"
                style={{ borderColor: "#f0fdfa" }}
              >
                <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: "#0d9488" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "#042f2e" }}>{place.display_name.split(",")[0]}</p>
                  <p className="text-[11px] truncate" style={{ color: "#0f766e" }}>{place.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
