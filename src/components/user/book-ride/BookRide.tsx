"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Clock, CarFront, Users, Wallet, Check,
  Star, Navigation, Home, Briefcase, CalendarClock, Heart,
  Phone, MessageSquare, XCircle, RefreshCw,
  Radio, Compass, Loader2
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import LocationSearch from "./LocationSearch";
import DriverChatModal from "@/components/user/rides/DriverChatModal";
import DriverCallModal from "@/components/user/rides/DriverCallModal";
import { useDialog } from "@/components/ui/DialogProvider";

import { VehicleIcon } from "./VehicleIcons";
import MobileBookRide from "../mobile/MobileBookRide";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const BASE_VEHICLES = [
  { id: "bike", name: "Bike", desc: "Beat the city traffic fast", baseRate: 40, perKm: 12, capacity: 1, type: "bike", rating: 4.8 },
  { id: "auto", name: "Auto", desc: "Everyday doorstep rides", baseRate: 50, perKm: 16, capacity: 3, type: "auto", rating: 4.6 },
  { id: "economy", name: "Cab Economy", desc: "Affordable, air-conditioned compacts", baseRate: 80, perKm: 22, capacity: 4, type: "economy", rating: 4.7 },
  { id: "premium", name: "Cab Premium", desc: "Top-rated sedans, extra legroom", baseRate: 120, perKm: 32, capacity: 4, type: "premium", rating: 4.9 },
  { id: "large", name: "Cab Large", desc: "Spacious 6-seater for group travel", baseRate: 160, perKm: 42, capacity: 6, type: "large", rating: 4.8 },
  { id: "parcel", name: "Parcel Express", desc: "Instant package delivery door-to-door", baseRate: 35, perKm: 10, capacity: 1, type: "parcel", rating: 4.9 },
];

interface SavedPlace {
  _id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  tag: string;
}

interface ActiveRide {
  _id: string;
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  pickup: { address: string; coordinates: [number, number] };
  dropoff: { address: string; coordinates: [number, number] };
  vehicleType: string;
  fare: number;
  distance: string;
  duration: string;
  otp: string;
  driverCoordinates?: [number, number];
  driverDetails?: {
    name: string;
    phone: string;
    rating: number;
    vehicleNumber: string;
    vehicleModel: string;
  };
}

