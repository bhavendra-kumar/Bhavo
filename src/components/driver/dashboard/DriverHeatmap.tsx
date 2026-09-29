"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Flame } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
} from "react-leaflet";

export default function DriverHeatmap() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [showSurge, setShowSurge] = useState(true);
  const { activeRide, surgeAreas, vehicle, driverCoordinates } = useDriverStore();

  const driverPos: [number, number] = driverCoordinates || [28.6139, 77.2090]; // Live synced telemetry

  if (!isClient) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center text-slate-400 font-semibold text-sm">
        Loading Driver Live Map & Surge Zones...
      </div>
    );
  }

  const carIcon = L.divIcon({
    className: "driver-car-marker",
    html: `
      <div style="position: relative; display: flex; items-center; justify-content: center; width: 44px; height: 44px;">
        <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(20, 184, 166, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 50%; background: #042f2e; border: 2.5px solid #2dd4bf; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  const pickupIcon = L.divIcon({
    className: "pickup-marker",
    html: `
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #15803d; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px;">
        P
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const dropoffIcon = L.divIcon({
    className: "dropoff-marker",
    html: `
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #b91c1c; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px;">
        D
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  // Calculate polyline if active ride exists
  const routePoints: [number, number][] = activeRide
    ? [driverPos, activeRide.pickup.coordinates, activeRide.dropoff.coordinates]
    : [];

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-md bg-white flex flex-col z-0 isolate"
      style={{ zIndex: 0 }}
    >
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-slate-200/80 text-xs font-bold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Driver Radar & Demand Heatmap</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => setShowSurge(!showSurge)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border transition-all ${
              showSurge
                ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
                : "bg-white/95 text-slate-700 border-slate-200"
            }`}
          >
            <Flame size={13} className={showSurge ? "animate-bounce" : "text-amber-500"} />
            <span>Surge Zones ({surgeAreas.length})</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="w-full h-88 relative z-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={driverPos}
          zoom={12}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
          style={{ width: "100%", height: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Driver Marker */}
          <Marker position={driverPos} icon={carIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong>Your Vehicle (DL-01-EV-4429)</strong>
                <p className="text-slate-500 mt-0.5">{vehicle.model}</p>
                <span className="inline-block mt-1 font-bold text-emerald-600">● GPS Signal Strong</span>
              </div>
            </Popup>
          </Marker>

          {/* Surge Hot Spots */}
          {showSurge &&
            surgeAreas.map((s) => (
              <React.Fragment key={s.id}>
                <Circle
                  center={s.coordinates}
                  radius={s.radius}
                  pathOptions={{
                    color: s.multiplier >= 1.6 ? "#ea580c" : "#eab308",
                    fillColor: s.multiplier >= 1.6 ? "#f97316" : "#facc15",
                    fillOpacity: 0.22,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-amber-700">{s.multiplier}x Surge Active</strong>
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <span className="text-[11px] text-slate-500">High commuter density area</span>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            ))}

          {/* Active Trip Markers & Polyline */}
          {activeRide && (
            <>
              <Marker position={activeRide.pickup.coordinates} icon={pickupIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="text-emerald-700">Pickup Location</strong>
                    <p>{activeRide.pickup.address}</p>
                  </div>
                </Popup>
              </Marker>

              <Marker position={activeRide.dropoff.coordinates} icon={dropoffIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="text-rose-700">Destination</strong>
                    <p>{activeRide.dropoff.address}</p>
                  </div>
                </Popup>
              </Marker>

              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: "#0d9488",
                  weight: 4,
                  dashArray: "8, 6",
                  opacity: 0.85,
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Map Bottom Legend / Ticker */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-teal-600" />
            <span>Your Car</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Surge Zone (1.3x - 1.9x)</span>
          </div>

          {activeRide && (
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Active Trip Route</span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          OpenStreetMap • Live Traffic Overlay
        </span>
      </div>
    </div>
  );
}
