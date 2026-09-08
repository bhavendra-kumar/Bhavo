"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, CarFront, Users, Wallet, Check,
  Star, Navigation, Home, Briefcase, CalendarClock, Heart,
  Phone, MessageSquare, XCircle, RefreshCw,
  Radio, Target, Compass, Loader2, Edit2, ShieldAlert
} from "lucide-react";
import dynamic from "next/dynamic";
import LocationSearch from "../book-ride/LocationSearch";
import { VehicleIcon } from "../book-ride/VehicleIcons";
import { useDialog } from "@/components/ui/DialogProvider";

const LeafletMap = dynamic(() => import("../book-ride/LeafletMap"), { ssr: false });

interface VehicleItem {
  id: string;
  name: string;
  desc: string;
  baseRate: number;
  perKm: number;
  capacity: number;
  type: string;
  rating: number;
  price: string;
  numericPrice: number;
  eta: string;
}

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

interface MobileBookRideProps {
  selected: string;
  setSelected: (id: string) => void;
  rideMode: "instant" | "schedule";
  setRideMode: (mode: "instant" | "schedule") => void;
  petFriendly: boolean;
  setPetFriendly: (val: boolean) => void;
  prefDriver: boolean;
  setPrefDriver: (val: boolean) => void;
  pickupCoords: [number, number] | null;
  dropoffCoords: [number, number] | null;
  pickupAddress: string;
  dropoffAddress: string;
  setPickupCoords: (coords: [number, number] | null) => void;
  setDropoffCoords: (coords: [number, number] | null) => void;
  setPickupAddress: (addr: string) => void;
  setDropoffAddress: (addr: string) => void;
  routeCoords: [number, number][];
  routeDistanceKm: number;
  routeDurationMins: number;
  routeLoading: boolean;
  hasTrip: boolean;
  savedPlaces: SavedPlace[];
  walletBalance: number;
  scheduleDate: string;
  scheduleTime: string;
  setScheduleDate: (val: string) => void;
  setScheduleTime: (val: string) => void;
  bookingLoading: boolean;
  bookingError: string;
  activeRide: ActiveRide | null;
  handleBookRide: () => Promise<void>;
  handleAdvanceStatus: (action: "advance_status" | "cancel") => Promise<void>;
  setIsChatOpen: (val: boolean) => void;
  setIsCallOpen: (val: boolean) => void;
  userCoords: [number, number] | null;
  gpsAccuracy: number | null;
  isLiveTracking: boolean;
  gpsLoading: boolean;
  gpsNotice: string | null;
  setGpsNotice: (val: string | null) => void;
  handleUseCurrentLocation: (syncAsPickup?: boolean) => void;
  handleToggleLiveTracking: () => void;
  mapSelectionMode: "none" | "pickup" | "dropoff";
  setMapSelectionMode: (mode: "none" | "pickup" | "dropoff") => void;
  handlePickupDrag: (coords: [number, number]) => Promise<void>;
  handleDropoffDrag: (coords: [number, number]) => Promise<void>;
  handleMapClick: (coords: [number, number]) => Promise<void>;
  dynamicVehicles: VehicleItem[];
  selectedVehicle: VehicleItem;
  driverPosition: [number, number] | null;
}

