"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Navigation,
  CalendarClock,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  ArrowRight,
  Star,
  Dog,
  LogIn,
  Radio,
} from "lucide-react";
import { VehicleIcon } from "@/components/user/book-ride/VehicleIcons";

// Dynamic import of LeafletMap to avoid SSR issues
const LeafletMap = dynamic(
  () => import("@/components/user/book-ride/LeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-[#f0f7f5] rounded-xl flex items-center justify-center border border-[#d5e5e2]">
        <div className="flex items-center gap-2 text-[#075b55] text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initializing map...</span>
        </div>
      </div>
    ),
  }
);

interface PlaceSuggestion {
  id: string;
  place_id: number | string;
  name: string;
  short_name: string;
  display_name: string;
  area: string;
  city: string;
  glyph: string;
  lat: string | number;
  lon: string | number;
}

interface VehicleEstimate {
  id: string;
  name: string;
  capacity: number;
  fareInRupees: number;
  fareInPaise: number;
  distanceKm: number;
  durationMins: number;
}

interface ActiveRideData {
  _id: string;
  rideId?: string;
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  pickup: {
    address: string;
    coordinates: [number, number];
    landmark?: string;
  };
  dropoff: {
    address: string;
    coordinates: [number, number];
    landmark?: string;
  };
  vehicleType: string;
  fare: number;
  fareInPaise?: number;
  distance: string;
  duration: string;
  paymentMethod: string;
  paymentStatus: string;
  driverDetails?: {
    name: string | null;
    phone: string | null;
    rating: number;
    vehicleNumber: string | null;
    vehicleModel: string | null;
    avatar?: string | null;
  } | null;
  driverCoordinates?: [number, number] | null;
  otp?: string;
  trackingVersion?: number;
}

interface PersistedCommuteData {
  _id: string;
  title: string;
  pickup: { address: string; coordinates: [number, number] };
  dropoff: { address: string; coordinates: [number, number] };
  time: string;
  days: string[];
  vehicleType: string;
  isActive: boolean;
}

