"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CarFront,
  CalendarClock,
  Dog,
  Clock4,
  Building2,
  Home,
  Dumbbell,
  ArrowUpRight,
  Users2,
  MapPin,
  Navigation,
  ArrowUpDown,
  X,
  Loader2,
  Zap,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { ISavedPlace } from "@/hooks/user/useDashboardStore";

interface PlaceResult {
  place_id: number | string;
  display_name: string;
  short_name?: string;
  lat: string | number;
  lon: string | number;
  isSaved?: boolean;
  category?: string;
  categoryLabel?: string;
  subtext?: string;
}

interface QuickCommuteHubProps {
  savedPlaces?: ISavedPlace[];
}

export default function QuickCommuteHub({ savedPlaces = [] }: QuickCommuteHubProps) {
  const router = useRouter();

  // Booking mode tab
  const [activeTab, setActiveTab] = useState<"instant" | "schedule" | "rental">("instant");

  // Input states
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);

  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

  // Autocomplete states
  const [activeDropdown, setActiveDropdown] = useState<"pickup" | "dropoff" | null>(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [lastSelectedChip, setLastSelectedChip] = useState<string | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch place suggestions with debouncing
  const activeQuery = activeDropdown === "pickup" ? pickupQuery : activeDropdown === "dropoff" ? dropoffQuery : "";

  const fetchPlaces = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        // Show saved places + live nearby transit & pickup hubs when query is empty
        const savedSuggestions: PlaceResult[] = savedPlaces.map((sp) => ({
          place_id: sp._id,
          display_name: `${sp.name} — ${sp.address}`,
          short_name: sp.name,
          lat: sp.coordinates ? sp.coordinates[0] : 28.6139,
          lon: sp.coordinates ? sp.coordinates[1] : 77.2090,
          isSaved: true,
          category: "saved",
          categoryLabel: "Saved",
          subtext: sp.address,
        }));

        try {
          const coords = pickupCoords;
          const url = coords
            ? `/api/places?nearby=true&lat=${coords[0]}&lon=${coords[1]}`
            : "/api/places?nearby=true";
          const res = await fetch(url);
          if (res.ok) {
            const nearbyData = await res.json();
            if (Array.isArray(nearbyData)) {
              const nearbySuggestions: PlaceResult[] = nearbyData.slice(0, 8).map((p) => ({
                place_id: p.id || p.place_id,
                display_name: p.display_name,
                short_name: p.short_name || p.display_name.split(",")[0],
                lat: p.lat,
                lon: p.lon,
                category: p.category,
                categoryLabel: p.categoryLabel,
                subtext: p.subtext || p.display_name,
              }));
              setResults([...savedSuggestions, ...nearbySuggestions]);
              return;
            }
          }
        } catch {}

        setResults(savedSuggestions);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const coords = pickupCoords;
        const url = coords
          ? `/api/places?q=${encodeURIComponent(query)}&lat=${coords[0]}&lon=${coords[1]}`
          : `/api/places?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Also prefix matching saved places
            const matchingSaved: PlaceResult[] = savedPlaces
              .filter(
                (sp) =>
                  sp.name.toLowerCase().includes(query.toLowerCase()) ||
                  sp.address.toLowerCase().includes(query.toLowerCase())
              )
              .map((sp) => ({
                place_id: sp._id,
                display_name: `${sp.name} — ${sp.address}`,
                short_name: sp.name,
                lat: sp.coordinates ? sp.coordinates[0] : 28.6139,
                lon: sp.coordinates ? sp.coordinates[1] : 77.2090,
                isSaved: true,
                category: "saved",
                categoryLabel: "Saved",
                subtext: sp.address,
              }));

            const combined = [...matchingSaved, ...data.slice(0, 7)];
            setResults(combined);
          }
        }
      } catch (err) {
        console.error("Error searching places:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [savedPlaces, pickupCoords]
  );

  useEffect(() => {
    if (!activeDropdown) return;

    const timer = setTimeout(() => {
      fetchPlaces(activeQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeQuery, activeDropdown, fetchPlaces]);

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPickupCoords([lat, lon]);

        try {
          const res = await fetch(`/api/places?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.short_name || data.display_name || "Current Location";
            setPickupAddress(addr);
            setPickupQuery(addr);
          } else {
            setPickupAddress("Current Location");
            setPickupQuery("Current Location");
          }
        } catch {
          setPickupAddress("Current Location");
          setPickupQuery("Current Location");
        } finally {
          setGpsLoading(false);
          setActiveDropdown(null);
        }
      },
      () => {
        setGpsLoading(false);
        setPickupAddress("Current Location");
        setPickupQuery("Current Location");
        setActiveDropdown(null);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  // Swap pickup & dropoff
  const handleSwap = () => {
    const tempAddr = pickupAddress;
    const tempCoords = pickupCoords;
    const tempQuery = pickupQuery;

    setPickupAddress(dropoffAddress);
    setPickupCoords(dropoffCoords);
    setPickupQuery(dropoffQuery);

    setDropoffAddress(tempAddr);
    setDropoffCoords(tempCoords);
    setDropoffQuery(tempQuery);
  };

  // Select a suggestion
  const handleSelectSuggestion = (place: PlaceResult) => {
    const name = place.short_name || place.display_name.split(",")[0];
    const lat = typeof place.lat === "string" ? parseFloat(place.lat) : place.lat;
    const lon = typeof place.lon === "string" ? parseFloat(place.lon) : place.lon;
    const coords: [number, number] = [lat, lon];

    if (activeDropdown === "pickup") {
      setPickupAddress(name);
      setPickupQuery(name);
      setPickupCoords(coords);
      setActiveDropdown(null);
      // Auto-focus drop-off if empty
      if (!dropoffAddress.trim()) {
        setTimeout(() => {
          dropoffInputRef.current?.focus();
          setActiveDropdown("dropoff");
        }, 100);
      }
    } else {
      setDropoffAddress(name);
      setDropoffQuery(name);
      setDropoffCoords(coords);
      setActiveDropdown(null);
    }
  };

  // Submit and Navigate to Book Ride
  const handleNavigateToBookRide = (customDropoff?: string, customDropoffCoords?: [number, number]) => {
    const targetDropoff = customDropoff || dropoffAddress;
    const targetDropoffCoords = customDropoffCoords || dropoffCoords;
    const targetPickup = pickupAddress.trim() || "Current Location";

    const params = new URLSearchParams();
    if (activeTab === "schedule") params.set("tab", "schedule");
    if (activeTab === "rental") params.set("tab", "rental");

    if (targetPickup) params.set("pickup", targetPickup);
    if (pickupCoords) {
      params.set("pickupLat", pickupCoords[0].toString());
      params.set("pickupLng", pickupCoords[1].toString());
    }

    if (targetDropoff.trim()) params.set("dropoff", targetDropoff.trim());
    if (targetDropoffCoords) {
      params.set("dropoffLat", targetDropoffCoords[0].toString());
      params.set("dropoffLng", targetDropoffCoords[1].toString());
    }

    router.push(`/user/book-ride?${params.toString()}`);
  };

  // Quick destination presets derived from user's real saved places
  const quickDestinations =
    savedPlaces && savedPlaces.length > 0
      ? savedPlaces.map((sp) => ({
          id: sp._id,
          name: sp.name,
          address: sp.address,
          coords: (sp.coordinates && sp.coordinates.length === 2
            ? sp.coordinates
            : [28.6139, 77.2090]) as [number, number],
          icon: sp.tag === "Work" ? Building2 : sp.tag === "Home" ? Home : Dumbbell,
          color:
            sp.tag === "Work"
              ? "bg-teal-50/80 text-teal-800 border-teal-200/80 hover:bg-teal-100/90"
              : sp.tag === "Home"
              ? "bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/90"
              : "bg-sky-50/80 text-sky-800 border-sky-200/80 hover:bg-sky-100/90",
          fare: "Live Rate",
          eta: "Near GPS",
          tag: sp.tag,
        }))
      : [];

  const rideModes = [
    {
      label: "Instant Cab",
      icon: CarFront,
      href: "/user/book-ride",
      badge: "Fastest",
      badgeBg: "bg-teal-100 text-teal-700",
    },
    {
      label: "Schedule",
      icon: CalendarClock,
      href: "/user/book-ride?tab=schedule",
      badge: "Zero Surge",
      badgeBg: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Carpool",
      icon: Users2,
      href: "/user/my-commute",
      badge: "Save 40%",
      badgeBg: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Pet Ride",
      icon: Dog,
      href: "/user/book-ride?tab=pet",
      badge: "Specialized",
      badgeBg: "bg-amber-100 text-amber-700",
    },
    {
      label: "Hourly",
      icon: Clock4,
      href: "/user/book-ride?tab=rental",
      badge: "Flexible",
      badgeBg: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Premium Mobility Booking Dock ── */}
      <div
        ref={searchBoxRef}
        className="relative rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] transition-all p-4 sm:p-5"
      >
        {/* Top Mini Control Bar: Tabs + Live Telemetry Status */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("instant")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === "instant"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Zap size={13} className={activeTab === "instant" ? "text-teal-600 fill-teal-600" : ""} />
              <span>Ride Now</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === "schedule"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarClock size={13} />
              <span>Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rental")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === "rental"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock4 size={13} />
              <span>Hourly</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11.5px] font-medium text-slate-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-700">High Driver Availability</span>
            <span className="text-slate-300">•</span>
            <span>Avg pickup: <strong className="text-teal-700">~2 mins</strong></span>
          </div>
        </div>

        {/* Top-and-Bottom (Stacked) Inputs with Small Button */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Stacked Inputs Column */}
          <div className="flex-1 flex flex-col gap-2 relative w-full">
            {/* 1. Pickup Input Pod */}
            <div
              className={`relative flex items-center gap-3 px-3.5 h-12.5 rounded-2xl border transition-all ${
                activeDropdown === "pickup"
                  ? "bg-white border-teal-500 ring-3 ring-teal-500/15 shadow-xs"
                  : "bg-slate-50/90 hover:bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-600 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-teal-600 ring-3 ring-teal-100" />
              </div>

              <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-teal-700/90 leading-none mb-0.5">
                  Pickup Point
                </span>
                <input
                  type="text"
                  value={pickupAddress || pickupQuery}
                  placeholder="Enter pickup address or use GPS"
                  onFocus={() => {
                    setActiveDropdown("pickup");
                    setPickupQuery(pickupAddress);
                  }}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    setPickupQuery(e.target.value);
                    setPickupCoords(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!dropoffAddress.trim()) {
                        dropoffInputRef.current?.focus();
                        setActiveDropdown("dropoff");
                      } else {
                        handleNavigateToBookRide();
                      }
                    }
                  }}
                  className="w-full text-[13.5px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none truncate"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {pickupAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickupAddress("");
                      setPickupQuery("");
                      setPickupCoords(null);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title="Clear pickup"
                  >
                    <X size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Use Current Location"
                >
                  {gpsLoading ? (
                    <Loader2 size={11} className="animate-spin text-teal-600" />
                  ) : (
                    <Navigation size={11} className="text-teal-600 fill-teal-600" />
                  )}
                  <span>GPS</span>
                </button>
              </div>
            </div>

            {/* Central Floating Swap Button */}
            <div className="absolute right-14 sm:right-20 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap pickup and destination"
                className="w-7.5 h-7.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-teal-600 flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
              >
                <ArrowUpDown size={12} />
              </button>
            </div>

            {/* 2. Destination Input Pod */}
            <div
              className={`relative flex items-center gap-3 px-3.5 h-12.5 rounded-2xl border transition-all ${
                activeDropdown === "dropoff"
                  ? "bg-white border-teal-500 ring-3 ring-teal-500/15 shadow-xs"
                  : "bg-slate-50/90 hover:bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-rose-600 fill-rose-100" />
              </div>

              <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600/90 leading-none mb-0.5">
                  Destination
                </span>
                <input
                  ref={dropoffInputRef}
                  type="text"
                  value={dropoffAddress || dropoffQuery}
                  placeholder="Where are you going?"
                  onFocus={() => {
                    setActiveDropdown("dropoff");
                    setDropoffQuery(dropoffAddress);
                  }}
                  onChange={(e) => {
                    setDropoffAddress(e.target.value);
                    setDropoffQuery(e.target.value);
                    setDropoffCoords(null);
                    setLastSelectedChip(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNavigateToBookRide();
                    }
                  }}
                  className="w-full text-[13.5px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none truncate"
                />
              </div>

              {dropoffAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setDropoffAddress("");
                    setDropoffQuery("");
                    setDropoffCoords(null);
                    setLastSelectedChip(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
                  title="Clear destination"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Small, Compact Find Rides Button */}
          <div className="flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => handleNavigateToBookRide()}
              className="h-11 px-5 rounded-xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-[0.98] text-white shadow-sm flex items-center justify-center gap-2 text-[13.5px] font-bold transition-all cursor-pointer group shrink-0"
            >
              <CarFront size={16} className="group-hover:scale-105 transition-transform" />
              <span>Find Rides</span>
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform opacity-90" />
            </button>
          </div>
        </div>

        {/* ── Autocomplete Dropdown Panel ── */}
        {activeDropdown && (
          <div className="absolute left-4 right-4 top-full mt-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 max-h-80 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span>
                {activeDropdown === "pickup" ? "Select Pickup Location" : "Select Destination"}
              </span>
              {loadingSuggestions && (
                <span className="flex items-center gap-1 text-teal-600 lowercase font-normal">
                  <Loader2 size={11} className="animate-spin" /> searching nearby...
                </span>
              )}
            </div>

            {results.length > 0 ? (
              <div className="flex flex-col py-1">
                {results.map((place) => {
                  const glyph = place.isSaved
                    ? "⭐"
                    : place.category === "tech_park"
                    ? "🏢"
                    : place.category === "metro_station"
                    ? "🚇"
                    : place.category === "airport"
                    ? "✈️"
                    : place.category === "mall"
                    ? "🛍️"
                    : place.category === "hospital"
                    ? "🏥"
                    : place.category === "commercial"
                    ? "💼"
                    : "📍";

                  return (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handleSelectSuggestion(place)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-teal-50/60 text-left transition-colors cursor-pointer group"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-base select-none ${
                          place.isSaved
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-colors"
                        }`}
                      >
                        {glyph}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13.5px] font-bold text-slate-900 group-hover:text-teal-900 truncate">
                            {place.short_name || place.display_name.split(",")[0]}
                          </p>
                          {place.categoryLabel && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                                place.isSaved
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800"
                              }`}
                            >
                              {place.categoryLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-slate-500 truncate leading-tight mt-0.5">
                          {place.subtext || place.display_name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !loadingSuggestions ? (
              <div className="py-5 text-center text-[12.5px] text-slate-400">
                {activeQuery.trim()
                  ? "No exact matches found. Press Enter or Find Rides to proceed with this place."
                  : "Type to search any area, sector, metro station, tech park, or choose from recommendations."}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Quick Destination Chips (Only if user has saved places) ── */}
      {quickDestinations.length > 0 && (
        <div className="flex items-center flex-wrap gap-2.5">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Saved Places:
          </span>
          {quickDestinations.map((dest) => {
          const Icon = dest.icon;
          const isSelected = lastSelectedChip === dest.id || dropoffAddress === dest.address;
          return (
            <button
              key={dest.id}
              type="button"
              onClick={() => {
                setDropoffAddress(dest.address);
                setDropoffQuery(dest.name);
                setDropoffCoords(dest.coords);
                setLastSelectedChip(dest.id);
                // If pickup is already filled, navigate immediately
                if (pickupAddress.trim()) {
                  handleNavigateToBookRide(dest.address, dest.coords);
                } else {
                  setActiveDropdown(null);
                }
              }}
              className={`inline-flex items-center gap-2.5 h-11 px-4 rounded-xl border text-left transition-all active:scale-[0.97] cursor-pointer group shadow-2xs ${dest.color} ${
                isSelected ? "ring-2 ring-teal-500 border-teal-500 shadow-xs" : ""
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-bold">{dest.name}</span>
                <span className="text-[11px] font-semibold opacity-60 hidden sm:inline">
                  {dest.fare} · ~{dest.eta}
                </span>
              </div>
              {isSelected ? (
                <CheckCircle2 size={13} className="text-teal-600 shrink-0 ml-auto" />
              ) : (
                <ArrowUpRight
                  size={13}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto"
                />
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => router.push("/user/places")}
          className="inline-flex items-center gap-1.5 h-11 px-3 rounded-xl text-[12px] font-bold text-slate-500 hover:text-teal-700 hover:bg-slate-50 transition-colors cursor-pointer ml-auto"
        >
          <Compass size={13} />
          <span>Manage Saved Places →</span>
        </button>
      </div>
      )}

      {/* ── Ride Modes Row ── */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {rideModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.label}
              type="button"
              onClick={() => router.push(mode.href)}
              className="flex flex-col items-center gap-2 min-w-22 py-3 px-3 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-400 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Icon size={19} />
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 group-hover:text-teal-700 text-center leading-tight transition-colors">
                {mode.label}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${mode.badgeBg}`}
              >
                {mode.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