export default function MobileBookRide(props: MobileBookRideProps) {
  const {
    selected, setSelected,
    rideMode, setRideMode,
    petFriendly, setPetFriendly,
    prefDriver, setPrefDriver,
    pickupCoords, dropoffCoords,
    pickupAddress, dropoffAddress,
    setPickupCoords, setDropoffCoords,
    setPickupAddress, setDropoffAddress,
    routeCoords, routeDistanceKm, routeDurationMins, routeLoading,
    hasTrip, savedPlaces, walletBalance,
    scheduleDate, scheduleTime, setScheduleDate, setScheduleTime,
    bookingLoading, bookingError, activeRide,
    handleBookRide, handleAdvanceStatus,
    setIsChatOpen, setIsCallOpen,
    userCoords, isLiveTracking,
    gpsLoading, gpsNotice, setGpsNotice,
    handleUseCurrentLocation, handleToggleLiveTracking,
    mapSelectionMode, setMapSelectionMode,
    handlePickupDrag, handleDropoffDrag, handleMapClick,
    dynamicVehicles, selectedVehicle, driverPosition
  } = props;

  const [isEditingLocations, setIsEditingLocations] = useState(false);
  const isLocationsCollapsed = hasTrip && !isEditingLocations;
  const { confirm, alert } = useDialog();

  /* ─────────────────────────────────────────────────────────────
     1. ACTIVE RIDE LIVE TRACKER SCREEN (RAPIDO/UBER STYLE)
  ───────────────────────────────────────────────────────────── */
  if (activeRide) {
    return (
      <div className="flex flex-col gap-3 pb-6 flex-1 -mx-3.5 -mt-3">
        {/* Top Interactive Live Map */}
        <div className="relative w-full h-[46vh] overflow-hidden border-b border-teal-200 shadow-sm">
          <LeafletMap
            pickupCoords={activeRide.pickup.coordinates}
            dropoffCoords={activeRide.dropoff.coordinates}
            driverCoords={driverPosition}
            userCoords={userCoords}
            routeCoords={routeCoords}
            vehicleType={activeRide.vehicleType}
          />

          {/* Live tracking status floating badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-md flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[11.5px] font-bold text-slate-900">
              Driver live tracking active
            </span>
          </div>

          <div className="absolute top-3 right-3 z-10 bg-[#042f2e] text-white px-2.5 py-1 rounded-full font-mono text-[11px] font-bold shadow-md">
            #{activeRide._id.slice(-6).toUpperCase()}
          </div>
        </div>

        {/* Live Driver & Trip Details Sheet */}
        <div className="px-3.5 flex flex-col gap-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
              {activeRide.status === "SEARCHING"
                ? "Searching Nearest Driver..."
                : activeRide.status === "ACCEPTED"
                ? "Driver Confirmed (ETA ~3m)"
                : activeRide.status === "ARRIVED"
                ? "Driver at Pickup Location"
                : "Trip In Progress"}
            </span>

            <span className="text-[15px] font-black text-teal-800">
              ₹{activeRide.fare}
            </span>
          </div>

          {/* Driver Profile Card */}
          <div className="card p-3.5 border border-teal-100 shadow-xs flex flex-col gap-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  {activeRide.driverDetails?.name ? activeRide.driverDetails.name[0] : "B"}
                </div>
                <div>
                  <p className="font-bold text-[14.5px] text-slate-900 leading-tight">
                    {activeRide.driverDetails?.name || "Bhavo Pilot"}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium mt-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span>{activeRide.driverDetails?.rating || 4.9}</span>
                    <span>•</span>
                    <span>{activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}</span>
                  </div>
                </div>
              </div>

              {activeRide.driverDetails?.vehicleNumber && (
                <span className="px-2 py-1 rounded bg-slate-100 font-mono text-[11.5px] font-black text-slate-800 border border-slate-200">
                  {activeRide.driverDetails.vehicleNumber}
                </span>
              )}
            </div>

            {/* OTP Pin Card */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-teal-50 border border-teal-200">
              <div>
                <p className="text-[9.5px] uppercase font-bold text-teal-800 tracking-wider">Start PIN</p>
                <p className="text-[11px] text-teal-700">Share with pilot on arrival</p>
              </div>
              <div className="px-3.5 py-0.5 bg-white rounded-lg border border-teal-300 font-mono text-xl font-black text-teal-900 tracking-widest shadow-xs">
                {activeRide.otp}
              </div>
            </div>

            {/* Quick Action Buttons: Call, Message, SOS */}
            <div className="grid grid-cols-4 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsCallOpen(true)}
                className="col-span-2 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                <Phone size={14} /> Call Driver
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-bold flex items-center justify-center gap-1 border border-slate-200 active:scale-98 transition-transform cursor-pointer"
              >
                <MessageSquare size={14} /> Chat
              </button>
              <button
                type="button"
                onClick={() =>
                  alert({
                    title: "Emergency SOS",
                    message: "Safety team and emergency services have been alerted.",
                    variant: "danger",
                  })
                }
                className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold flex items-center justify-center active:scale-98 transition-transform cursor-pointer"
                title="Emergency SOS"
              >
                <ShieldAlert size={16} />
              </button>
            </div>
          </div>

          {/* Route Summary */}
          <div className="card p-3.5 border border-teal-100 flex flex-col gap-2.5 bg-white">
            <div className="relative pl-5 flex flex-col gap-2.5">
              <div className="absolute left-2 top-1.5 bottom-2 w-0.5 bg-teal-200" />
              <div className="relative flex items-start gap-2">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-teal-500 bg-white" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-teal-600">Pickup</p>
                  <p className="text-[12.5px] font-semibold text-slate-900 line-clamp-1">{activeRide.pickup.address}</p>
                </div>
              </div>
              <div className="relative flex items-start gap-2">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-600 flex items-center justify-center">
                  <MapPin size={7} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-teal-600">Drop-off</p>
                  <p className="text-[12.5px] font-semibold text-slate-900 line-clamp-1">{activeRide.dropoff.address}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[12px]">
              <span className="text-slate-500">Distance: <strong className="text-slate-800">{activeRide.distance}</strong></span>
              <span className="text-slate-500">Duration: <strong className="text-slate-800">{activeRide.duration}</strong></span>
            </div>
          </div>

          {/* Action Simulation & Cancel */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAdvanceStatus("advance_status")}
              className="flex-1 py-2.5 rounded-xl bg-teal-100 active:bg-teal-200 text-teal-900 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Simulate Progress
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
              className="py-2.5 px-4 rounded-xl bg-rose-50 active:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle size={14} /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. BOOKING INTERFACE SCREEN (RAPIDO/OLA/UBER STYLE)
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-3 pb-8 flex-1 -mx-3.5 -mt-3">
      {/* ── Top Map Canvas Viewport (Takes ~42vh on mobile) ── */}
      <div className="relative w-full h-[38vh] overflow-hidden border-b border-teal-200 shadow-sm shrink-0">
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

        {/* Floating Top Route Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          {hasTrip && routeDistanceKm > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-md text-[11.5px] font-bold text-slate-900">
              <Clock size={12} className="text-teal-600" />
              <span>{routeDistanceKm} km · ~{routeDurationMins}m</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-md text-[11px] font-bold text-slate-800">
              <MapPin size={11} className="text-teal-600" />
              <span>{!pickupAddress ? "Set Pickup" : "Choose Destination"}</span>
            </div>
          )}
        </div>

        {/* Floating Right Controls: GPS Target & Live Tracking */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          {/* 1-Tap Exact GPS Button */}
          <button
            type="button"
            onClick={() => handleUseCurrentLocation(true)}
            disabled={gpsLoading}
            className="w-9 h-9 rounded-full bg-white text-teal-700 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            title="Use current location"
            aria-label="Use current location"
          >
            {gpsLoading ? <Loader2 size={16} className="animate-spin text-teal-600" /> : <Target size={17} />}
          </button>

          {/* Live Tracking toggle button */}
          <button
            type="button"
            onClick={handleToggleLiveTracking}
            className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform cursor-pointer border ${
              isLiveTracking ? "bg-sky-600 text-white border-sky-700" : "bg-white text-slate-600 border-slate-200"
            }`}
            title="Toggle Live GPS Tracking"
            aria-label="Toggle Live GPS Tracking"
          >
            <Radio size={16} className={isLiveTracking ? "animate-pulse" : ""} />
          </button>
        </div>

        {/* Map Selection Mode Banner */}
        {mapSelectionMode !== "none" && (
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-teal-900/95 text-white backdrop-blur px-3 py-2 rounded-xl shadow-lg flex items-center justify-between border border-teal-700">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-teal-300 animate-bounce" />
              <p className="text-[11.5px] font-bold">
                Tap map to place {mapSelectionMode === "pickup" ? "Pickup" : "Destination"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapSelectionMode("none")}
              className="px-2.5 py-1 rounded bg-teal-700 text-white text-[11px] font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom Booking Sheet / Controls ── */}
      <div className="px-3.5 flex flex-col gap-3">
        {/* Mode Toggle (Instant vs Schedule) */}
        <div className="flex p-1 rounded-xl bg-slate-200/80 border border-slate-300/60">
          <button
            type="button"
            onClick={() => setRideMode("instant")}
            className="flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
            style={{
              background: rideMode === "instant" ? "#ffffff" : "transparent",
              color: rideMode === "instant" ? "#0f172a" : "#64748b",
              boxShadow: rideMode === "instant" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <CarFront size={13} /> Instant Ride
          </button>
          <button
            type="button"
            onClick={() => setRideMode("schedule")}
            className="flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
            style={{
              background: rideMode === "schedule" ? "#ffffff" : "transparent",
              color: rideMode === "schedule" ? "#0f172a" : "#64748b",
              boxShadow: rideMode === "schedule" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <CalendarClock size={13} /> Schedule Ride
          </button>
        </div>

        {/* Schedule Date & Time Row if mode === schedule */}
        {rideMode === "schedule" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="flex-1 text-[12px] font-semibold px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 outline-none"
            />
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="flex-1 text-[12px] font-semibold px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 outline-none"
            />
          </div>
        )}

        {/* GPS notice if any */}
        {gpsNotice && (
          <div className="text-[11px] text-teal-800 bg-teal-100/70 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center justify-between">
            <span>{gpsNotice}</span>
            <button type="button" onClick={() => setGpsNotice(null)} className="font-bold cursor-pointer text-teal-900 ml-2">
              ✕
            </button>
          </div>
        )}

        {/* ── Location Input Section (Collapsed view when configured, expanded when editing) ── */}
        {hasTrip && isLocationsCollapsed ? (
          /* Compact Route Summary Pill */
          <div className="card p-3 flex items-center justify-between gap-2 bg-white border border-teal-200 shadow-xs">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
              <div className="flex-1 min-w-0 text-[12px]">
                <p className="font-bold text-slate-900 truncate">{pickupAddress.split(",")[0]}</p>
                <p className="font-medium text-slate-500 truncate mt-0.5">To: {dropoffAddress.split(",")[0]}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingLocations(true)}
              className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-[11px] font-bold flex items-center gap-1 shrink-0 active:bg-teal-100 cursor-pointer"
            >
              <Edit2 size={11} /> Change
            </button>
          </div>
        ) : (
          /* Expanded Location Pick & Drop Inputs */
          <div className="card p-3.5 flex flex-col gap-3 bg-white border border-teal-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Where to?</span>
              {hasTrip && (
                <button
                  type="button"
                  onClick={() => setIsEditingLocations(false)}
                  className="text-[11px] font-bold text-teal-700 cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>

            <div className="relative flex flex-col gap-3">
              <div className="absolute left-3 top-7 bottom-7 w-px bg-teal-200" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pickup Location</span>
                  <button
                    type="button"
                    onClick={() => setMapSelectionMode(mapSelectionMode === "pickup" ? "none" : "pickup")}
                    className="text-[11px] font-bold text-teal-600 flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin size={10} /> {mapSelectionMode === "pickup" ? "Pinning..." : "Pin on Map"}
                  </button>
                </div>
                <LocationSearch
                  label=""
                  placeholder="Pickup area or current location..."
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Drop-off Destination</span>
                  <button
                    type="button"
                    onClick={() => setMapSelectionMode(mapSelectionMode === "dropoff" ? "none" : "dropoff")}
                    className="text-[11px] font-bold text-teal-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Compass size={10} /> {mapSelectionMode === "dropoff" ? "Pinning..." : "Pin on Map"}
                  </button>
                </div>
                <LocationSearch
                  label=""
                  placeholder="Where do you want to go?"
                  defaultValue={dropoffAddress}
                  iconBg="#dc2626"
                  icon={<MapPin size={12} className="text-white" />}
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

            {/* Saved Places Horizontal Scroll Pills */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
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
                  className="pill-teal shrink-0 py-1 px-2.5 text-[11px] active:scale-95 transition-transform cursor-pointer"
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
        )}

        {/* ── Vehicle Selection Carousel / Stack (If locations set, show real vehicles) ── */}
        {!hasTrip ? (
          <div className="card p-5 flex flex-col items-center justify-center text-center gap-2 bg-white border border-dashed border-teal-200">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Navigation size={18} />
            </div>
            <p className="text-[13px] font-bold text-slate-800">
              {!pickupAddress && !dropoffAddress
                ? "Enter pickup & destination"
                : !pickupAddress
                ? "Set your pickup point"
                : "Choose your destination"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              View live rates for Bike, Auto, Economy & Premium Sedans once locations are set.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Choose Ride Type
              </span>
              <span className="text-[11px] text-teal-700 font-bold">
                {routeLoading ? "Calculating..." : `${routeDistanceKm} km route`}
              </span>
            </div>

            {/* Vehicle List Items */}
            <div className="flex flex-col gap-2">
              {dynamicVehicles.map((v) => {
                const isSelected = selected === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelected(v.id)}
                    className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all border cursor-pointer active:scale-99"
                    style={{
                      background: isSelected ? "#f0fdfa" : "#ffffff",
                      borderColor: isSelected ? "#0d9488" : "#e2e8f0",
                      boxShadow: isSelected ? "0 2px 10px rgba(13,148,136,0.18)" : "none",
                    }}
                  >
                    {/* Vehicle Icon Badge */}
                    <div
                      className="w-13 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        background: isSelected ? "#ccfbf1" : "#f8fafc",
                        borderColor: isSelected ? "#99f6e4" : "#e2e8f0",
                      }}
                    >
                      <VehicleIcon id={v.id} type={v.type} className="w-10 h-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13.5px] font-bold text-slate-900 leading-none">{v.name}</p>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700">
                          <Users size={9} /> {v.capacity}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">{v.desc}</p>
                    </div>

                    {/* Price & ETA */}
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-black text-slate-900 leading-none">
                        {routeLoading ? "..." : v.price}
                      </p>
                      <p className="text-[10.5px] font-bold text-teal-600 mt-1">{v.eta}</p>
                    </div>

                    {/* Active check icon */}
                    {isSelected && (
                      <div className="w-4.5 h-4.5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Ride Preferences & Wallet Strip */}
            <div className="card p-3 bg-white border border-slate-200 flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-[11.5px]">
                {/* Pet friendly checkbox */}
                <button
                  type="button"
                  onClick={() => setPetFriendly(!petFriendly)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                    petFriendly ? "bg-teal-50 border-teal-400 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span>🐶 Pet Ride (+15%)</span>
                  {petFriendly && <Check size={11} className="text-teal-700" />}
                </button>

                {/* Preferred driver checkbox */}
                <button
                  type="button"
                  onClick={() => setPrefDriver(!prefDriver)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                    prefDriver ? "bg-teal-50 border-teal-400 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <Star size={11} className={prefDriver ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                  <span>Top Pilots</span>
                  {prefDriver && <Check size={11} className="text-teal-700" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11.5px]">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Wallet size={13} className="text-teal-600" />
                  <span>Payment: Bhavo Wallet</span>
                </div>
                <span className="font-bold text-teal-700">₹{walletBalance} available</span>
              </div>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-medium">
                {bookingError}
              </div>
            )}

            {/* ── Primary Sticky CTA Button (Rapido / Uber style) ── */}
            <button
              type="button"
              onClick={handleBookRide}
              disabled={bookingLoading || routeLoading}
              className="w-full h-12 rounded-xl text-[14.5px] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-lg shadow-teal-700/30 disabled:opacity-75 disabled:cursor-not-allowed mt-1"
              style={{ background: "#0d9488" }}
            >
              {bookingLoading ? (
                <span>Dispatching Nearest Pilot...</span>
              ) : routeLoading ? (
                <span>Calculating Real-time Fare...</span>
              ) : (
                <>
                  {rideMode === "schedule"
                    ? `Schedule ${selectedVehicle.name} (${selectedVehicle.price})`
                    : `Book ${selectedVehicle.name} (${selectedVehicle.price})`}{" "}
                  <Navigation size={15} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
