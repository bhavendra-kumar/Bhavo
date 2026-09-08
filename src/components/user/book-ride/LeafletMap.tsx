"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DefaultIconPrototype extends L.Icon.Default {
  _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as DefaultIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Modern SVG DivIcons: Pickup (Green) and Dropoff / Destination (Red)
const createPickupIcon = () =>
  L.divIcon({
    className: "custom-pickup-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 34px; height: 44px; cursor: grab;">
        <div style="position: absolute; bottom: 0; width: 20px; height: 8px; background: rgba(21, 128, 61, 0.4); border-radius: 50%; filter: blur(1.5px);"></div>
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35));">
          <path d="M17 0C7.611 0 0 7.611 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.611 26.389 0 17 0Z" fill="url(#pickup-green-grad)"/>
          <circle cx="17" cy="16" r="6.5" fill="white"/>
          <circle cx="17" cy="16" r="3.5" fill="#15803d"/>
          <defs>
            <linearGradient id="pickup-green-grad" x1="17" y1="0" x2="17" y2="42" gradientUnits="userSpaceOnUse">
              <stop stop-color="#22c55e"/>
              <stop offset="1" stop-color="#15803d"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
  });

const createDropoffIcon = () =>
  L.divIcon({
    className: "custom-dropoff-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 34px; height: 44px; cursor: grab;">
        <div style="position: absolute; bottom: 0; width: 20px; height: 8px; background: rgba(185, 28, 28, 0.4); border-radius: 50%; filter: blur(1.5px);"></div>
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35));">
          <path d="M17 0C7.611 0 0 7.611 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.611 26.389 0 17 0Z" fill="url(#dropoff-red-grad)"/>
          <circle cx="17" cy="16" r="6.5" fill="white"/>
          <circle cx="17" cy="16" r="3.5" fill="#b91c1c"/>
          <defs>
            <linearGradient id="dropoff-red-grad" x1="17" y1="0" x2="17" y2="42" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ef4444"/>
              <stop offset="1" stop-color="#b91c1c"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
  });