export default function HeroBookingExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ride" | "commute">("ride");

  // User Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Everyday Ride State
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);

  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [dropoffSuggestions, setDropoffSuggestions] = useState<PlaceSuggestion[]>([]);
  const [dropoffLoading, setDropoffLoading] = useState(false);
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Routing State
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMins, setRouteDurationMins] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Pricing State
  const [estimates, setEstimates] = useState<VehicleEstimate[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("Cab Economy");
  const [petFriendly, setPetFriendly] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Booking Execution State
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRideData | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Commute State
  const [commuteTitle, setCommuteTitle] = useState("Daily Work Commute");
  const [commuteTime, setCommuteTime] = useState("08:30 AM");
  const [commuteDays, setCommuteDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [commuteVehicle, setCommuteVehicle] = useState("Cab Premium");
  const [commutePetFriendly, setCommutePetFriendly] = useState(false);
  const [commuteLoading, setCommuteLoading] = useState(false);
  const [commuteError, setCommuteError] = useState<string | null>(null);
  const [createdCommute, setCreatedCommute] = useState<PersistedCommuteData | null>(null);

  const pickupBoxRef = useRef<HTMLDivElement>(null);
  const dropoffBoxRef = useRef<HTMLDivElement>(null);
  const pickupAddressRef = useRef(pickupAddress);

  useEffect(() => {
    pickupAddressRef.current = pickupAddress;
  }, [pickupAddress]);

  // Check user authentication & check for active ride on load
  useEffect(() => {
    let isMounted = true;
    async function checkAuthAndActiveRide() {
      try {
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (isMounted && profileData.status === "success") {
            setIsAuthenticated(true);
            setUserName(profileData.data?.name || "Rider");

            // Check if rider already has an active ride
            const activeRes = await fetch("/api/user/rides?status=active");
            if (activeRes.ok) {
              const activeData = await activeRes.json();
              if (isMounted && Array.isArray(activeData.data) && activeData.data.length > 0) {
                const currentRide = activeData.data[0];
                setActiveRide(currentRide);
                if (currentRide.pickup?.coordinates) {
                  setPickupCoords(currentRide.pickup.coordinates);
                  setPickupAddress(currentRide.pickup.address);
                }
                if (currentRide.dropoff?.coordinates) {
                  setDropoffCoords(currentRide.dropoff.coordinates);
                  setDropoffAddress(currentRide.dropoff.address);
                }
              }
            }
          }
        } else {
          if (isMounted) setIsAuthenticated(false);
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      }
    }

    checkAuthAndActiveRide();

    // Check for saved booking draft
    try {
      const savedDraft = sessionStorage.getItem("bhavo_booking_draft");
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.pickup?.coordinates) {
          setPickupAddress(draft.pickup.address);
          setPickupCoords(draft.pickup.coordinates);
          setPickupQuery(draft.pickup.address);
        }
        if (draft.dropoff?.coordinates) {
          setDropoffAddress(draft.dropoff.address);
          setDropoffCoords(draft.dropoff.coordinates);
          setDropoffQuery(draft.dropoff.address);
        }
        if (draft.vehicleType) setSelectedVehicle(draft.vehicleType);
        if (draft.petFriendly !== undefined) setPetFriendly(draft.petFriendly);
        if (draft.tab) setActiveTab(draft.tab);
        sessionStorage.removeItem("bhavo_booking_draft");
      }
    } catch { }

    return () => {
      isMounted = false;
    };
  }, []);

  // Close search dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickupBoxRef.current && !pickupBoxRef.current.contains(event.target as Node)) {
        setShowPickupDropdown(false);
      }
      if (dropoffBoxRef.current && !dropoffBoxRef.current.contains(event.target as Node)) {
        setShowDropoffDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for Pickup
  useEffect(() => {
    if (!pickupQuery || pickupQuery === pickupAddress) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPickupLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(pickupQuery)}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setPickupSuggestions(list);
            setShowPickupDropdown(list.length > 0);
          }
        }
      } catch {
        setPickupSuggestions([]);
      } finally {
        setPickupLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [pickupQuery, pickupAddress]);

  // Debounced search for Dropoff
  useEffect(() => {
    if (!dropoffQuery || dropoffQuery === dropoffAddress) {
      setDropoffSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setDropoffLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(dropoffQuery)}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setDropoffSuggestions(list);
            setShowDropoffDropdown(list.length > 0);
          }
        }
      } catch {
        setDropoffSuggestions([]);
      } finally {
        setDropoffLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [dropoffQuery, dropoffAddress]);

  // Reverse geocode coordinates to clean street/area address
  const reverseGeocodeCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`/api/places?lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const item = Array.isArray(data) ? data[0] : data;
        if (item) {
          const street = item.address?.road || item.address?.suburb || item.name || "";
          const area = item.address?.city_district || item.address?.county || item.address?.city || "";
          if (street && area && street !== area) {
            return `${street}, ${area}`;
          }
          if (item.short_name) return item.short_name;
          if (item.display_name) return item.display_name.split(",").slice(0, 3).join(", ");
        }
      }
    } catch (err) {
      console.warn("Reverse geocode fetch failed:", err);
    }
    return `Current Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  // Explicitly fetch and sync current GPS location on demand (e.g. GPS button clicked)
  const handleUseCurrentLocation = useCallback(async (syncAsPickup = true) => {
    setLocationError(null);
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocatingUser(true);

    const applyPosition = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (!isFinite(lat) || !isFinite(lng)) {
        setLocatingUser(false);
        return;
      }

      setUserCoords([lat, lng]);

      if (syncAsPickup) {
        setPickupCoords([lat, lng]);
        const addressName = await reverseGeocodeCoords(lat, lng);
        setPickupAddress(addressName);
        setPickupQuery(addressName);
        setShowPickupDropdown(false);
      }
      setLocatingUser(false);
    };

    // Try high accuracy first; if it times out/fails on desktop, fallback to standard accuracy and IP detection
    navigator.geolocation.getCurrentPosition(
      applyPosition,
      () => {
        navigator.geolocation.getCurrentPosition(
          applyPosition,
          async (err) => {
            try {
              const res = await fetch("/api/location/detect");
              if (res.ok) {
                const json = await res.json();
                if (json.data?.coordinates) {
                  const [ipLat, ipLng] = json.data.coordinates;
                  setUserCoords([ipLat, ipLng]);
                  if (syncAsPickup) {
                    setPickupCoords([ipLat, ipLng]);
                    const addr = json.data.address || (await reverseGeocodeCoords(ipLat, ipLng));
                    setPickupAddress(addr);
                    setPickupQuery(addr);
                  }
                  setLocatingUser(false);
                  return;
                }
              }
            } catch { }

            setLocatingUser(false);
            if (err.code === 1) {
              setLocationError("Location permission denied. Please allow location access in your browser, or tap on the map.");
            } else {
              setLocationError("GPS signal unavailable. You can tap on the map or type an address.");
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  }, []);

  // Continuous Real-Time Live GPS Tracking and Auto-Sync on Mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    let isMounted = true;
    let hasInitializedPickup = false;

    const onPosSuccess = async (pos: GeolocationPosition) => {
      if (!isMounted) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (!isFinite(lat) || !isFinite(lng)) return;

      setUserCoords([lat, lng]);

      // If user hasn't typed/set an address yet, auto-populate pickup location with live spot
      if (!hasInitializedPickup && !pickupAddressRef.current) {
        hasInitializedPickup = true;
        setPickupCoords([lat, lng]);
        const name = await reverseGeocodeCoords(lat, lng);
        if (isMounted) {
          setPickupAddress(name);
          setPickupQuery(name);
        }
      }
    };

    // 1. Quick initial GPS fix
    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (err) => console.warn("Live GPS auto-detection notice:", err.message),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    // 2. Real-time watchPosition streaming
    let watchId: number | null = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        onPosSuccess,
        (err) => console.warn("Live GPS watch notice:", err.message),
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
      );
    } catch (e) {
      console.warn("Could not register live watchPosition:", e);
    }

    return () => {
      isMounted = false;
      if (watchId !== null && typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Handle dragging pickup marker on the map to exact doorstep
  const handlePickupDrag = useCallback(async (coords: [number, number]) => {
    setPickupCoords(coords);
    setUserCoords(coords);
    const addr = await reverseGeocodeCoords(coords[0], coords[1]);
    setPickupAddress(addr);
    setPickupQuery(addr);
  }, []);

  // Handle dragging destination marker on the map
  const handleDropoffDrag = useCallback(async (coords: [number, number]) => {
    setDropoffCoords(coords);
    const addr = await reverseGeocodeCoords(coords[0], coords[1]);
    setDropoffAddress(addr);
    setDropoffQuery(addr);
  }, []);

  // Handle tapping/clicking directly on the map to set location
  const handleMapClick = useCallback(async (coords: [number, number]) => {
    if (!pickupCoords) {
      setPickupCoords(coords);
      setUserCoords(coords);
      const addr = await reverseGeocodeCoords(coords[0], coords[1]);
      setPickupAddress(addr);
      setPickupQuery(addr);
    } else if (!dropoffCoords) {
      setDropoffCoords(coords);
      const addr = await reverseGeocodeCoords(coords[0], coords[1]);
      setDropoffAddress(addr);
      setDropoffQuery(addr);
    } else {
      setPickupCoords(coords);
      setUserCoords(coords);
      const addr = await reverseGeocodeCoords(coords[0], coords[1]);
      setPickupAddress(addr);
      setPickupQuery(addr);
    }
  }, [pickupCoords, dropoffCoords]);

  // Calculate actual route when both coordinates are available
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setRouteCoords(null);
      setRouteDistanceKm(null);
      setRouteDurationMins(null);
      setEstimates([]);
      return;
    }

    let isSubscribed = true;
    setRouteLoading(true);
    setRouteError(null);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords[1]},${pickupCoords[0]};${dropoffCoords[1]},${dropoffCoords[0]}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Routing service returned error");
        return res.json();
      })
      .then((data) => {
        if (!isSubscribed) return;
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const distKm = parseFloat((route.distance / 1000).toFixed(1));
          const durMins = Math.max(3, Math.round(route.duration / 60));
          setRouteDistanceKm(distKm || 1.0);
          setRouteDurationMins(durMins || 5);

          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setRouteCoords(coords);
        } else {
          throw new Error("No navigable route found between coordinates");
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn("OSRM routing fallback:", err);
        // Fallback straight line coordinates
        const dLat = dropoffCoords[0] - pickupCoords[0];
        const dLng = dropoffCoords[1] - pickupCoords[1];
        const approxKm = Math.max(1.0, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 1.3 * 10) / 10);
        setRouteDistanceKm(approxKm);
        setRouteDurationMins(Math.max(5, Math.round(approxKm * 2.5)));
        setRouteCoords([pickupCoords, dropoffCoords]);
      })
      .finally(() => {
        if (isSubscribed) setRouteLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [pickupCoords, dropoffCoords]);

  // Request Server-Authoritative Fare Estimates
  const fetchEstimates = useCallback(async () => {
    if (!pickupCoords || !dropoffCoords) return;

    setPricingLoading(true);
    setPricingError(null);

    try {
      const res = await fetch("/api/rides/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupCoordinates: pickupCoords,
          dropoffCoordinates: dropoffCoords,
          petFriendly,
          claimedDistanceKm: routeDistanceKm,
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        setEstimates(json.data.estimates || []);
      } else {
        setPricingError(json.message || "Could not retrieve fare estimate.");
      }
    } catch {
      setPricingError("Network error while calculating fare.");
    } finally {
      setPricingLoading(false);
    }
  }, [pickupCoords, dropoffCoords, petFriendly, routeDistanceKm]);

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      fetchEstimates();
    }
  }, [pickupCoords, dropoffCoords, petFriendly, routeDistanceKm, fetchEstimates]);

  // Real-Time Ride Tracking Subscription (SSE + Adaptive Polling Fallback)
  useEffect(() => {
    if (!activeRide?._id) return;
    if (activeRide.status === "COMPLETED" || activeRide.status === "CANCELLED") return;

    let isMounted = true;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let pollInterval = 3000;

    const handleRideUpdate = (updated: ActiveRideData) => {
      if (!isMounted) return;
      setActiveRide((current) => {
        if (!current) return updated;
        const currentVersion = current.trackingVersion ?? 0;
        const incomingVersion = updated.trackingVersion ?? 0;
        if (incomingVersion < currentVersion) return current;
        return updated;
      });

      if (updated.status === "COMPLETED" || updated.status === "CANCELLED") {
        cleanup();
      }
    };

    const cleanup = () => {
      if (es) {
        es.close();
        es = null;
      }
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
      if (isMounted) setSseConnected(false);
    };

    const startPollingFallback = () => {
      if (!isMounted || pollTimer) return;

      const poll = async () => {
        if (!isMounted) return;
        try {
          const res = await fetch(`/api/user/rides/${activeRide._id}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.data) {
              handleRideUpdate(data.data);
              pollInterval = 3000;
            }
          } else if (res.status === 404 || res.status === 401) {
            cleanup();
            return;
          } else {
            pollInterval = Math.min(pollInterval * 1.5, 10000);
          }
        } catch {
          pollInterval = Math.min(pollInterval * 1.5, 10000);
        }

        if (isMounted) {
          pollTimer = setTimeout(poll, pollInterval);
        }
      };

      pollTimer = setTimeout(poll, pollInterval);
    };

    try {
      es = new EventSource(`/api/user/rides/${activeRide._id}/stream`);

      es.onopen = () => {
        if (isMounted) setSseConnected(true);
      };

      const onMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          handleRideUpdate(data);
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      };

      es.addEventListener("snapshot", onMessage as EventListener);
      es.addEventListener("update", onMessage as EventListener);
      es.addEventListener("terminal", onMessage as EventListener);

      es.onerror = () => {
        if (isMounted) setSseConnected(false);
        if (es) {
          es.close();
          es = null;
        }
        startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [activeRide?._id, activeRide?.status]);

  // Handle Book Everyday Ride Submission (Prompts login or books directly into user dashboard)
  const handleBookRide = async () => {
    setBookingError(null);

    if (!pickupCoords || !pickupAddress) {
      setBookingError("Please select a verified pickup location.");
      return;
    }
    if (!dropoffCoords || !dropoffAddress) {
      setBookingError("Please select a verified destination.");
      return;
    }

    const pendingRide = {
      pickup: {
        address: pickupAddress,
        coordinates: pickupCoords,
      },
      dropoff: {
        address: dropoffAddress,
        coordinates: dropoffCoords,
      },
      vehicleType: currentEst?.name || selectedVehicle,
      fare: currentEst?.fareInRupees || 250,
      distance: `${routeDistanceKm || 8.5} km`,
      duration: `${routeDurationMins || 20} mins`,
      petFriendly,
    };

    // Save pending ride booking intent to BOTH sessionStorage and localStorage
    try {
      sessionStorage.setItem("bhavo_pending_ride_booking", JSON.stringify(pendingRide));
      localStorage.setItem("bhavo_pending_ride_booking", JSON.stringify(pendingRide));
      sessionStorage.setItem(
        "bhavo_booking_draft",
        JSON.stringify({
          tab: "ride",
          ...pendingRide,
        })
      );
    } catch { }

    // If not authenticated, prompt user to log in
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // If authenticated, directly book the ride and navigate to user dashboard
    setBookingLoading(true);
    try {
      const res = await fetch("/api/user/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: pendingRide.pickup,
          dropoff: pendingRide.dropoff,
          vehicleType: pendingRide.vehicleType,
          fare: pendingRide.fare,
          distance: pendingRide.distance,
          duration: pendingRide.duration,
          scheduledFor: null,
          petFriendly: pendingRide.petFriendly,
        }),
      });

      if (res.ok) {
        try {
          sessionStorage.removeItem("bhavo_pending_ride_booking");
          localStorage.removeItem("bhavo_pending_ride_booking");
        } catch { }
        router.push("/user/dashboard");
      } else {
        const data = await res.json();
        setBookingError(data.message || "Failed to book ride.");
        setBookingLoading(false);
      }
    } catch {
      setBookingError("Network error. Please try again.");
      setBookingLoading(false);
    }
  };

  // Handle Ride Cancellation
  const handleCancelRide = async () => {
    if (!activeRide?._id) return;
    try {
      const res = await fetch(`/api/user/rides/${activeRide._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setActiveRide(null);
      } else {
        const json = await res.json();
        alert(json.message || "Could not cancel ride.");
      }
    } catch {
      alert("Network error while cancelling ride.");
    }
  };

  // Handle Commute Schedule Submission
  const handleScheduleCommute = async () => {
    setCommuteError(null);

    if (!commuteTitle.trim()) {
      setCommuteError("Please provide a title for your commute schedule.");
      return;
    }
    if (!pickupCoords || !pickupAddress) {
      setCommuteError("Please select a verified pickup location.");
      return;
    }
    if (!dropoffCoords || !dropoffAddress) {
      setCommuteError("Please select a verified destination.");
      return;
    }
    if (commuteDays.length === 0) {
      setCommuteError("Please select at least one active weekday.");
      return;
    }

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(
          "bhavo_booking_draft",
          JSON.stringify({
            tab: "commute",
            pickup: { address: pickupAddress, coordinates: pickupCoords },
            dropoff: { address: dropoffAddress, coordinates: dropoffCoords },
            vehicleType: commuteVehicle,
            petFriendly: commutePetFriendly,
          })
        );
      } catch { }

      setShowAuthModal(true);
      return;
    }

    setCommuteLoading(true);

    try {
      const res = await fetch("/api/user/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: commuteTitle.trim(),
          pickup: {
            address: pickupAddress,
            coordinates: pickupCoords,
          },
          dropoff: {
            address: dropoffAddress,
            coordinates: dropoffCoords,
          },
          time: commuteTime,
          days: commuteDays,
          vehicleType: commuteVehicle,
          paymentMethod: "CASH",
          petFriendly: commutePetFriendly,
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        setCreatedCommute(json.data);
      } else {
        setCommuteError(json.message || "Failed to schedule commute.");
      }
    } catch {
      setCommuteError("Network error while creating recurring schedule.");
    } finally {
      setCommuteLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setCommuteDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const currentEst = estimates.find(
    (e) => e.name.toLowerCase() === selectedVehicle.toLowerCase()
  ) || estimates[0];

  const commuteEst = estimates.find(
    (e) => e.name.toLowerCase() === commuteVehicle.toLowerCase() ||
      (commuteVehicle === "Cab Large" && (e.name === "Cab Large" || e.name === "Cab XL"))
  ) || currentEst;

  return (
    <div className="hero-booking-card-wrapper" id="hero-booking-experience">
      <div className="hero-booking-card">
        {/* Card Header & Mode Switcher */}
        <div className="card-top-header">
          <div className="tabs-container" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ride"}
              className={`booking-tab ${activeTab === "ride" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("ride");
                setBookingError(null);
              }}
            >
              <Navigation className="tab-icon" size={14} />
              <span>Everyday Ride</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "commute"}
              className={`booking-tab ${activeTab === "commute" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("commute");
                setCommuteError(null);
              }}
            >
              <CalendarClock className="tab-icon" size={14} />
              <span>Daily Commute</span>
            </button>
          </div>

          {/* Dispatch Telemetry Chip (Replacing AI-cliché pill) */}
          <div className="header-status-badge">
            {activeRide ? (
              <div className="dispatch-telemetry-chip active">
                <Navigation size={12} className="telemetry-icon animate-pulse" />
                <span className="telemetry-text">Trip Active</span>
              </div>
            ) : routeLoading || pricingLoading ? (
              <div className="dispatch-telemetry-chip calculating">
                <Loader2 size={12} className="telemetry-icon animate-spin" />
                <span className="telemetry-text">Updating Route</span>
              </div>
            ) : activeTab === "ride" ? (
              <div className="dispatch-telemetry-chip">
                <Radio size={12} className="telemetry-icon" />
                <span className="telemetry-text">
                  {userName ? `Hi, ${userName.split(" ")[0]}` : "Live Dispatch"}
                </span>
              </div>
            ) : (
              <div className="dispatch-telemetry-chip">
                <CalendarClock size={12} className="telemetry-icon" />
                <span className="telemetry-text">
                  {userName ? `Hi, ${userName.split(" ")[0]}` : "Auto-Scheduler"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE RIDE LIVE TRACKER VIEW */}
        {activeRide ? (
          <div className="active-ride-tracker">
            <div className="ride-status-header">
              <div className="status-title-row">
                <div className="status-pill-large">
                  {activeRide.status === "SEARCHING" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#075b55]" />
                      <span>Matching Verified Drivers...</span>
                    </>
                  )}
                  {activeRide.status === "ACCEPTED" && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Driver Assigned & Approaching</span>
                    </>
                  )}
                  {activeRide.status === "ARRIVED" && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Driver at Pickup Spot</span>
                    </>
                  )}
                  {activeRide.status === "IN_PROGRESS" && (
                    <>
                      <Navigation className="w-4 h-4 text-[#075b55]" />
                      <span>Trip in Progress</span>
                    </>
                  )}
                  {activeRide.status === "COMPLETED" && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ride Completed</span>
                    </>
                  )}
                  {activeRide.status === "CANCELLED" && (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Ride Cancelled</span>
                    </>
                  )}
                </div>

                <div className="sse-indicator">
                  <span className={`sse-dot ${sseConnected ? "live" : "fallback"}`} />
                  <span className="sse-text">{sseConnected ? "Real-time SSE" : "Live Sync"}</span>
                </div>
              </div>

              {/* Start OTP (Exposed only when status is ACCEPTED or ARRIVED) */}
              {activeRide.otp && ["ACCEPTED", "ARRIVED"].includes(activeRide.status) && (
                <div className="otp-security-box">
                  <div className="otp-label">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>START OTP</span>
                  </div>
                  <div className="otp-number">{activeRide.otp}</div>
                  <div className="otp-hint">Share with driver to start your ride</div>
                </div>
              )}
            </div>

            {/* Embedded Live Map */}
            <div className="tracker-map-container">
              <LeafletMap
                pickupCoords={activeRide.pickup?.coordinates || null}
                dropoffCoords={activeRide.dropoff?.coordinates || null}
                driverCoords={activeRide.driverCoordinates || undefined}
                routeCoords={routeCoords || undefined}
                vehicleType={activeRide.vehicleType}
                isDraggable={false}
              />
            </div>

            {/* Driver Details if Assigned */}
            {activeRide.driverDetails && activeRide.driverDetails.name && (
              <div className="driver-info-card">
                <div className="driver-avatar-circle">
                  {activeRide.driverDetails.name.charAt(0)}
                </div>
                <div className="driver-text-details">
                  <div className="driver-name">{activeRide.driverDetails.name}</div>
                  <div className="driver-vehicle-specs">
                    <span>{activeRide.driverDetails.vehicleModel || activeRide.vehicleType}</span>
                    <span className="bullet">•</span>
                    <span className="plate-badge">{activeRide.driverDetails.vehicleNumber || "Verified"}</span>
                  </div>
                </div>
                <div className="driver-rating-badge">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{activeRide.driverDetails.rating?.toFixed(1) || "4.9"}</span>
                </div>
              </div>
            )}

            {/* Ride Trip Specs */}
            <div className="ride-summary-specs">
              <div className="summary-point">
                <div className="summary-icon pickup" />
                <div className="summary-text">
                  <span className="spec-label">PICKUP</span>
                  <span className="spec-val" title={activeRide.pickup?.address}>
                    {activeRide.pickup?.address || "Pickup Spot"}
                  </span>
                </div>
              </div>
              <div className="summary-point">
                <div className="summary-icon destination" />
                <div className="summary-text">
                  <span className="spec-label">DESTINATION</span>
                  <span className="spec-val" title={activeRide.dropoff?.address}>
                    {activeRide.dropoff?.address || "Destination Spot"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Metrics & Actions */}
            <div className="tracker-footer">
              <div className="fare-badge">
                <span className="fare-label">Authoritative Fare</span>
                <span className="fare-amount">₹{activeRide.fare}</span>
                <span className="payment-note">Cash on arrival</span>
              </div>

              {["SEARCHING", "ACCEPTED", "ARRIVED"].includes(activeRide.status) ? (
                <button
                  type="button"
                  className="cancel-ride-btn"
                  onClick={handleCancelRide}
                >
                  Cancel Ride
                </button>
              ) : (
                <button
                  type="button"
                  className="reset-ride-btn"
                  onClick={() => setActiveRide(null)}
                >
                  Book Another Ride
                </button>
              )}
            </div>
          </div>
        ) : activeTab === "ride" ? (
          /* EVERYDAY RIDE BOOKING FORM */
          <div className="ride-booking-form">
            {/* Location Inputs Group */}
            <div className="location-inputs-group">
              {/* Pickup Input */}
              <div className="location-field" ref={pickupBoxRef}>
                <div className="field-icon pickup">
                  <div className="inner-dot" />
                </div>
                <div className="field-body">
                  <label htmlFor="pickup-input" className="field-label">PICKUP LOCATION</label>
                  <input
                    id="pickup-input"
                    type="text"
                    value={pickupQuery}
                    placeholder="Enter pickup address or landmark"
                    className="location-text-input"
                    onChange={(e) => {
                      setPickupQuery(e.target.value);
                      if (!e.target.value) {
                        setPickupAddress("");
                        setPickupCoords(null);
                      }
                    }}
                    onFocus={() => {
                      if (pickupSuggestions.length > 0) setShowPickupDropdown(true);
                    }}
                  />
                </div>

                <div className="field-actions">
                  {pickupLoading && <Loader2 className="w-4 h-4 animate-spin text-[#075b55]" />}
                  {pickupAddress ? (
                    <button
                      type="button"
                      aria-label="Clear pickup address"
                      className="icon-action-btn"
                      onClick={() => {
                        setPickupAddress("");
                        setPickupCoords(null);
                        setPickupQuery("");
                      }}
                    >
                      <X size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label="Use Current GPS Location"
                      title="Use device GPS location"
                      className={`gps-locate-btn ${locatingUser ? "loading" : ""}`}
                      onClick={() => handleUseCurrentLocation(true)}
                      disabled={locatingUser}
                    >
                      {locatingUser ? (
                        <Loader2 size={15} className="animate-spin text-[#075b55]" />
                      ) : (
                        <Compass size={15} />
                      )}
                      <span className="gps-btn-text">GPS</span>
                    </button>
                  )}
                </div>

                {/* Pickup Suggestions Dropdown */}
                {showPickupDropdown && pickupSuggestions.length > 0 && (
                  <div className="places-dropdown" role="listbox">
                    {pickupSuggestions.map((item) => (
                      <div
                        key={item.id || item.place_id}
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                        className="place-option"
                        onClick={() => {
                          const name = item.short_name || item.name || item.display_name.split(",")[0];
                          setPickupAddress(name);
                          setPickupQuery(name);
                          setPickupCoords([
                            typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
                            typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
                          ]);
                          setShowPickupDropdown(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            const name = item.short_name || item.name || item.display_name.split(",")[0];
                            setPickupAddress(name);
                            setPickupQuery(name);
                            setPickupCoords([
                              typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
                              typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
                            ]);
                            setShowPickupDropdown(false);
                          }
                        }}
                      >
                        <span className="place-glyph">{item.glyph || "📍"}</span>
                        <div className="place-texts">
                          <span className="place-title">{item.short_name || item.name}</span>
                          <span className="place-subtitle">{item.city || item.area || item.display_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connecting Road Line Track */}
              <div className="route-divider-track">
                <div className="divider-road-line" />
                {routeDistanceKm && (
                  <span className="distance-badge">
                    {routeDistanceKm} km • ~{routeDurationMins} min
                  </span>
                )}
              </div>

              {/* Destination Input */}
              <div className="location-field" ref={dropoffBoxRef}>
                <div className="field-icon destination">
                  <MapPin size={16} />
                </div>
                <div className="field-body">
                  <label htmlFor="destination-input" className="field-label">DESTINATION</label>
                  <input
                    id="destination-input"
                    type="text"
                    value={dropoffQuery}
                    placeholder="Enter city center, office, or destination"
                    className="location-text-input"
                    onChange={(e) => {
                      setDropoffQuery(e.target.value);
                      if (!e.target.value) {
                        setDropoffAddress("");
                        setDropoffCoords(null);
                      }
                    }}
                    onFocus={() => {
                      if (dropoffSuggestions.length > 0) setShowDropoffDropdown(true);
                    }}
                  />
                </div>

                <div className="field-actions">
                  {dropoffLoading && <Loader2 className="w-4 h-4 animate-spin text-[#075b55]" />}
                  {dropoffAddress && (
                    <button
                      type="button"
                      aria-label="Clear destination address"
                      className="icon-action-btn"
                      onClick={() => {
                        setDropoffAddress("");
                        setDropoffCoords(null);
                        setDropoffQuery("");
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Dropoff Suggestions Dropdown */}
                {showDropoffDropdown && dropoffSuggestions.length > 0 && (
                  <div className="places-dropdown" role="listbox">
                    {dropoffSuggestions.map((item) => (
                      <div
                        key={item.id || item.place_id}
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                        className="place-option"
                        onClick={() => {
                          const name = item.short_name || item.name || item.display_name.split(",")[0];
                          setDropoffAddress(name);
                          setDropoffQuery(name);
                          setDropoffCoords([
                            typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
                            typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
                          ]);
                          setShowDropoffDropdown(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            const name = item.short_name || item.name || item.display_name.split(",")[0];
                            setDropoffAddress(name);
                            setDropoffQuery(name);
                            setDropoffCoords([
                              typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
                              typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
                            ]);
                            setShowDropoffDropdown(false);
                          }
                        }}
                      >
                        <span className="place-glyph">{item.glyph || "📍"}</span>
                        <div className="place-texts">
                          <span className="place-title">{item.short_name || item.name}</span>
                          <span className="place-subtitle">{item.city || item.area || item.display_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error notifications */}
            {locationError && (
              <div className="form-alert-msg warning" role="alert">
                <AlertCircle size={14} />
                <span>{locationError}</span>
              </div>
            )}
            {routeError && (
              <div className="form-alert-msg warning" role="alert">
                <AlertCircle size={14} />
                <span>{routeError}</span>
              </div>
            )}
            {pricingError && (
              <div className="form-alert-msg error" role="alert">
                <AlertCircle size={14} />
                <span>{pricingError}</span>
              </div>
            )}
            {bookingError && (
              <div className="form-alert-msg error" role="alert">
                <AlertCircle size={14} />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Live Map with Interactive Pin Placement & Doorstep Dragging */}
            <div className="route-map-preview">
              <LeafletMap
                pickupCoords={pickupCoords}
                dropoffCoords={dropoffCoords}
                userCoords={userCoords || pickupCoords || [28.6139, 77.2090]}
                routeCoords={routeCoords || undefined}
                vehicleType={selectedVehicle}
                isDraggable={true}
                onPickupDrag={handlePickupDrag}
                onDropoffDrag={handleDropoffDrag}
                onMapClick={handleMapClick}
              />
            </div>

            {/* Vehicle Category & Authoritative Fare Selection */}
            {pickupCoords && dropoffCoords && (
              <div className="vehicle-selection-area">
                <div className="section-sub-header">
                  <span className="sub-header-title">Select Vehicle Category</span>
                  {pricingLoading ? (
                    <span className="pricing-spin">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Calculating fare...</span>
                    </span>
                  ) : (
                    <span className="fare-badge-truth">Server Calculated • Cash</span>
                  )}
                </div>

                <div className="vehicle-pills-grid" role="radiogroup" aria-label="Vehicle Categories">
                  {estimates.length > 0 ? (
                    estimates.map((est) => {
                      const isSel = selectedVehicle.toLowerCase() === est.name.toLowerCase();
                      return (
                        <button
                          key={est.id}
                          type="button"
                          role="radio"
                          aria-checked={isSel}
                          className={`vehicle-card-pill ${isSel ? "selected" : ""}`}
                          onClick={() => setSelectedVehicle(est.name)}
                        >
                          <div className="veh-card-header">
                            <div className="veh-icon-col">
                              <VehicleIcon id={est.id} className="w-12 h-7" />
                            </div>
                            <div className="veh-fare-col">
                              <span className="veh-fare-num">₹{est.fareInRupees.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                          <div className="veh-details-col">
                            <span className="veh-name">{est.name === "Cab Large" ? "Cab XL" : est.name}</span>
                            <span className="veh-capacity">{est.capacity} {est.capacity === 1 ? "person" : "persons"}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="empty-estimates-hint">
                      <span>Computing authoritative rates for chosen route...</span>
                    </div>
                  )}
                </div>

                {/* Pet Friendly Toggle */}
                <div className="pet-toggle-row">
                  <label className="pet-toggle-label">
                    <input
                      type="checkbox"
                      checked={petFriendly}
                      onChange={(e) => setPetFriendly(e.target.checked)}
                      className="pet-checkbox"
                    />
                    <Dog className="w-4 h-4 text-[#075b55]" />
                    <span className="pet-text">Traveling with pets (15% compliant driver surcharge)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Trip Specs Summary Footprint */}
            <div className="route-footer-specs">
              <div className="spec-item">
                <span className="spec-k">Booking Flow</span>
                <span className="spec-v">Instant Dispatch</span>
              </div>
              <div className="spec-item">
                <span className="spec-k">Fares</span>
                <span className="spec-v">
                  {currentEst ? `₹${currentEst.fareInRupees} Upfront` : "Calculated Upfront"}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-k">Payment</span>
                <span className="spec-v">Cash on Arrival</span>
              </div>
            </div>

            {/* Login Required Notice for guest users when route is selected */}
            {!isAuthenticated && pickupCoords && dropoffCoords && (
              <div className="login-required-notice">
                <ShieldCheck size={15} className="notice-icon" />
                <span className="notice-text">
                  Sign in required to book and dispatch a driver.
                </span>
                <Link
                  href={`/login?role=rider&redirect=${encodeURIComponent("/user/dashboard?action=auto-book")}`}
                  className="notice-link"
                >
                  Log In →
                </Link>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              className="route-card-action"
              onClick={handleBookRide}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Booking ride in Dashboard...</span>
                </>
              ) : !pickupCoords || !dropoffCoords ? (
                <>
                  <span>Book a Ride</span>
                  <ArrowRight size={16} />
                </>
              ) : !isAuthenticated ? (
                <>
                  <LogIn size={16} />
                  <span>
                    Log in to Book Ride • ₹{currentEst ? currentEst.fareInRupees : "--"}
                  </span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>
                    Book Ride Now • ₹{currentEst ? currentEst.fareInRupees : "--"}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* DAILY COMMUTE RECURRING SCHEDULE FORM */
          <div className="commute-booking-form">
            {createdCommute ? (
              <div className="commute-success-card">
                <div className="success-icon-badge">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h4 className="success-heading">Commute Schedule Active!</h4>
                <p className="success-sub">
                  Your recurring commute has been safely registered. BHAVO will automatically materialize and dispatch rides during the lead time window.
                </p>

                <div className="commute-details-box">
                  <div className="commute-spec-row">
                    <span className="label">Schedule Title:</span>
                    <span className="val">{createdCommute.title}</span>
                  </div>
                  <div className="commute-spec-row">
                    <span className="label">Pickup Time:</span>
                    <span className="val">{createdCommute.time}</span>
                  </div>
                  <div className="commute-spec-row">
                    <span className="label">Active Days:</span>
                    <span className="val">{createdCommute.days.join(", ")}</span>
                  </div>
                  <div className="commute-spec-row">
                    <span className="label">Vehicle Category:</span>
                    <span className="val">{createdCommute.vehicleType}</span>
                  </div>
                </div>

                <div className="success-actions-row">
                  <Link href="/user/my-commute" className="view-commutes-btn">
                    <span>Manage in My Commutes</span>
                    <ArrowRight size={15} />
                  </Link>
                  <button
                    type="button"
                    className="another-commute-btn"
                    onClick={() => setCreatedCommute(null)}
                  >
                    Set Another Schedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="commute-form-content">
                {/* Schedule Title */}
                <div className="commute-field">
                  <label htmlFor="commute-title-input" className="commute-label">SCHEDULE TITLE</label>
                  <input
                    id="commute-title-input"
                    type="text"
                    value={commuteTitle}
                    onChange={(e) => setCommuteTitle(e.target.value)}
                    placeholder="e.g. Work Office Commute"
                    className="commute-text-input"
                  />
                </div>

                {/* Location Inputs Group */}
                <div className="location-inputs-group">
                  {/* Commute Pickup */}
                  <div className="location-field" ref={pickupBoxRef}>
                    <div className="field-icon pickup">
                      <div className="inner-dot" />
                    </div>
                    <div className="field-body">
                      <label htmlFor="commute-pickup-input" className="field-label">PICKUP LOCATION</label>
                      <input
                        id="commute-pickup-input"
                        type="text"
                        value={pickupQuery}
                        placeholder="e.g. Residence, Noida Sector 62"
                        className="location-text-input"
                        onChange={(e) => {
                          setPickupQuery(e.target.value);
                          if (!e.target.value) {
                            setPickupAddress("");
                            setPickupCoords(null);
                          }
                        }}
                        onFocus={() => {
                          if (pickupSuggestions.length > 0) setShowPickupDropdown(true);
                        }}
                      />
                    </div>
                    <div className="field-actions">
                      {pickupLoading && <Loader2 className="w-4 h-4 animate-spin text-[#075b55]" />}
                      {pickupAddress ? (
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => {
                            setPickupAddress("");
                            setPickupCoords(null);
                            setPickupQuery("");
                          }}
                        >
                          <X size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="gps-locate-btn"
                          onClick={() => handleUseCurrentLocation(true)}
                          disabled={locatingUser}
                        >
                          <Compass size={15} />
                          <span className="gps-btn-text">GPS</span>
                        </button>
                      )}
                    </div>

                    {showPickupDropdown && pickupSuggestions.length > 0 && (
                      <div className="places-dropdown" role="listbox">
                        {pickupSuggestions.map((item) => (
                          <div
                            key={item.id || item.place_id}
                            className="place-option"
                            onClick={() => {
                              const name = item.short_name || item.name || item.display_name.split(",")[0];
                              setPickupAddress(name);
                              setPickupQuery(name);
                              setPickupCoords([
                                typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
                                typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
                              ]);
                              setShowPickupDropdown(false);
                            }}
                          >
                            <span className="place-glyph">{item.glyph || "📍"}</span>
                            <div className="place-texts">
                              <span className="place-title">{item.short_name || item.name}</span>
                              <span className="place-subtitle">{item.city || item.area || item.display_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="route-divider-track">
                    <div className="divider-road-line" />
                  </div>

                  {/* Commute Dropoff */}
                  <div className="location-field" ref={dropoffBoxRef}>
                    <div className="field-icon destination">
                      <MapPin size={16} />
                    </div>
                    <div className="field-body">
                      <label htmlFor="commute-dropoff-input" className="field-label">DESTINATION</label>
                      <input
                        id="commute-dropoff-input"
                        type="text"
                        value={dropoffQuery}
                        placeholder="e.g. Cyber City, Tech Park"
                        className="location-text-input"
                        onChange={(e) => {
                          setDropoffQuery(e.target.value);
                          if (!e.target.value) {
                            setDropoffAddress("");
                            setDropoffCoords(null);
                          }
                        }}
                        onFocus={() => {
                          if (dropoffSuggestions.length > 0) setShowDropoffDropdown(true);
                        }}
                      />
                    </div>
                    <div className="field-actions">
                      {dropoffLoading && <Loader2 className="w-4 h-4 animate-spin text-[#075b55]" />}
                      {dropoffAddress && (
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => {
                            setDropoffAddress("");
                            setDropoffCoords(null);
                            setDropoffQuery("");
                          }}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {showDropoffDropdown && dropoffSuggestions.length > 0 && (
                      <div className="places-dropdown" role="listbox">
                        {dropoffSuggestions.map((item) => (
                          <div
                            key={item.id || item.place_id}
                            className="place-option"
                            onClick={() => {
                              const name = item.short_name || item.name || item.display_name.split(",")[0];
                              setDropoffAddress(name);
                              setDropoffQuery(name);
                              setDropoffCoords([
                                typeof item.lat === "number" ? item.lat : parseFloat(item.lat),
                                typeof item.lon === "number" ? item.lon : parseFloat(item.lon),
                              ]);
                              setShowDropoffDropdown(false);
                            }}
                          >
                            <span className="place-glyph">{item.glyph || "📍"}</span>
                            <div className="place-texts">
                              <span className="place-title">{item.short_name || item.name}</span>
                              <span className="place-subtitle">{item.city || item.area || item.display_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pickup Time & Weekdays */}
                <div className="commute-row-schedule">
                  <div className="time-col">
                    <label htmlFor="commute-pickup-time" className="commute-label">PICKUP TIME</label>
                    <input
                      id="commute-pickup-time"
                      type="text"
                      value={commuteTime}
                      onChange={(e) => setCommuteTime(e.target.value)}
                      placeholder="08:30 AM"
                      className="time-text-input"
                    />
                  </div>

                  <div className="days-col">
                    <label className="commute-label">ACTIVE DAYS</label>
                    <div className="days-picker-pills">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
                        const sel = commuteDays.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            className={`day-pill ${sel ? "selected" : ""}`}
                            onClick={() => toggleDay(d)}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Commute Vehicle Category */}
                <div className="commute-field">
                  <label htmlFor="commute-vehicle-select" className="commute-label">PREFERRED VEHICLE</label>
                  <select
                    id="commute-vehicle-select"
                    value={commuteVehicle}
                    onChange={(e) => setCommuteVehicle(e.target.value)}
                    className="commute-select-input"
                  >
                    <option value="Bike">Bike (1 person • Economical solo)</option>
                    <option value="Auto">Auto (3 persons • City transit)</option>
                    <option value="Cab Economy">Cab Economy (4 persons • Hatchback)</option>
                    <option value="Cab Premium">Cab Premium (4 persons • Sedan)</option>
                    <option value="Cab Large">Cab XL (6 persons • SUV / XL)</option>
                  </select>
                </div>

                {/* Pet Friendly Toggle */}
                <div className="pet-toggle-row">
                  <label className="pet-toggle-label">
                    <input
                      type="checkbox"
                      checked={commutePetFriendly}
                      onChange={(e) => setCommutePetFriendly(e.target.checked)}
                      className="pet-checkbox"
                    />
                    <Dog className="w-4 h-4 text-[#075b55]" />
                    <span className="pet-text">Pet-friendly commute rides</span>
                  </label>
                </div>

                {commuteError && (
                  <div className="form-alert-msg error" role="alert">
                    <AlertCircle size={14} />
                    <span>{commuteError}</span>
                  </div>
                )}

                {/* Commute Summary Specs */}
                <div className="route-footer-specs">
                  <div className="spec-item">
                    <span className="spec-k">Schedule Flow</span>
                    <span className="spec-v">Automated Recurring</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-k">Estimated Fare</span>
                    <span className="spec-v">
                      {commuteEst ? `₹${commuteEst.fareInRupees} / trip` : "Calculated Upfront"}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-k">Safety</span>
                    <span className="spec-v">4-Digit Start OTP</span>
                  </div>
                </div>

                {/* Submit Commute Button */}
                <button
                  type="button"
                  className="route-card-action"
                  onClick={handleScheduleCommute}
                  disabled={commuteLoading}
                >
                  {commuteLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Scheduling Commute...</span>
                    </>
                  ) : (
                    <>
                      <span>Setup Recurring Commute</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Authentication Prompt Modal */}
      {showAuthModal && (
        <div className="auth-prompt-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-badge">
                <ShieldCheck className="w-5 h-5 text-[#075b55]" />
              </div>
              <h3 className="modal-title">Sign In to Book Your Ride</h3>
              <button
                type="button"
                aria-label="Close modal"
                className="modal-close-btn"
                onClick={() => setShowAuthModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-description">
              Rides cannot be booked directly as a guest. Please log in or create an account to dispatch verified drivers. Your selected route and upfront fare are saved!
            </p>

            {(pickupAddress || dropoffAddress) && (
              <div className="modal-trip-summary">
                {pickupAddress && (
                  <div className="summary-row">
                    <span className="summary-label">Pickup:</span>
                    <span className="summary-val">{pickupAddress}</span>
                  </div>
                )}
                {dropoffAddress && (
                  <div className="summary-row">
                    <span className="summary-label">Destination:</span>
                    <span className="summary-val">{dropoffAddress}</span>
                  </div>
                )}
                {(activeTab === "commute" ? commuteEst : currentEst) && (
                  <div className="summary-row highlight">
                    <span className="summary-label">Upfront Fare:</span>
                    <span className="summary-val">
                      ₹{activeTab === "commute" ? commuteEst?.fareInRupees : currentEst?.fareInRupees} ({activeTab === "commute" ? (commuteVehicle === "Cab Large" ? "Cab XL" : commuteVehicle) : (selectedVehicle === "Cab Large" ? "Cab XL" : selectedVehicle)})
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <Link
                href={`/login?role=rider&redirect=${encodeURIComponent("/user/dashboard?action=auto-book")}`}
                className="modal-login-btn"
                onClick={() => setShowAuthModal(false)}
              >
                <LogIn size={16} />
                <span>Log In to Book Ride</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href={`/signup?role=rider&redirect=${encodeURIComponent("/user/dashboard?action=auto-book")}`}
                className="modal-register-btn"
                onClick={() => setShowAuthModal(false)}
              >
                New to Bhavo? Create Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for Hero Booking Card */}
      <style>{`
        .hero-booking-card-wrapper {
          position: relative;
          width: 100%;
        }

        .hero-booking-card {
          background: #ffffff;
          border: 1.5px solid #e2ece9;
          border-radius: 24px;
          padding: 20px 22px;
          box-shadow: 0 16px 40px rgba(7, 91, 85, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
          position: relative;
          max-height: min(820px, calc(100vh - 100px));
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #d5e5e2 transparent;
        }

        .hero-booking-card::-webkit-scrollbar {
          width: 5px;
        }

        .hero-booking-card::-webkit-scrollbar-track {
          background: transparent;
        }

        .hero-booking-card::-webkit-scrollbar-thumb {
          background: #d5e5e2;
          border-radius: 6px;
        }

        .hero-booking-card::-webkit-scrollbar-thumb:hover {
          background: #075B55;
        }

        .card-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef3f2;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tabs-container {
          display: inline-flex;
          background: #F5F8F7;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #e2ece9;
        }

        .booking-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .booking-tab.active {
          background: #075B55;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(7, 91, 85, 0.2);
        }

        .header-status-badge {
          display: inline-flex;
          align-items: center;
        }

        .dispatch-telemetry-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          background: #ffffff;
          border: 1px solid #e2ece9;
          border-radius: 8px;
          color: #334155;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.2px;
          box-shadow: 0 1px 3px rgba(7, 91, 85, 0.04);
          transition: all 0.2s ease;
        }

        .dispatch-telemetry-chip .telemetry-icon {
          color: #075b55;
          flex-shrink: 0;
        }

        .dispatch-telemetry-chip.active {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #065f46;
        }
        .dispatch-telemetry-chip.active .telemetry-icon {
          color: #059669;
        }

        .dispatch-telemetry-chip.calculating {
          background: #f0fdfa;
          border-color: #99f6e4;
          color: #0f766e;
        }

        /* Location Inputs */
        .location-inputs-group {
          background: #F5F8F7;
          border: 1px solid #e2ece9;
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 16px;
          position: relative;
        }

        .location-field {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .field-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .field-icon.pickup {
          background: #ecfdf5;
          border: 1.5px solid #16a34a;
        }

        .inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #16a34a;
        }

        .field-icon.destination {
          background: #dc2626;
          border: 1.5px solid #b91c1c;
          color: #ffffff;
        }

        .field-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .field-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.8px;
        }

        .location-text-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 13.5px;
          font-weight: 600;
          color: #142B29;
          outline: none;
          padding: 2px 0;
        }

        .location-text-input::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .field-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .icon-action-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-action-btn:hover {
          color: #0f172a;
          background: #e2ece9;
        }

        .gps-locate-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #075B55;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gps-locate-btn:hover {
          border-color: #075B55;
          background: #e6f4f2;
        }

        .route-divider-track {
          position: relative;
          height: 22px;
          margin-left: 15px;
          display: flex;
          align-items: center;
        }

        .divider-road-line {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: repeating-linear-gradient(
            to bottom,
            #cbd5e1,
            #cbd5e1 4px,
            transparent 4px,
            transparent 8px
          );
        }

        .distance-badge {
          margin-left: 20px;
          font-size: 11px;
          font-weight: 700;
          color: #075B55;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 2px 8px;
          border-radius: 99px;
        }

        /* Suggestions Dropdown */
        .places-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1.5px solid #d5e5e2;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 50;
          max-height: 220px;
          overflow-y: auto;
          margin-top: 6px;
        }

        .place-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .place-option:last-child {
          border-bottom: none;
        }

        .place-option:hover {
          background: #f0f7f5;
        }

        .place-glyph {
          font-size: 16px;
        }

        .place-texts {
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
        }

        .place-title {
          font-size: 13px;
          font-weight: 700;
          color: #142B29;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .place-subtitle {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        /* Form Alert Messages */
        .form-alert-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .form-alert-msg.warning {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .form-alert-msg.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Map Preview */
        .route-map-preview {
          width: 100%;
          height: 180px;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 12px;
          border: 1.5px solid #d5e5e2;
          position: relative;
        }

        .map-interaction-hint {
          position: absolute;
          bottom: 6px;
          left: 8px;
          z-index: 500;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(4px);
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 700;
          color: #075b55;
          pointer-events: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        /* Vehicle Selection Area */
        .vehicle-selection-area {
          margin-bottom: 16px;
        }

        .section-sub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .sub-header-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .fare-badge-truth {
          font-size: 11px;
          font-weight: 700;
          color: #075B55;
          background: rgba(7, 91, 85, 0.08);
          padding: 2px 8px;
          border-radius: 99px;
        }

        .pricing-spin {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #075B55;
        }

        .vehicle-pills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
          gap: 8px;
          margin-bottom: 10px;
        }

        .vehicle-card-pill {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px 10px 8px;
          min-height: 82px;
          background: #F5F8F7;
          border: 1.5px solid #e2ece9;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          text-align: left;
          position: relative;
        }

        .vehicle-card-pill:hover {
          border-color: #075B55;
          background: #f0f7f5;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(7, 91, 85, 0.08);
        }

        .vehicle-card-pill.selected {
          border-color: #075B55;
          background: #ffffff;
          box-shadow: 0 6px 18px rgba(7, 91, 85, 0.16);
          transform: translateY(-2px);
        }

        .veh-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 4px;
        }

        .veh-icon-col {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
        }

        .veh-fare-col {
          flex-shrink: 0;
          text-align: right;
        }

        .veh-fare-num {
          font-size: 13.5px;
          font-weight: 900;
          color: #075B55;
          letter-spacing: -0.2px;
        }

        .veh-details-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
          width: 100%;
        }

        .veh-name {
          font-size: 12px;
          font-weight: 800;
          color: #142B29;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .veh-capacity {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }

        /* Specialized Animatic Vehicle Micro-Animations (Rapido/Ola style) */
        @keyframes vehChassisFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes vehShadowPulse {
          0%, 100% {
            transform: scaleX(1);
            opacity: 0.35;
          }
          50% {
            transform: scaleX(0.92);
            opacity: 0.22;
          }
        }

        .animatic-veh {
          overflow: visible;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animatic-veh .veh-road-shadow {
          transform-origin: 54px 56px;
          animation: vehShadowPulse 3.2s ease-in-out infinite;
        }

        .animatic-veh .veh-chassis {
          transition: transform 0.25s ease;
          animation: vehChassisFloat 3.2s ease-in-out infinite;
        }

        .animatic-veh .veh-light-glow {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .vehicle-card-pill:hover .animatic-veh,
        .vehicle-card-pill.selected .animatic-veh {
          transform: scale(1.1) translateY(-1px);
        }

        .vehicle-card-pill:hover .veh-light-glow,
        .vehicle-card-pill.selected .veh-light-glow {
          opacity: 0.85;
        }

        .empty-estimates-hint {
          padding: 12px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          background: #F5F8F7;
          border-radius: 8px;
        }

        .pet-toggle-row {
          display: flex;
          align-items: center;
          padding: 6px 0;
        }

        .pet-toggle-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .pet-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #075B55;
          cursor: pointer;
        }

        .pet-text {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        /* Footer Specs */
        .route-footer-specs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 12px 14px;
          background: #F5F8F7;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .spec-k {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .spec-v {
          font-size: 12px;
          font-weight: 800;
          color: #142B29;
        }

        /* Action Buttons */
        .route-card-action {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #075B55;
          color: #ffffff;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          box-shadow: 0 4px 14px rgba(7, 91, 85, 0.25);
        }

        .route-card-action:hover:not(:disabled) {
          background: #0a6e67;
          transform: translateY(-1px);
        }

        .route-card-action:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Active Ride Tracker Styles */
        .active-ride-tracker {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ride-status-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-pill-large {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 800;
          color: #075B55;
        }

        .sse-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 99px;
        }

        .sse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .sse-dot.live {
          background: #10B8A6;
        }

        .sse-dot.fallback {
          background: #f59e0b;
        }

        .otp-security-box {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          padding: 10px 14px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .otp-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: #065f46;
        }

        .otp-number {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #065f46;
          background: #ffffff;
          padding: 2px 10px;
          border-radius: 8px;
          border: 1px solid #6ee7b7;
        }

        .otp-hint {
          font-size: 10px;
          color: #047857;
          font-weight: 600;
        }

        .tracker-map-container {
          width: 100%;
          height: 190px;
          border-radius: 14px;
          overflow: hidden;
          border: 1.5px solid #d5e5e2;
        }

        .driver-info-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #F5F8F7;
          border-radius: 12px;
          border: 1px solid #e2ece9;
        }

        .driver-avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #075B55;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
        }

        .driver-text-details {
          flex: 1;
        }

        .driver-name {
          font-size: 13.5px;
          font-weight: 800;
          color: #142B29;
        }

        .driver-vehicle-specs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #64748b;
          font-weight: 600;
        }

        .plate-badge {
          background: #e2ece9;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 700;
          color: #075B55;
        }

        .driver-rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 800;
          color: #142B29;
          background: #ffffff;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .ride-summary-specs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 12px;
          background: #F5F8F7;
          border-radius: 10px;
        }

        .summary-point {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .summary-icon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .summary-icon.pickup {
          background: #16a34a;
        }

        .summary-icon.destination {
          background: #dc2626;
        }

        .summary-text {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .spec-label {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
        }

        .spec-val {
          font-size: 12px;
          font-weight: 700;
          color: #142B29;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .tracker-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
        }

        .fare-badge {
          display: flex;
          flex-direction: column;
        }

        .fare-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
        }

        .fare-amount {
          font-size: 17px;
          font-weight: 900;
          color: #075B55;
        }

        .payment-note {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
        }

        .cancel-ride-btn {
          padding: 8px 14px;
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cancel-ride-btn:hover {
          background: #fca5a5;
        }

        .reset-ride-btn {
          padding: 8px 14px;
          background: #075B55;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Commute Form Content */
        .commute-form-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .commute-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .commute-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.6px;
        }

        .commute-text-input,
        .commute-select-input,
        .time-text-input {
          width: 100%;
          background: #F5F8F7;
          border: 1.5px solid #e2ece9;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13.5px;
          font-weight: 600;
          color: #142B29;
          outline: none;
        }

        .commute-text-input:focus,
        .commute-select-input:focus,
        .time-text-input:focus {
          border-color: #075B55;
          background: #ffffff;
        }

        .commute-row-schedule {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
        }

        .days-picker-pills {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .day-pill {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1.5px solid #e2ece9;
          background: #F5F8F7;
          font-size: 11.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .day-pill:hover {
          border-color: #075B55;
        }

        .day-pill.selected {
          background: #075B55;
          color: #ffffff;
          border-color: #075B55;
        }

        /* Commute Success Card */
        .commute-success-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 10px 0;
          gap: 12px;
        }

        .success-icon-badge {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #ecfdf5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-heading {
          font-size: 18px;
          font-weight: 900;
          color: #142B29;
          margin: 0;
        }

        .success-sub {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .commute-details-box {
          width: 100%;
          background: #F5F8F7;
          border: 1px solid #e2ece9;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .commute-spec-row {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
        }

        .commute-spec-row .label {
          color: #64748b;
          font-weight: 600;
        }

        .commute-spec-row .val {
          color: #142B29;
          font-weight: 800;
        }

        .success-actions-row {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;
        }

        .view-commutes-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #075B55;
          color: #ffffff;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
        }

        .another-commute-btn {
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Auth Prompt Modal */
        .auth-prompt-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .auth-prompt-modal {
          background: #ffffff;
          border-radius: 20px;
          max-width: 420px;
          width: 100%;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #e6f4f2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title {
          font-size: 17px;
          font-weight: 800;
          color: #142B29;
          margin: 0;
          flex: 1;
          margin-left: 10px;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .login-required-notice {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 10px 14px;
          margin-top: 14px;
          gap: 8px;
          font-size: 13px;
          color: #166534;
        }

        .login-required-notice .notice-icon {
          color: #075b55;
          flex-shrink: 0;
        }

        .login-required-notice .notice-text {
          flex: 1;
          font-weight: 500;
        }

        .login-required-notice .notice-link {
          font-weight: 700;
          color: #075b55;
          text-decoration: underline;
          flex-shrink: 0;
        }

        .modal-trip-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          color: #64748b;
          gap: 8px;
        }

        .summary-row.highlight {
          border-top: 1px dashed #cbd5e1;
          padding-top: 6px;
          margin-top: 2px;
          color: #075b55;
          font-weight: 700;
        }

        .summary-label {
          font-weight: 600;
        }

        .summary-val {
          font-weight: 700;
          color: #1e293b;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 220px;
        }

        .summary-row.highlight .summary-val {
          color: #075b55;
        }

        .modal-description {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;
        }

        .modal-login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #075B55;
          color: #ffffff;
          padding: 13px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .modal-register-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 11px 20px;
          border: 1.5px solid #d5e5e2;
          color: #075B55;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 640px) {
          .hero-booking-card {
            padding: 18px 14px;
          }
          .vehicle-pills-grid {
            grid-template-columns: 1fr;
          }
          .commute-row-schedule {
            grid-template-columns: 1fr;
          }
          .route-footer-specs {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
