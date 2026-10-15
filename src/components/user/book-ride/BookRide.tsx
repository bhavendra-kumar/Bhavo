"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Clock, CarFront, Wallet, Check,
  Star, Navigation, Home, Briefcase, CalendarClock, Heart,
  Radio, Compass
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import LocationSearch from "./LocationSearch";
import DriverChatModal from "@/components/user/rides/DriverChatModal";
import DriverCallModal from "@/components/user/rides/DriverCallModal";
import CompletedRideModal from "@/components/user/rides/CompletedRideModal";
import DesktopActiveRideCard from "./DesktopActiveRideCard";
import RecommendedDestinationsSection from "./RecommendedDestinationsSection";
import VehicleSelector from "./VehicleSelector";
import { useDialog } from "@/components/ui/DialogProvider";

import { VehicleIcon } from "./VehicleIcons";
import MobileBookRide, { type RecommendedPlace } from "../mobile/MobileBookRide";
import type { AreaMarker } from "./LeafletMap";
import { BASE_VEHICLES, type SavedPlace, type ActiveRide } from "./types";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function BookRidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, alert } = useDialog();

  const [selected, setSelected] = useState("premium");
  const [rideMode, setRideMode] = useState<"instant" | "schedule">(() =>
    searchParams.get("tab") === "schedule" ? "schedule" : "instant"
  );
  const [petFriendly, setPetFriendly] = useState(false);
  const [prefDriver, setPrefDriver] = useState(false);

  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(() => {
    const lat = searchParams.get("pickupLat");
    const lng = searchParams.get("pickupLng");
    if (!lat || !lng) return null;
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    return !isNaN(pLat) && !isNaN(pLng) && isFinite(pLat) && isFinite(pLng) ? [pLat, pLng] : null;
  });
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(() => {
    const lat = searchParams.get("dropoffLat") || searchParams.get("lat");
    const lng = searchParams.get("dropoffLng") || searchParams.get("lng");
    if (!lat || !lng) return null;
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    return !isNaN(pLat) && !isNaN(pLng) && isFinite(pLat) && isFinite(pLng) ? [pLat, pLng] : null;
  });
  const [pickupAddress, setPickupAddress] = useState(
    () => searchParams.get("pickup") || searchParams.get("pickupAddress") || searchParams.get("from") || ""
  );
  const [dropoffAddress, setDropoffAddress] = useState(
    () => searchParams.get("dropoff") || searchParams.get("dest") || searchParams.get("to") || searchParams.get("dropoffAddress") || ""
  );

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeDurationMins, setRouteDurationMins] = useState<number>(0);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);

  const hasTrip = Boolean(
    pickupCoords &&
    dropoffCoords &&
    pickupAddress.trim() &&
    dropoffAddress.trim()
  );

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState("09:00");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [completedModalRide, setCompletedModalRide] = useState<ActiveRide | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<"none" | "pickup" | "dropoff">("none");
  const [areaMarkers, setAreaMarkers] = useState<AreaMarker[]>([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendedPlace[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [desktopRecFilter, setDesktopRecFilter] = useState<string>("all");
  const watchIdRef = React.useRef<number | null>(null);
  const isFetchingAddressRef = React.useRef(false);
  const hasInitializedLocationRef = React.useRef(false);

  const handleSelectAreaPickup = (coords: [number, number], name: string) => {
    setPickupCoords(coords);
    setPickupAddress(name);
  };

  const handleSelectAreaDropoff = (coords: [number, number], name: string) => {
    setDropoffCoords(coords);
    setDropoffAddress(name);
  };

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

    navigator.geolocation.getCurrentPosition(
      (pos) => onLocationReceived(pos, true),
      (err) => console.warn("Initial location notice:", err.message),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );

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

  useEffect(() => {
    fetch("/api/user/places")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") setSavedPlaces(json.data || []);
      })
      .catch(() => { });

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
      .catch(() => { });

    fetch("/api/places?nearby=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const markers: AreaMarker[] = data.map((item) => ({
            id: item.id || `area-${item.place_id || item.short_name}`,
            name: item.short_name || item.display_name?.split(",")[0] || "Transit",
            category: item.category || "locality",
            categoryLabel: item.categoryLabel || "Transit",
            coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
            city: item.city || "NCR",
            subtext: item.subtext,
          }));
          setAreaMarkers(markers);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const centerCoords = pickupCoords || userCoords;
    if (!centerCoords) return;

    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) setRecsLoading(true);
    });

    fetch(`/api/places?nearby=true&lat=${centerCoords[0]}&lon=${centerCoords[1]}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && Array.isArray(data) && data.length > 0) {
          setRecommendedPlaces(data);
          const markers: AreaMarker[] = data.map((item) => ({
            id: item.id || `area-${item.place_id || item.short_name}`,
            name: item.short_name || item.name || item.display_name?.split(",")[0] || "Transit",
            category: item.category || "locality",
            categoryLabel: item.categoryLabel || "Transit",
            coordinates: [
              typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
              typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
            ],
            city: item.city || "",
            subtext: item.subtext,
          }));
          setAreaMarkers(markers);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (!isCancelled) setRecsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pickupCoords, userCoords]);

  useEffect(() => {
    if (pickupAddress && !pickupCoords) {
      fetch(`/api/places?q=${encodeURIComponent(pickupAddress)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data[0]) {
            const pLat = parseFloat(data[0].lat);
            const pLng = parseFloat(data[0].lon);
            if (!isNaN(pLat) && !isNaN(pLng)) {
              setPickupCoords([pLat, pLng]);
            }
          }
        })
        .catch(() => { });
    }
  }, [pickupAddress, pickupCoords]);

  useEffect(() => {
    if (dropoffAddress && !dropoffCoords) {
      fetch(`/api/places?q=${encodeURIComponent(dropoffAddress)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data[0]) {
            const dLat = parseFloat(data[0].lat);
            const dLng = parseFloat(data[0].lon);
            if (!isNaN(dLat) && !isNaN(dLng)) {
              setDropoffCoords([dLat, dLng]);
            }
          }
        })
        .catch(() => { });
    }
  }, [dropoffAddress, dropoffCoords]);

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
          petFriendly,
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

  const handleRefreshStatus = async () => {
    if (!activeRide?._id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/user/rides/${activeRide._id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.status === "COMPLETED") {
            setCompletedModalRide(json.data);
            setActiveRide(null);
          } else if (typeof json.data.status === "string" && json.data.status.startsWith("CANCELLED")) {
            setActiveRide(null);
          } else {
            setActiveRide((current) => {
              if (!current) return json.data;
              const curVer = current.trackingVersion ?? 0;
              const newVer = json.data.trackingVersion ?? 0;
              if (newVer < curVer) return current;
              return json.data;
            });
          }
        }
      }
    } catch (e) {
      console.error("[handleRefreshStatus]", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide?._id) return;
    try {
      const res = await fetch(`/api/user/rides/${activeRide._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRide(null);
      } else {
        alert({
          title: "Cancellation Failed",
          message: data.message || "Unable to cancel ride.",
          variant: "warning",
        });
      }
    } catch (e) {
      console.error("[handleCancelRide]", e);
    }
  };

  const handleAdvanceStatus = async (action: "advance_status" | "cancel") => {
    if (action === "cancel") {
      await handleCancelRide();
    } else {
      await handleRefreshStatus();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkActiveRide = async () => {
      try {
        const res = await fetch("/api/user/rides?status=active");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json.data) && json.data.length > 0) {
            const current = json.data[0];
            setActiveRide(current);
            if (current.pickup?.coordinates) {
              setPickupCoords(current.pickup.coordinates);
              setPickupAddress(current.pickup.address);
            }
            if (current.dropoff?.coordinates) {
              setDropoffCoords(current.dropoff.coordinates);
              setDropoffAddress(current.dropoff.address);
            }
          }
        }
      } catch {}
    };
    checkActiveRide();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeRide?._id) return;
    if (activeRide.status === "COMPLETED" || activeRide.status === "CANCELLED") return;

    let isMounted = true;
    let es: EventSource | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let pollDelay = 3000;

    const handleRideUpdate = (updated: ActiveRide) => {
      if (!isMounted) return;
      setActiveRide((current) => {
        if (!current) return updated;
        const curVer = current.trackingVersion ?? 0;
        const newVer = updated.trackingVersion ?? 0;
        if (newVer < curVer) {
          return current;
        }
        return updated;
      });

      if (updated.status === "COMPLETED") {
        setCompletedModalRide(updated);
        setActiveRide(null);
        cleanup();
      } else if (updated.status === "CANCELLED") {
        setActiveRide(null);
        cleanup();
      }
    };

    const cleanup = () => {
      if (es) {
        es.close();
        es = null;
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const startAdaptivePolling = () => {
      if (!isMounted || fallbackTimer) return;

      const pollStep = async () => {
        if (!isMounted) return;
        try {
          const res = await fetch(`/api/user/rides/${activeRide._id}`);
          if (res.ok) {
            const json = await res.json();
            if (isMounted && json.data) {
              handleRideUpdate(json.data);
              pollDelay = 3000;
            }
          } else if (res.status === 404 || res.status === 401 || res.status === 403) {
            cleanup();
            return;
          } else {
            pollDelay = Math.min(pollDelay * 1.5, 10000);
          }
        } catch {
          pollDelay = Math.min(pollDelay * 1.5, 10000);
        }

        if (isMounted) {
          fallbackTimer = setTimeout(pollStep, pollDelay);
        }
      };

      fallbackTimer = setTimeout(pollStep, pollDelay);
    };

    try {
      es = new EventSource(`/api/user/rides/${activeRide._id}/stream`);

      const handleSseMessage = (event: MessageEvent) => {
        try {
          const updated = JSON.parse(event.data) as ActiveRide;
          handleRideUpdate(updated);
        } catch (err) {
          console.error("[Ride SSE parse error]:", err);
        }
      };

      es.addEventListener("snapshot", handleSseMessage as EventListener);
      es.addEventListener("update", handleSseMessage as EventListener);
      es.addEventListener("terminal", handleSseMessage as EventListener);
      es.onmessage = handleSseMessage;

      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
        startAdaptivePolling();
      };
    } catch {
      startAdaptivePolling();
    }

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [activeRide?._id, activeRide?.status]);

  const driverPosition: [number, number] | null =
    activeRide?.driverCoordinates && Array.isArray(activeRide.driverCoordinates) && activeRide.driverCoordinates.length === 2
      ? activeRide.driverCoordinates
      : null;

  return (
    <div className="flex flex-col gap-4 flex-1">
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
          areaMarkers={areaMarkers}
          onSelectAreaPickup={handleSelectAreaPickup}
          onSelectAreaDropoff={handleSelectAreaDropoff}
          recommendedPlaces={recommendedPlaces}
          recsLoading={recsLoading}
        />
      </div>

      <div className="hidden lg:flex flex-col gap-4 flex-1">
        {activeRide && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <DesktopActiveRideCard
                activeRide={activeRide}
                isRefreshing={isRefreshing}
                onRefreshStatus={handleRefreshStatus}
                onCancelRide={async () => {
                  const confirmed = await confirm({
                    title: "Cancel ride?",
                    message: "Your driver is already on the way.",
                    confirmText: "Cancel ride",
                    cancelText: "Keep ride",
                    variant: "danger",
                  });
                  if (confirmed) handleCancelRide();
                }}
                onCallDriver={() => setIsCallOpen(true)}
                onChatDriver={() => setIsChatOpen(true)}
              />
            </div>

            <div className="lg:col-span-3 rounded-2xl overflow-hidden relative min-h-100 lg:h-[calc(100vh-140px)] border border-slate-200 shadow-sm">
              <LeafletMap
                pickupCoords={activeRide.pickup.coordinates}
                dropoffCoords={activeRide.dropoff.coordinates}
                driverCoords={driverPosition}
                userCoords={userCoords}
                routeCoords={routeCoords}
                vehicleType={activeRide.vehicleType}
              />

              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeRide.locationStatus === "FRESH"
                      ? "bg-teal-500 animate-pulse"
                      : activeRide.locationStatus === "STALE"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                <span className="text-[13px] font-bold text-slate-900">
                  {activeRide.locationStatus === "FRESH"
                    ? activeRide.locationAgeSeconds !== undefined && activeRide.locationAgeSeconds !== null
                      ? `Driver live GPS (${activeRide.locationAgeSeconds}s ago)`
                      : "Driver live GPS active"
                    : activeRide.locationStatus === "STALE"
                    ? `GPS delayed (${activeRide.locationAgeSeconds ?? 120}s ago)`
                    : activeRide.locationStatus === "TERMINAL"
                    ? "Trip ended"
                    : "Driver GPS unavailable"}
                </span>
              </div>
            </div>
          </div>
        )}

        {!activeRide && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col gap-4 lg:pr-2 no-scrollbar pb-2">
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
                        className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${mapSelectionMode === "pickup" ? "text-teal-700 font-black" : "text-teal-600 hover:text-teal-800"
                          }`}
                      >
                        <MapPin size={11} /> {mapSelectionMode === "pickup" ? "Pinning on Map..." : "Pin on Map"}
                      </button>
                    </div>
                    <LocationSearch
                      label=""
                      placeholder="Search pickup area or tap location..."
                      defaultValue={pickupAddress}
                      userCoords={pickupCoords || userCoords}
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
                        className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${mapSelectionMode === "dropoff" ? "text-teal-700 font-black" : "text-teal-600 hover:text-teal-800"
                          }`}
                      >
                        <Compass size={11} /> {mapSelectionMode === "dropoff" ? "Pinning on Map..." : "Pin on Map"}
                      </button>
                    </div>
                    <LocationSearch
                      label=""
                      placeholder="Where do you want to go?"
                      defaultValue={dropoffAddress}
                      userCoords={pickupCoords || userCoords}
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

                {savedPlaces.length > 0 && (
                  <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      Saved:
                    </span>
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
                )}
              </div>

              {!hasTrip ? (
                <RecommendedDestinationsSection
                  recsLoading={recsLoading}
                  recommendedPlaces={recommendedPlaces}
                  desktopRecFilter={desktopRecFilter}
                  setDesktopRecFilter={setDesktopRecFilter}
                  onSelectDestination={(address, coords) => {
                    setDropoffAddress(address);
                    setDropoffCoords(coords);
                  }}
                />
              ) : (
                <>
                  <VehicleSelector
                    dynamicVehicles={dynamicVehicles}
                    selected={selected}
                    onSelect={setSelected}
                    routeLoading={routeLoading}
                    routeDistanceKm={routeDistanceKm}
                  />

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

            <div className="lg:col-span-3 rounded-2xl overflow-hidden relative min-h-100 lg:h-[calc(100vh-130px)] lg:sticky lg:top-8 self-start bg-slate-50 border border-slate-200 shadow-sm">
              <LeafletMap
                pickupCoords={pickupCoords}
                dropoffCoords={dropoffCoords}
                userCoords={userCoords}
                routeCoords={hasTrip ? routeCoords : []}
                vehicleType={selectedVehicle.type}
                areaMarkers={areaMarkers}
                onSelectAreaPickup={handleSelectAreaPickup}
                onSelectAreaDropoff={handleSelectAreaDropoff}
                isDraggable={true}
                onPickupDrag={handlePickupDrag}
                onDropoffDrag={handleDropoffDrag}
                onMapClick={handleMapClick}
                selectionMode={mapSelectionMode}
              />

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

              {hasTrip && (
                <div className="absolute bottom-24 left-4 right-4 flex justify-center z-10 pointer-events-none">
                  <span className="bg-slate-900/80 backdrop-blur text-white text-[11px] font-medium px-3.5 py-1.5 rounded-full shadow-md">
                    📍 Drag pickup or destination pin to adjust exact doorstep
                  </span>
                </div>
              )}

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

      {activeRide && (
        <DriverChatModal
          rideId={activeRide._id}
          driverName={activeRide.driverDetails?.name || "Bhavo Pilot"}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || ""}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onCallDriver={() => {
            setIsChatOpen(false);
            setIsCallOpen(true);
          }}
        />
      )}

      {activeRide && (
        <DriverCallModal
          driverName={activeRide.driverDetails?.name || "Bhavo Pilot"}
          driverPhone={activeRide.driverDetails?.phone || ""}
          driverRating={activeRide.driverDetails?.rating || 4.9}
          vehicleModel={activeRide.driverDetails?.vehicleModel || activeRide.vehicleType}
          vehicleNumber={activeRide.driverDetails?.vehicleNumber || ""}
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
        />
      )}

      {completedModalRide && (
        <CompletedRideModal
          ride={completedModalRide}
          onClose={() => setCompletedModalRide(null)}
        />
      )}
    </div>
  );
}