const createDriverIcon = (type: string = "car") => {
  const t = type.toLowerCase();
  const isBike = t.includes("bike") || t.includes("motorcycle");
  const isAuto = t.includes("auto") || t.includes("rickshaw");
  const isSuv = t.includes("suv") || t.includes("large") || t.includes("xl");
  const isParcel = t.includes("parcel") || t.includes("delivery") || t.includes("package");

  let svgContent = "";
  if (isBike) {
    svgContent = `<svg width="22" height="15" viewBox="0 0 64 40" fill="none" stroke="currentColor"><circle cx="14" cy="27" r="8" stroke="white" stroke-width="3" fill="#0f172a"/><circle cx="50" cy="27" r="8" stroke="white" stroke-width="3" fill="#0f172a"/><path d="M14 27L25 24L31 19L43 14L48 20L50 27" stroke="white" stroke-width="3"/><path d="M30 17C30 13 36 12 42 13L32 19Z" fill="#5eead4"/><path d="M50 27L44 11L41 10" stroke="white" stroke-width="3"/><circle cx="41" cy="9.5" r="2" fill="#5eead4"/></svg>`;
  } else if (isAuto) {
    svgContent = `<svg width="22" height="15" viewBox="0 0 64 40" fill="none"><circle cx="15" cy="29" r="6" stroke="white" stroke-width="2.5" fill="#0f172a"/><circle cx="49" cy="29" r="6" stroke="white" stroke-width="2.5" fill="#0f172a"/><path d="M10 26L13 18L24 18L24 28L55 28L44 18L44 26Z" fill="#5eead4"/><rect x="22" y="17" width="22" height="10" fill="#facc15"/><path d="M12 18C13 10 18 7 30 7L50 7L56 18Z" fill="#0f172a"/><path d="M26 13L26 27L38 27L38 13Z" fill="#0f172a"/></svg>`;
  } else if (isSuv) {
    svgContent = `<svg width="24" height="15" viewBox="0 0 64 40" fill="none"><circle cx="16" cy="28" r="6.5" stroke="white" stroke-width="2.5" fill="#0f172a"/><circle cx="48" cy="28" r="6.5" stroke="white" stroke-width="2.5" fill="#0f172a"/><path d="M20 7L46 7" stroke="#94a3b8" stroke-width="2"/><path d="M4 25L15 20L17 9L48 9L52 14L57 16L61 24L61 28L56 28L40 28L24 28L8 28Z" fill="#5eead4"/><path d="M20 18L20 11L28 11L28 18Z" fill="#0f172a"/><path d="M30 11L39 11L39 18L30 18Z" fill="#0f172a"/><path d="M41 11L47 11L51 17L41 18Z" fill="#0f172a"/></svg>`;
  } else if (isParcel) {
    svgContent = `<svg width="22" height="15" viewBox="0 0 64 40" fill="none"><circle cx="14" cy="28" r="6.5" stroke="white" stroke-width="2.5" fill="#0f172a"/><circle cx="48" cy="28" r="6.5" stroke="white" stroke-width="2.5" fill="#0f172a"/><path d="M14 28L25 28L30 22L40 22L46 13" stroke="white" stroke-width="3"/><rect x="11" y="10" width="14" height="12" rx="2" fill="#f59e0b"/><path d="M30 25L42 25L47 16Z" fill="#5eead4"/></svg>`;
  } else {
    // Sedan
    svgContent = `<svg width="24" height="15" viewBox="0 0 64 40" fill="none"><circle cx="16" cy="28" r="6.5" stroke="white" stroke-width="2.5" fill="#0f172a"/><circle cx="48" cy="28" r="6.5" stroke="white" stroke-width="2.5" fill="#0f172a"/><path d="M4 25L9 21L15 21L23 12L43 12L53 21L59 21L62 25L62 28L55 28L41 28L23 28L9 28Z" fill="#5eead4"/><path d="M19 19.5L24 14L34 14L34 19.5Z" fill="#0f172a"/><path d="M36 14L44 14L50 19.5L36 19.5Z" fill="#0f172a"/></svg>`;
  }

  return L.divIcon({
    className: "custom-driver-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;">
        <div style="position: absolute; width: 46px; height: 46px; background: rgba(20, 184, 166, 0.35); border-radius: 50%; animation: pulse 2s infinite;"></div>
        <div style="width: 36px; height: 36px; background: #0f172a; border: 2.5px solid #14b8a6; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(15,23,42,0.6); color: white;">
          ${svgContent}
        </div>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

const createLiveUserIcon = () =>
  L.divIcon({
    className: "custom-user-live-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
        <div style="position: absolute; width: 38px; height: 38px; background: rgba(14, 165, 233, 0.3); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 22px; height: 22px; background: rgba(14, 165, 233, 0.45); border-radius: 50%;"></div>
        <div style="width: 14px; height: 14px; background: #0284c7; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(2,132,199,0.7); z-index: 2;"></div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

function isValidCoord(coord?: [number, number] | null): coord is [number, number] {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === "number" &&
    typeof coord[1] === "number" &&
    !isNaN(coord[0]) &&
    !isNaN(coord[1]) &&
    isFinite(coord[0]) &&
    isFinite(coord[1])
  );
}

function MapUpdater({
  pickup,
  dropoff,
  driver,
  user,
  routeCoords,
}: {
  pickup: [number, number] | null;
  dropoff: [number, number] | null;
  driver?: [number, number] | null;
  user?: [number, number] | null;
  routeCoords?: [number, number][];
}) {
  const map = useMap();
  const hasCenteredInitialRef = useRef(false);
  const prevPickupRef = useRef<string>("");
  const prevDropoffRef = useRef<string>("");
  const prevRouteLenRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };

    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 350);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  useEffect(() => {
    const validPickup = isValidCoord(pickup) ? pickup : null;
    const validDropoff = isValidCoord(dropoff) ? dropoff : null;
    const validDriver = isValidCoord(driver) ? driver : null;
    const validUser = isValidCoord(user) ? user : null;
    const validRoute = routeCoords?.filter(isValidCoord);

    const pickupKey = validPickup ? `${validPickup[0].toFixed(5)},${validPickup[1].toFixed(5)}` : "";
    const dropoffKey = validDropoff ? `${validDropoff[0].toFixed(5)},${validDropoff[1].toFixed(5)}` : "";
    const routeLen = validRoute?.length || 0;

    const pickupChanged = pickupKey !== prevPickupRef.current;
    const dropoffChanged = dropoffKey !== prevDropoffRef.current;
    const routeChanged = routeLen !== prevRouteLenRef.current;

    prevPickupRef.current = pickupKey;
    prevDropoffRef.current = dropoffKey;
    prevRouteLenRef.current = routeLen;

    const executeMove = () => {
      try {
        map.invalidateSize();

        // 1. Both route points / multi-point route exists -> Fit Bounds
        if (validRoute && validRoute.length > 1 && routeChanged) {
          map.fitBounds(L.latLngBounds(validRoute), { padding: [45, 45], animate: false });
          return;
        }

        if (validPickup && validDropoff && (pickupChanged || dropoffChanged)) {
          map.fitBounds(L.latLngBounds([validPickup, validDropoff]), { padding: [55, 55], animate: false });
          return;
        }

        // 2. Pickup was set or changed -> pan to pickup
        if (validPickup && pickupChanged) {
          map.panTo(validPickup, { animate: true, duration: 0.6 });
          return;
        }

        // 3. Dropoff was set or changed -> pan to dropoff
        if (validDropoff && dropoffChanged) {
          map.panTo(validDropoff, { animate: true, duration: 0.6 });
          return;
        }

        // 4. Initial center on user location (once on startup)
        if (!hasCenteredInitialRef.current && validUser && !validPickup && !validDropoff) {
          hasCenteredInitialRef.current = true;
          map.setView(validUser, 15, { animate: false });
          return;
        }

        // 5. If driver coordinates exist during active ride
        if (validDriver && !validPickup && !validDropoff) {
          map.panTo(validDriver, { animate: true, duration: 0.6 });
        }
      } catch {
        // Safe fallback without throwing unhandled exceptions
        try {
          if (validPickup) {
            map.setView(validPickup, 15);
          } else if (validUser) {
            map.setView(validUser, 15);
          }
        } catch {}
      }
    };

    const animTimer = setTimeout(executeMove, 50);
    return () => clearTimeout(animTimer);
  }, [pickup, dropoff, driver, user, routeCoords, map]);

  return null;
}

function MapClickHandler({
  onMapClick,
  selectionMode,
}: {
  onMapClick?: (coords: [number, number]) => void;
  selectionMode?: "none" | "pickup" | "dropoff";
}) {
  useMapEvents({
    click(e) {
      if (onMapClick && selectionMode && selectionMode !== "none") {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-20 right-4 z-500 flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          map.zoomIn();
        }}
        title="Zoom In"
        className="w-10 h-10 text-slate-700 hover:text-teal-700 hover:bg-teal-50 transition-colors border-b border-slate-100 flex items-center justify-center cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          map.zoomOut();
        }}
        title="Zoom Out"
        className="w-10 h-10 text-slate-700 hover:text-teal-700 hover:bg-teal-50 transition-colors flex items-center justify-center cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

function LocateMeButton({ userCoords }: { userCoords?: [number, number] | null }) {
  const map = useMap();
  if (!isValidCoord(userCoords)) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        try {
          map.setView(userCoords, 16, { animate: true });
        } catch {
          map.setView(userCoords, 16);
        }
      }}
      title="Snap to My Live Location"
      className="absolute bottom-6 right-4 z-500 bg-white hover:bg-slate-50 text-teal-700 hover:text-teal-900 p-2.5 rounded-xl shadow-lg border border-slate-200 transition-all flex items-center justify-center cursor-pointer group"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:scale-110 transition-transform"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
      </svg>
    </button>
  );
}