export default function BookRidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm } = useDialog();

  const [selected, setSelected] = useState("premium");
  const [rideMode, setRideMode] = useState<"instant" | "schedule">(() =>
    searchParams.get("tab") === "schedule" ? "schedule" : "instant"
  );
  const [petFriendly, setPetFriendly] = useState(false);
  const [prefDriver, setPrefDriver] = useState(false);

  // Locations & Coordinates (empty by default - no demo mock data)
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) return null;
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    return !isNaN(pLat) && !isNaN(pLng) && isFinite(pLat) && isFinite(pLng) ? [pLat, pLng] : null;
  });
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState(
    () => searchParams.get("dest") || ""
  );

  // Route calculation (clean until user enters places)
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeDurationMins, setRouteDurationMins] = useState<number>(0);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);

  // Trip selection status
  const hasTrip = Boolean(
    pickupCoords &&
    dropoffCoords &&
    pickupAddress.trim() &&
    dropoffAddress.trim()
  );

  // Backend Saved Places
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(500);

  // Scheduling
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState("09:00");

  // Booking & Live Active Ride State
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);

  // Modals for Driver Call & Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  // Real-Time GPS Tracking & Exact Pinpoint State
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<"none" | "pickup" | "dropoff">("none");
  const watchIdRef = React.useRef<number | null>(null);
  const isFetchingAddressRef = React.useRef(false);
  const hasInitializedLocationRef = React.useRef(false);

  // Helper: Reverse Geocoding via /api/places
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/places?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        return data.short_name || data.display_name || `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e);
    }
    return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  };

  // One-time locate exact user location
  const handleUseCurrentLocation = (syncAsPickup = true) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsNotice("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        if (!isFinite(lat) || !isFinite(lon) || isNaN(lat) || isNaN(lon)) {
          setGpsLoading(false);
          return;
        }
        setUserCoords([lat, lon]);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsLoading(false);

        if (syncAsPickup) {
          setPickupCoords([lat, lon]);
          setGpsNotice(`GPS acquired accurate within ±${Math.round(pos.coords.accuracy)}m`);
          const addr = await fetchAddressFromCoords(lat, lon);
          setPickupAddress(addr);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsNotice(`GPS Signal unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Real-time continuous user tracking toggle
  const handleToggleLiveTracking = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsNotice("Geolocation not supported by your browser.");
      return;
    }
    const nextVal = !isLiveTracking;
    setIsLiveTracking(nextVal);
    if (nextVal) {
      setGpsNotice("Live GPS tracking active: synchronizing pickup with real-time location");
      handleUseCurrentLocation(true);
    } else {
      setGpsNotice(null);
    }
  };

  useEffect(() => {
    if (!isLiveTracking || typeof window === "undefined" || !navigator.geolocation) {
      if (watchIdRef.current !== null && typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    const onLocationReceived = async (pos: GeolocationPosition, isInitial = false) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      if (!isFinite(lat) || !isFinite(lon) || isNaN(lat) || isNaN(lon)) return;

      setUserCoords([lat, lon]);
      setGpsAccuracy(Math.round(pos.coords.accuracy));

      // On initial fix: if pickup is not yet selected, set pickup and reverse geocode ONCE
      if ((isInitial || !hasInitializedLocationRef.current) && !hasTrip) {
        setPickupCoords((prev) => prev || [lat, lon]);
        if (!hasInitializedLocationRef.current && !isFetchingAddressRef.current) {
          hasInitializedLocationRef.current = true;
          isFetchingAddressRef.current = true;
          try {
            const addr = await fetchAddressFromCoords(lat, lon);
            setPickupAddress((current) => current || addr);
          } finally {
            isFetchingAddressRef.current = false;
          }
        }
      }
    };

    // Fast initial fix
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocationReceived(pos, true),
      (err) => console.warn("Initial location notice:", err.message),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );

    // Continuous real-time location stream
    const watchId = navigator.geolocation.watchPosition(
      (pos) => onLocationReceived(pos, false),
      (err) => console.warn("Watch position notice:", err.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    watchIdRef.current = watchId;

    return () => {
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLiveTracking, hasTrip]);

  // Handle map click
  const handleMapClick = async (coords: [number, number]) => {
    if (mapSelectionMode === "pickup") {
      setPickupCoords(coords);
      setMapSelectionMode("none");
      const addr = await fetchAddressFromCoords(coords[0], coords[1]);
      setPickupAddress(addr);
    } else if (mapSelectionMode === "dropoff") {
      setDropoffCoords(coords);
      setMapSelectionMode("none");
      const addr = await fetchAddressFromCoords(coords[0], coords[1]);
      setDropoffAddress(addr);
    }
  };

  // Handle draggable pin adjustments
  const handlePickupDrag = async (coords: [number, number]) => {
    setPickupCoords(coords);
    const addr = await fetchAddressFromCoords(coords[0], coords[1]);
    setPickupAddress(addr);
  };

  const handleDropoffDrag = async (coords: [number, number]) => {
    setDropoffCoords(coords);
    const addr = await fetchAddressFromCoords(coords[0], coords[1]);
    setDropoffAddress(addr);
  };

  // Fetch Saved Places & Check Active Ride from Backend
  useEffect(() => {
    fetch("/api/user/places")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") setSavedPlaces(json.data || []);
      })
      .catch(() => {});

    fetch("/api/user/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          if (json.data?.user?.walletBalance !== undefined) {
            setWalletBalance(json.data.user.walletBalance);
          }
          if (json.data?.activeRide) {
            setActiveRide(json.data.activeRide);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real road routing from OSRM
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) return;

    let ignore = false;
    const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords[1]},${pickupCoords[0]};${dropoffCoords[1]},${dropoffCoords[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const distKm = parseFloat((route.distance / 1000).toFixed(1));
          const durMins = Math.round(route.duration / 60);
          setRouteDistanceKm(distKm || 1.0);
          setRouteDurationMins(durMins || 5);

          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setRouteCoords(coords);
        }
      })
      .catch(() => {
        if (!ignore) {
          const dLat = dropoffCoords[0] - pickupCoords[0];
          const dLng = dropoffCoords[1] - pickupCoords[1];
          const approxDist = Math.max(1, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111));
          setRouteDistanceKm(approxDist);
          setRouteDurationMins(Math.max(5, Math.round(approxDist * 2.5)));
          setRouteCoords([pickupCoords, dropoffCoords]);
        }
      })
      .finally(() => {
        if (!ignore) setRouteLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [pickupCoords, dropoffCoords]);

  // Dynamic Vehicles with live distance-calculated pricing
  const dynamicVehicles = BASE_VEHICLES.map((v) => {
    const rawPrice = Math.round(v.baseRate + v.perKm * routeDistanceKm);
    const finalPrice = petFriendly ? Math.round(rawPrice * 1.15) : rawPrice;
    const etaMins = Math.max(1, Math.round(routeDurationMins * 0.15 + (v.type === "bike" ? 1 : 3)));
    return {
      ...v,
      price: `₹${finalPrice}`,
      numericPrice: finalPrice,
      eta: `${etaMins} min`,
    };
  });

  const selectedVehicle = dynamicVehicles.find((v) => v.id === selected) || dynamicVehicles[2];

  // Book Ride
  const handleBookRide = async () => {
    if (!pickupAddress || !pickupCoords) {
      setBookingError("Please specify a pickup location.");
      return;
    }
    if (!dropoffAddress || !dropoffCoords) {
      setBookingError("Please specify a drop-off destination.");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    try {
      const scheduledFor =
        rideMode === "schedule" ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null;

      const res = await fetch("/api/user/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: {
            address: pickupAddress,
            coordinates: pickupCoords,
          },
          dropoff: {
            address: dropoffAddress,
            coordinates: dropoffCoords,
          },
          vehicleType: selectedVehicle.name,
          fare: selectedVehicle.numericPrice,
          distance: `${routeDistanceKm} km`,
          duration: `${routeDurationMins} mins`,
          scheduledFor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.message || "Failed to book ride");
        setBookingLoading(false);
        return;
      }

      if (scheduledFor) {
        router.push("/user/trips");
      } else {
        setActiveRide(data.data);
      }
    } catch {
      setBookingError("Network error. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Advance or Cancel Active Ride
  const handleAdvanceStatus = async (action: "advance_status" | "cancel") => {
    if (!activeRide) return;
    try {
      const res = await fetch(`/api/user/rides/${activeRide._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "cancel" || data.data.status === "COMPLETED") {
          setActiveRide(null);
        } else {
          setActiveRide(data.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulated moving driver coordinates during active ride
  const driverPosition: [number, number] | null = activeRide
    ? activeRide.driverCoordinates || [
        activeRide.pickup.coordinates[0] + 0.003,
        activeRide.pickup.coordinates[1] + 0.003,
      ]
    : null;

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* ── Dedicated Native Mobile Ride Experience (< 1024px) ── */}
      <div className="flex lg:hidden flex-col flex-1">
        <MobileBookRide
          selected={selected}
          setSelected={setSelected}
          rideMode={rideMode}
          setRideMode={setRideMode}
          petFriendly={petFriendly}
          setPetFriendly={setPetFriendly}
          prefDriver={prefDriver}
          setPrefDriver={setPrefDriver}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          pickupAddress={pickupAddress}
          dropoffAddress={dropoffAddress}
          setPickupCoords={setPickupCoords}
          setDropoffCoords={setDropoffCoords}
          setPickupAddress={setPickupAddress}
          setDropoffAddress={setDropoffAddress}
          routeCoords={routeCoords}
          routeDistanceKm={routeDistanceKm}
          routeDurationMins={routeDurationMins}
          routeLoading={routeLoading}
          hasTrip={hasTrip}
          savedPlaces={savedPlaces}
          walletBalance={walletBalance}
          scheduleDate={scheduleDate}
          scheduleTime={scheduleTime}
          setScheduleDate={setScheduleDate}
          setScheduleTime={setScheduleTime}
          bookingLoading={bookingLoading}
          bookingError={bookingError}
          activeRide={activeRide}
          handleBookRide={handleBookRide}
          handleAdvanceStatus={handleAdvanceStatus}
          setIsChatOpen={setIsChatOpen}
          setIsCallOpen={setIsCallOpen}
          userCoords={userCoords}
          gpsAccuracy={gpsAccuracy}
          isLiveTracking={isLiveTracking}
          gpsLoading={gpsLoading}
          gpsNotice={gpsNotice}
          setGpsNotice={setGpsNotice}
          handleUseCurrentLocation={handleUseCurrentLocation}
          handleToggleLiveTracking={handleToggleLiveTracking}
          mapSelectionMode={mapSelectionMode}
          setMapSelectionMode={setMapSelectionMode}
          handlePickupDrag={handlePickupDrag}
          handleDropoffDrag={handleDropoffDrag}
          handleMapClick={handleMapClick}
          dynamicVehicles={dynamicVehicles}
          selectedVehicle={selectedVehicle}
          driverPosition={driverPosition}
        />
      </div>

      {/* ── Desktop View (>= 1024px) — 100% Preserved Exactly As Original ── */}
      <div className="hidden lg:flex flex-col gap-4 flex-1">
        {/* ── Active Ride Live Tracker Overlay Screen (Like Rapido/Uber) ── */}
        {activeRide && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
          {/* Left Live Status Card */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="card p-5 border-2 border-teal-500 bg-teal-50/40 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                  {activeRide.status === "SEARCHING"
                    ? "Searching Nearest Driver..."
                    : activeRide.status === "ACCEPTED"
                    ? "Driver Confirmed (En Route)"
                    : activeRide.status === "ARRIVED"
                    ? "Driver Arrived at Pickup Point"
                    : "Trip In Progress"}
                </span>

                <span className="text-[12px] font-mono text-slate-500">
                  #{activeRide._id.slice(-6).toUpperCase()}
                </span>
              </div>

              {/* Driver Details Card */}
              <div className="p-4 rounded-xl bg-white border border-teal-100 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-bold text-lg flex items-center justify-center">
                      {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "B"}
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-slate-900">
                        {activeRide.driverDetails?.name || "Bhavo Pilot"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span>{activeRide.driverDetails?.rating || 4.9}</span>
                        <span>•</span>
                        <span>{activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}</span>
                      </div>
                    </div>
                  </div>

                  {activeRide.driverDetails?.vehicleNumber && (
                    <span className="px-2.5 py-1 rounded bg-slate-100 font-mono text-[12px] font-bold text-slate-800 border border-slate-200">
                      {activeRide.driverDetails.vehicleNumber}
                    </span>
                  )}
                </div>

                {/* OTP Pin */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-200">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Start PIN</p>
                    <p className="text-[11px] text-teal-700">Share with driver on arrival</p>
                  </div>
                  <div className="px-3.5 py-1 bg-white rounded-lg border border-teal-300 font-mono text-xl font-black text-teal-900 tracking-widest shadow-sm">
                    {activeRide.otp}
                  </div>
                </div>

                {/* Real-Time Calling & Chat Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setIsCallOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-98"
                  >
                    <Phone size={14} /> Call Driver
                  </button>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-98"
                  >
                    <MessageSquare size={14} /> Message Driver
                  </button>
                </div>
              </div>

              {/* Route Summary */}
              <div className="p-4 rounded-xl bg-white border border-teal-100 flex flex-col gap-3">
                <div className="relative pl-6 flex flex-col gap-3">
                  <div className="absolute left-2.5 top-2 bottom-3 w-0.5 bg-teal-200" />
                  <div className="relative flex items-start gap-2">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-teal-500 bg-white" />
                    <div>
                      <p className="text-[11px] font-bold uppercase text-teal-600">Pickup</p>
                      <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{activeRide.pickup.address}</p>
                    </div>
                  </div>
                  <div className="relative flex items-start gap-2">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 flex items-center justify-center">
                      <MapPin size={8} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-teal-600">Destination</p>
                      <p className="text-[13px] font-semibold text-slate-900 line-clamp-1">{activeRide.dropoff.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[13px]">
                  <span className="text-slate-500">Trip Fare: <strong className="text-teal-700 text-[16px]">₹{activeRide.fare}</strong></span>
                  <span className="text-slate-500">Distance: <strong className="text-slate-800">{activeRide.distance}</strong></span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAdvanceStatus("advance_status")}
                  className="flex-1 py-2 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={12} /> Advance Status
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: "Cancel ride?",
                      message: "Your driver is already on the way.",
                      confirmText: "Cancel ride",
                      cancelText: "Keep ride",
                      variant: "danger",
                    });
                    if (confirmed) handleAdvanceStatus("cancel");
                  }}
                  className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <XCircle size={14} /> Cancel Ride
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Map */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden relative min-h-100 lg:h-[calc(100vh-140px)] border border-slate-200 shadow-sm">
            <LeafletMap
              pickupCoords={activeRide.pickup.coordinates}
              dropoffCoords={activeRide.dropoff.coordinates}
              driverCoords={driverPosition}
              userCoords={userCoords}
              routeCoords={routeCoords}
              vehicleType={activeRide.vehicleType}
            />

            {/* Live tracking badge */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[13px] font-bold text-slate-900">
                Driver live position updated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Form (When no active ride) ── */}
      {!activeRide && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
          {/* Left Panel */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:pr-2 no-scrollbar pb-2">
            {/* Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setRideMode("instant")}
                className="flex-1 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                style={{
                  background: rideMode === "instant" ? "#ffffff" : "transparent",
                  color: rideMode === "instant" ? "#0f172a" : "#64748b",
                  boxShadow: rideMode === "instant" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <CarFront size={14} /> Instant Ride
              </button>
              <button
                onClick={() => setRideMode("schedule")}
                className="flex-1 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                style={{
                  background: rideMode === "schedule" ? "#ffffff" : "transparent",
                  color: rideMode === "schedule" ? "#0f172a" : "#64748b",
                  boxShadow: rideMode === "schedule" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <CalendarClock size={14} /> Schedule Ride
              </button>
            </div>

            {/* Location Selection */}
            <div className="card p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Pick & Drop Points
                </p>
                {rideMode === "schedule" && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="text-[11px] font-semibold px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-900 outline-none"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="text-[11px] font-semibold px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-900 outline-none"
                    />
                  </div>
                )}
              </div>

              {gpsNotice && (
                <div className="text-[11px] text-teal-800 bg-teal-100/60 px-3 py-1.5 rounded-lg border border-teal-200 flex items-center justify-between">
                  <span>{gpsNotice}</span>
                  <button
                    type="button"
                    onClick={() => setGpsNotice(null)}
                    className="text-teal-600 hover:text-teal-950 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="relative flex flex-col gap-4">
                <div className="absolute left-3.5 top-8 bottom-8 w-px bg-teal-200" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Spot</span>
                    <button
                      type="button"
                      onClick={() => setMapSelectionMode(mapSelectionMode === "pickup" ? "none" : "pickup")}
                      className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        mapSelectionMode === "pickup" ? "text-teal-700 font-black" : "text-teal-600 hover:text-teal-800"
                      }`}
                    >
                      <MapPin size={11} /> {mapSelectionMode === "pickup" ? "Pinning on Map..." : "Pin on Map"}
                    </button>
                  </div>
                  <LocationSearch
                    label=""
                    placeholder="Search pickup area or tap location..."
                    defaultValue={pickupAddress}
                    iconBg="#16a34a"
                    icon={<div className="w-2.5 h-2.5 bg-white rounded-full shadow-xs" />}
                    onSelect={(lat, lon, name) => {
                      setPickupCoords([lat, lon]);
                      setPickupAddress(name);
                    }}
                    onClear={() => {
                      setPickupCoords(null);
                      setPickupAddress("");
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination</span>
                    <button
                      type="button"
                      onClick={() => setMapSelectionMode(mapSelectionMode === "dropoff" ? "none" : "dropoff")}
                      className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        mapSelectionMode === "dropoff" ? "text-teal-700 font-black" : "text-teal-600 hover:text-teal-800"
                      }`}
                    >
                      <Compass size={11} /> {mapSelectionMode === "dropoff" ? "Pinning on Map..." : "Pin on Map"}
                    </button>
                  </div>
                  <LocationSearch
                    label=""
                    placeholder="Where do you want to go?"
                    defaultValue={dropoffAddress}
                    iconBg="#dc2626"
                    icon={<MapPin size={13} className="text-white" />}
                    onSelect={(lat, lon, name) => {
                      setDropoffCoords([lat, lon]);
                      setDropoffAddress(name);
                    }}
                    onClear={() => {
                      setDropoffCoords(null);
                      setDropoffAddress("");
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Saved Places from Backend */}
              <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
                {savedPlaces.map((place) => (
                  <button
                    key={place._id}
                    type="button"
                    onClick={() => {
                      setDropoffAddress(place.address);
                      if (place.coordinates && place.coordinates.length === 2) {
                        setDropoffCoords(place.coordinates);
                      }
                    }}
                    className="pill-teal shrink-0 hover:scale-102 transition-transform cursor-pointer"
                  >
                    {place.tag === "Home" ? (
                      <Home size={10} />
                    ) : place.tag === "Work" ? (
                      <Briefcase size={10} />
                    ) : (
                      <Heart size={10} />
                    )}
                    {place.name}
                  </button>
                ))}
              </div>
            </div>

            {/* If locations are not yet selected, show guidance card; otherwise show real vehicles & fares */}
            {!hasTrip ? (
              <div className="card p-6 flex flex-col items-center justify-center text-center gap-4 bg-linear-to-b from-teal-50/50 via-white to-slate-50 border border-dashed border-teal-200 rounded-2xl shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-xs">
                  <Navigation size={26} className="text-teal-600" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-[15px] font-bold text-slate-900">
                    {!pickupAddress && !dropoffAddress
                      ? "Enter pickup & destination"
                      : !pickupAddress
                      ? "Set pickup location"
                      : "Choose your destination"}
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                    {!pickupAddress && !dropoffAddress
                      ? "Enter your pickup point and destination to see available Bhavo rides, live ETAs, and real-time upfront fares."
                      : !pickupAddress
                      ? "Tap 'Use Exact Current Location' or search your pickup spot to view vehicle options."
                      : "Search your destination or tap a saved place above to calculate route and view vehicle fares."}
                  </p>
                </div>

                <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Live GPS Rates
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Verified Pilots
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> No Surge Hikes
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Vehicle Selection with dynamic rates */}
                <div className="card p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Select Ride Tier
                    </p>
                    <span className="text-[11px] text-teal-700 font-semibold">
                      {routeLoading ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Loader2 size={11} className="animate-spin text-teal-600" /> Calculating...
                        </span>
                      ) : (
                        `Distance: ${routeDistanceKm} km`
                      )}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {dynamicVehicles.map((v) => {
                      const isSelected = selected === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelected(v.id)}
                          className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border cursor-pointer"
                          style={{
                            background: isSelected ? "#f0fdfa" : "#ffffff",
                            borderColor: isSelected ? "#14b8a6" : "#e2e8f0",
                            boxShadow: isSelected ? "0 2px 8px rgba(20,184,166,0.15)" : "none",
                          }}
                        >
                          <div
                            className="w-14 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                            style={{
                              background: isSelected ? "#ccfbf1" : "#f8fafc",
                              borderColor: isSelected ? "#99f6e4" : "#e2e8f0",
                            }}
                          >
                            <VehicleIcon id={v.id} type={v.type} className="w-11 h-7" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-bold text-slate-900">{v.name}</p>
                              <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
                                <Users size={10} /> {v.capacity}
                              </span>
                            </div>
                            <p className="text-[12px] font-medium mt-0.5 text-slate-500">{v.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[16px] font-black text-slate-900">
                              {routeLoading ? "..." : v.price}
                            </p>
                            <p className="text-[11px] font-medium mt-0.5 text-teal-600">{v.eta} away</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-teal-600">
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ride Preferences */}
                <div className="card p-4 flex flex-col gap-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-slate-500">
                    Preferences & Payment
                  </p>

                  <button
                    type="button"
                    onClick={() => setPetFriendly(!petFriendly)}
                    className="flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="text-xl">🐶</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-slate-900">Pet-Friendly Ride</p>
                      <p className="text-[11px] font-medium text-slate-500">Bring your pet safely (+15%)</p>
                    </div>
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all border"
                      style={{
                        background: petFriendly ? "#14b8a6" : "white",
                        borderColor: petFriendly ? "#14b8a6" : "#cbd5e1",
                      }}
                    >
                      {petFriendly && <Check size={12} className="text-white" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrefDriver(!prefDriver)}
                    className="flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-teal-50">
                      <Star
                        size={15}
                        className={`text-teal-600 ${prefDriver ? "fill-teal-600" : ""}`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-slate-900">Top-Rated Preferred Drivers</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        Match with top-ranked pilots first
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all border"
                      style={{
                        background: prefDriver ? "#14b8a6" : "white",
                        borderColor: prefDriver ? "#14b8a6" : "#99f6e4",
                      }}
                    >
                      {prefDriver && <Check size={12} className="text-white" />}
                    </div>
                  </button>

                  <div className="flex items-center gap-3 p-3 rounded-lg w-full text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-teal-50">
                      <Wallet size={15} className="text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-slate-900">Payment: Bhavo Wallet</p>
                      <p className="text-[11px] font-medium text-teal-700">₹{walletBalance} available balance</p>
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                    {bookingError}
                  </div>
                )}

                {/* Confirm Ride CTA */}
                <button
                  type="button"
                  onClick={handleBookRide}
                  disabled={bookingLoading || routeLoading}
                  className="w-full h-12 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] mt-1 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "#0d9488", boxShadow: "0 4px 16px rgba(13,148,136,0.35)" }}
                >
                  {bookingLoading ? (
                    <span>Dispatching Driver...</span>
                  ) : routeLoading ? (
                    <span>Calculating Fares...</span>
                  ) : (
                    <>
                      {rideMode === "schedule"
                        ? `Schedule ${selectedVehicle.name} (${selectedVehicle.price})`
                        : `Confirm ${selectedVehicle.name} (${selectedVehicle.price})`}{" "}
                      <Navigation size={16} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Right Map Panel */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden relative min-h-100 lg:h-[calc(100vh-130px)] lg:sticky lg:top-8 self-start bg-slate-50 border border-slate-200 shadow-sm">
            <LeafletMap
              pickupCoords={pickupCoords}
              dropoffCoords={dropoffCoords}
              userCoords={userCoords}
              routeCoords={hasTrip ? routeCoords : []}
              vehicleType={selectedVehicle.type}
              isDraggable={true}
              onPickupDrag={handlePickupDrag}
              onDropoffDrag={handleDropoffDrag}
              onMapClick={handleMapClick}
              selectionMode={mapSelectionMode}
            />

            {/* Interactive Pinpoint Active Banner */}
            {mapSelectionMode !== "none" && (
              <div className="absolute top-4 left-4 right-4 z-20 bg-teal-900/95 text-white backdrop-blur px-4 py-3 rounded-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 border border-teal-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-teal-500/30 flex items-center justify-center">
                    <MapPin size={16} className="text-teal-300 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">
                      Click anywhere on the map to place {mapSelectionMode === "pickup" ? "Exact Pickup Point" : "Exact Destination"}
                    </p>
                    <p className="text-[11px] text-teal-200">You can also drag existing markers to fine-tune doorstep</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMapSelectionMode("none")}
                  className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-[12px] font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Road route overlay badge & Live GPS status */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {hasTrip && routeDistanceKm > 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl z-10 bg-white/95 backdrop-blur border border-slate-200 shadow-md">
                  <Clock size={14} className="text-teal-600" />
                  <span className="text-[13px] font-bold text-slate-900">
                    {routeDistanceKm} km · Est. {routeDurationMins} mins
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl z-10 bg-white/95 backdrop-blur border border-slate-200 shadow-md">
                  <MapPin size={14} className="text-teal-600" />
                  <span className="text-[12px] font-bold text-slate-800">
                    {!pickupAddress && !dropoffAddress
                      ? "Choose pickup & destination to preview route"
                      : !pickupAddress
                      ? "Set pickup location"
                      : "Select destination to view route"}
                  </span>
                </div>
              )}

              {gpsAccuracy && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl z-10 bg-white/95 backdrop-blur border border-slate-200 shadow-md">
                  <Radio size={12} className="text-sky-500 animate-pulse" />
                  <span className="text-[12px] font-semibold text-slate-700">GPS ±{gpsAccuracy}m</span>
                </div>
              )}
            </div>

            {/* Drag pin tip banner (Only when route is active) */}
            {hasTrip && (
              <div className="absolute bottom-24 left-4 right-4 flex justify-center z-10 pointer-events-none">
                <span className="bg-slate-900/80 backdrop-blur text-white text-[11px] font-medium px-3.5 py-1.5 rounded-full shadow-md">
                  📍 Drag pickup or destination pin to adjust exact doorstep
                </span>
              </div>
            )}

            {/* Selected Vehicle Float Preview (Only when route is active) */}
            {hasTrip && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 p-3.5 rounded-xl z-10 bg-white/95 backdrop-blur border border-slate-200 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="w-13 h-11 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 border border-teal-200">
                  <VehicleIcon id={selectedVehicle.id} type={selectedVehicle.type} className="w-10 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-slate-900">{selectedVehicle.name}</p>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium mt-0.5 text-slate-500">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {selectedVehicle.rating}
                    <span className="w-1 h-1 rounded-full mx-0.5 bg-slate-300" />
                    {selectedVehicle.eta} away
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[17px] font-black text-slate-900">
                    {routeLoading ? "..." : selectedVehicle.price}
                  </p>
                  <p className="text-[11px] font-medium text-teal-600">Calculated Fare</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Driver Chat Modal */}
      {activeRide && (
        <DriverChatModal
          rideId={activeRide._id}
          driverName={activeRide.driverDetails?.name || "Bhavo Pilot"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || "DL-01-AB-1234"}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onCallDriver={() => {
            setIsChatOpen(false);
            setIsCallOpen(true);
          }}
        />
      )}

      {/* Driver Call Modal */}
      {activeRide && (
        <DriverCallModal
          driverName={activeRide.driverDetails?.name || "Bhavo Pilot"}
          driverPhone={activeRide.driverDetails?.phone || "+91 98765 43210"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleModel={activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || "DL-01-AB-1234"}
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
        />
      )}
    </div>
  );
}
