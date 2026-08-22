"use client";

import { useEffect, useState, useRef } from "react";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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

function MapUpdater({ pickup, dropoff }: { pickup: [number, number] | null; dropoff: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size on mount to fix grey rendering when flex layout settles
    const timeout = setTimeout(() => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize();
        }
      } catch {
        // Ignore if map is already destroyed
      }
    }, 250);
    
    const handleResize = () => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize();
        }
      } catch {}
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup, dropoff]);
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else if (pickup) {
      map.flyTo(pickup, 14, { duration: 1.5 });
    } else if (dropoff) {
      map.flyTo(dropoff, 14, { duration: 1.5 });
    }
  }, [pickup, dropoff, map]);
  
  return null;
}

interface LeafletMapProps {
  pickupCoords?: [number, number] | null;
  dropoffCoords?: [number, number] | null;
}

export default function LeafletMap({ pickupCoords, dropoffCoords }: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapKey, setMapKey] = useState<number | string>("map");
  const mapRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      // Force a fresh map instance on mount (especially useful for Fast Refresh in dev)
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

  // Default to central Delhi view if neither is selected
  const defaultCenter: [number, number] = [28.6139, 77.2090];
  
  if (!mounted) return <div key="placeholder" className="w-full h-full bg-[#e6faf8]" />;

  return (
    <div key="map-wrapper" className="w-full h-full relative z-0" style={{ zIndex: 0 }}>
      <MapContainer key={mapKey} ref={mapRef} center={pickupCoords || dropoffCoords || defaultCenter} zoom={12} className="w-full h-full z-0" zoomControl={false} scrollWheelZoom={false} style={{ zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickupCoords && (
          <Marker position={pickupCoords}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}
        {dropoffCoords && (
          <Marker position={dropoffCoords}>
            <Popup>Drop-off Location</Popup>
          </Marker>
        )}
        {pickupCoords && dropoffCoords && (
          <Polyline positions={[pickupCoords, dropoffCoords]} color="#0d9488" weight={4} dashArray="5, 10" />
        )}
        <MapUpdater pickup={pickupCoords || null} dropoff={dropoffCoords || null} />
      </MapContainer>
    </div>
  );
}