export interface LeafletMapProps {
  pickupCoords?: [number, number] | null;
  dropoffCoords?: [number, number] | null;
  driverCoords?: [number, number] | null;
  userCoords?: [number, number] | null;
  routeCoords?: [number, number][];
  vehicleType?: string;
  customMarkers?: Array<{ coordinates: [number, number]; label: string; tag?: string }>;
  isDraggable?: boolean;
  onPickupDrag?: (coords: [number, number]) => void;
  onDropoffDrag?: (coords: [number, number]) => void;
  onMapClick?: (coords: [number, number]) => void;
  selectionMode?: "none" | "pickup" | "dropoff";
}

export default function LeafletMap({
  pickupCoords,
  dropoffCoords,
  driverCoords,
  userCoords,
  routeCoords,
  vehicleType = "car",
  customMarkers = [],
  isDraggable = true,
  onPickupDrag,
  onDropoffDrag,
  onMapClick,
  selectionMode = "none",
}: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapKey, setMapKey] = useState<number | string>("map");
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setMapKey(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  const defaultCenter: [number, number] = [28.6139, 77.2090];

  if (!mounted) return <div key="placeholder" className="w-full h-full bg-[#e6faf8]" />;

  // Effective route line: road coordinates if provided, else fallback line
  const effectiveRoute =
    routeCoords && routeCoords.length > 1 && routeCoords.every(isValidCoord)
      ? routeCoords
      : isValidCoord(pickupCoords) && isValidCoord(dropoffCoords)
      ? [pickupCoords, dropoffCoords]
      : null;

  const validCenter: [number, number] =
    isValidCoord(driverCoords)
      ? driverCoords
      : isValidCoord(pickupCoords)
      ? pickupCoords
      : isValidCoord(userCoords)
      ? userCoords
      : isValidCoord(dropoffCoords)
      ? dropoffCoords
      : defaultCenter;

  return (
    <div
      key="map-wrapper"
      className="w-full h-full relative z-0 touch-none"
      style={{ zIndex: 0 }}
      onWheel={(e) => {
        // Prevent map scrolling gestures from propagating to page
        e.stopPropagation();
      }}
    >
      <MapContainer
        key={mapKey}
        ref={mapRef}
        center={validCenter}
        zoom={13}
        className={`w-full h-full z-0 ${selectionMode !== "none" ? "cursor-crosshair" : ""}`}
        zoomControl={false}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Real-Time User GPS Location Beacon */}
        {isValidCoord(userCoords) && (
          <Marker position={userCoords} icon={createLiveUserIcon()} zIndexOffset={600}>
            <Popup>
              <div className="text-center">
                <strong className="text-sky-600 block font-bold">Your Live GPS Location</strong>
                <span className="text-[11px] text-slate-500">Real-time user tracking active</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup Pin - Draggable */}
        {isValidCoord(pickupCoords) && (
          <Marker
            position={pickupCoords}
            icon={createPickupIcon()}
            draggable={Boolean(isDraggable && onPickupDrag)}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const latlng = marker.getLatLng();
                onPickupDrag?.([latlng.lat, latlng.lng]);
              },
            }}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-emerald-700 block font-bold">Pickup Point</strong>
                {isDraggable && onPickupDrag ? (
                  <span className="text-[11px] text-slate-500">Drag marker to adjust exact doorstep</span>
                ) : null}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff Pin - Draggable */}
        {isValidCoord(dropoffCoords) && (
          <Marker
            position={dropoffCoords}
            icon={createDropoffIcon()}
            draggable={Boolean(isDraggable && onDropoffDrag)}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const latlng = marker.getLatLng();
                onDropoffDrag?.([latlng.lat, latlng.lng]);
              },
            }}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-red-600 block font-bold">Destination</strong>
                {isDraggable && onDropoffDrag ? (
                  <span className="text-[11px] text-slate-500">Drag marker to adjust exact entrance</span>
                ) : null}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real-Time Moving Driver Marker */}
        {isValidCoord(driverCoords) && (
          <Marker position={driverCoords} icon={createDriverIcon(vehicleType)}>
            <Popup>Your Driver is Here</Popup>
          </Marker>
        )}

        {/* Custom Place Markers */}
        {customMarkers.filter((m) => isValidCoord(m.coordinates)).map((m, idx) => (
          <Marker key={idx} position={m.coordinates} icon={createPickupIcon()}>
            <Popup>
              <strong>{m.label}</strong> ({m.tag || "Saved"})
            </Popup>
          </Marker>
        ))}

        {/* Realistic Route Line */}
        {effectiveRoute && (
          <>
            <Polyline positions={effectiveRoute} color="#0f766e" weight={7} opacity={0.4} />
            <Polyline positions={effectiveRoute} color="#0d9488" weight={5} opacity={0.9} />
          </>
        )}

        <MapUpdater
          pickup={pickupCoords || null}
          dropoff={dropoffCoords || null}
          driver={driverCoords || null}
          user={userCoords || null}
          routeCoords={routeCoords}
        />

        <MapClickHandler onMapClick={onMapClick} selectionMode={selectionMode} />
        <MapZoomControls />
        <LocateMeButton userCoords={userCoords} />
      </MapContainer>
    </div>
  );
}

