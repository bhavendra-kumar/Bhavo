"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Car,
  Play,
  Pause,
  Zap,
} from "lucide-react";

type CommuteShift = "morning" | "evening";

interface PhaseData {
  id: number;
  label: string;
  shortTag: string;
  statusBadge: {
    text: string;
    bg: string;
    color: string;
    borderColor: string;
    pulse: boolean;
  };
  pickupTime: string;
  occurrenceStatus: string;
  occurrenceIcon: "clock" | "shield" | "car" | "check";
  vehicleProgress: number; // 0 to 100%
  driver: {
    name: string;
    rating: string;
    car: string;
    plate: string;
    eta: string;
  } | null;
  bannerMessage: string;
}

export default function CommuteScheduleAnimatic() {
  const [shift, setShift] = useState<CommuteShift>("morning");
  const [activeDays, setActiveDays] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(864); // ~14m 24s countdown

  const daysLabels = [
    { label: "Mon", full: "Monday" },
    { label: "Tue", full: "Tuesday" },
    { label: "Wed", full: "Wednesday" },
    { label: "Thu", full: "Thursday" },
    { label: "Fri", full: "Friday" },
    { label: "Sat", full: "Saturday" },
    { label: "Sun", full: "Sunday" },
  ];

  // Current day of week indicator (0=Sun, 1=Mon, ..., 4=Thu)
  const todayIndex = 3; // Thursday highlighted by default

  const morningRoute = {
    pickup: "Residential Campus, Sector 4",
    pickupDetail: "Main Gate • North Canopy",
    dropoff: "Technology Park, North Gate",
    dropoffDetail: "Tower B Entrance • Tech Boulevard",
    time: "08:30 AM",
    distance: "11.4 km",
    duration: "24 mins",
  };

  const eveningRoute = {
    pickup: "Technology Park, North Gate",
    pickupDetail: "Tower B Portico",
    dropoff: "Residential Campus, Sector 4",
    dropoffDetail: "Main Gate • North Canopy",
    time: "06:15 PM",
    distance: "11.4 km",
    duration: "26 mins",
  };

  const route = shift === "morning" ? morningRoute : eveningRoute;

  // Phases simulating the live auto-pilot lifecycle
  const phases: PhaseData[] = [
    {
      id: 0,
      label: "Scheduled",
      shortTag: "Standby",
      statusBadge: {
        text: "STATUS: ACTIVE",
        bg: "rgba(16, 184, 166, 0.12)",
        color: "#075B55",
        borderColor: "rgba(16, 184, 166, 0.25)",
        pulse: true,
      },
      pickupTime: route.time,
      occurrenceStatus: "Auto-Dispatched",
      occurrenceIcon: "shield",
      vehicleProgress: 0,
      driver: null,
      bannerMessage: "Rides materialize within configured dispatch boundaries without manual re-booking.",
    },
    {
      id: 1,
      label: "Auto-Matching",
      shortTag: "Dispatching",
      statusBadge: {
        text: "STATUS: MATCHING",
        bg: "rgba(245, 158, 11, 0.14)",
        color: "#b45309",
        borderColor: "rgba(245, 158, 11, 0.3)",
        pulse: true,
      },
      pickupTime: route.time,
      occurrenceStatus: "Scanning Fleet...",
      occurrenceIcon: "clock",
      vehicleProgress: 10,
      driver: null,
      bannerMessage: "System is reserving verified nearby EV driver ahead of your target window.",
    },
    {
      id: 2,
      label: "Driver Assigned",
      shortTag: "Driver En Route",
      statusBadge: {
        text: "DRIVER EN ROUTE",
        bg: "rgba(7, 91, 85, 0.12)",
        color: "#075B55",
        borderColor: "rgba(7, 91, 85, 0.25)",
        pulse: true,
      },
      pickupTime: route.time,
      occurrenceStatus: "Driver 4 min away",
      occurrenceIcon: "car",
      vehicleProgress: 25,
      driver: {
        name: "Rajesh Kumar",
        rating: "4.94 ★",
        car: "Tata Tigor EV (White)",
        plate: "KA 03 MX 1102",
        eta: "Arriving 08:28 AM",
      },
      bannerMessage: "Verified EV cab assigned. Zero cancellations, zero surge on scheduled routes.",
    },
    {
      id: 3,
      label: "Commute Live",
      shortTag: "In Transit",
      statusBadge: {
        text: "IN TRANSIT",
        bg: "rgba(16, 184, 166, 0.16)",
        color: "#0f766e",
        borderColor: "rgba(16, 184, 166, 0.35)",
        pulse: true,
      },
      pickupTime: route.time,
      occurrenceStatus: "On Route (ETA 14m)",
      occurrenceIcon: "car",
      vehicleProgress: 68,
      driver: {
        name: "Rajesh Kumar",
        rating: "4.94 ★",
        car: "Tata Tigor EV (White)",
        plate: "KA 03 MX 1102",
        eta: "On Schedule",
      },
      bannerMessage: "Trip in progress along express corridor. Live telemetry active.",
    },
    {
      id: 4,
      label: "Completed",
      shortTag: "Arrived",
      statusBadge: {
        text: "TRIP COMPLETED",
        bg: "rgba(34, 197, 94, 0.12)",
        color: "#15803d",
        borderColor: "rgba(34, 197, 94, 0.25)",
        pulse: false,
      },
      pickupTime: route.time,
      occurrenceStatus: "Dropped Safely",
      occurrenceIcon: "check",
      vehicleProgress: 100,
      driver: null,
      bannerMessage: "Arrived right on schedule. Upfront fixed fare ₹160 auto-settled seamlessly.",
    },
  ];

  const currentPhase = phases[currentPhaseIndex];

  // Auto-play phase advancement
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [isPlaying, phases.length]);

  // Live ticking countdown for realism
  useEffect(() => {
    const clock = setInterval(() => {
      setSecondsUntilNext((prev) => (prev > 0 ? prev - 1 : 864));
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const toggleDay = (idx: number) => {
    setActiveDays((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const selectedDaysCount = activeDays.filter(Boolean).length;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2ece9",
        borderRadius: 28,
        padding: "30px 28px 26px",
        boxShadow: "0 16px 45px -8px rgba(7, 91, 85, 0.12), 0 0 0 1px rgba(7, 91, 85, 0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background ambient gradient accent */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 184, 166, 0.09) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Bar: Title + Status Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: "1px solid #f1f5f9",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(7, 91, 85, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#075B55",
            }}
          >
            <CalendarClock size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#142B29" }}>
                Active Commute Schedule
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
              Auto-pilot recurring dispatch engine
            </span>
          </div>
        </div>

        {/* Dynamic Status Badge with Live Pulsing Dot */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase.statusBadge.text}
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.25 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              color: currentPhase.statusBadge.color,
              background: currentPhase.statusBadge.bg,
              border: `1px solid ${currentPhase.statusBadge.borderColor}`,
              padding: "4px 12px",
              borderRadius: 99,
              letterSpacing: 0.4,
            }}
          >
            {currentPhase.statusBadge.pulse && (
              <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    backgroundColor: currentPhase.statusBadge.color,
                    opacity: 0.6,
                    animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    borderRadius: "50%",
                    width: 8,
                    height: 8,
                    backgroundColor: currentPhase.statusBadge.color,
                  }}
                />
              </span>
            )}
            <span>{currentPhase.statusBadge.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Routine Shift Switcher: Morning vs. Evening */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#F5F8F7",
          padding: 4,
          borderRadius: 14,
          marginBottom: 20,
          border: "1px solid #e2ece9",
        }}
      >
        <button
          type="button"
          onClick={() => setShift("morning")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            background: shift === "morning" ? "#ffffff" : "transparent",
            color: shift === "morning" ? "#075B55" : "#64748b",
            fontWeight: shift === "morning" ? 800 : 600,
            fontSize: 12.5,
            cursor: "pointer",
            boxShadow: shift === "morning" ? "0 2px 8px rgba(7, 91, 85, 0.08)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s ease",
          }}
        >
          <span>☀️ Morning Commute</span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 6,
              background: shift === "morning" ? "rgba(7, 91, 85, 0.1)" : "rgba(0,0,0,0.04)",
              fontWeight: 700,
            }}
          >
            08:30 AM
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShift("evening")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            background: shift === "evening" ? "#ffffff" : "transparent",
            color: shift === "evening" ? "#075B55" : "#64748b",
            fontWeight: shift === "evening" ? 800 : 600,
            fontSize: 12.5,
            cursor: "pointer",
            boxShadow: shift === "evening" ? "0 2px 8px rgba(7, 91, 85, 0.08)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s ease",
          }}
        >
          <span>🌙 Evening Return</span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 6,
              background: shift === "evening" ? "rgba(7, 91, 85, 0.1)" : "rgba(0,0,0,0.04)",
              fontWeight: 700,
            }}
          >
            06:15 PM
          </span>
        </button>
      </div>

      {/* Weekday Selector Mock — Interactive with Bouncy Feedback */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Recurring Weekdays
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#075B55" }}>
            {selectedDaysCount} days active • {selectedDaysCount * 2} rides/wk
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {daysLabels.map((d, i) => {
            const isActive = activeDays[i];
            const isToday = i === todayIndex;

            return (
              <motion.button
                key={i}
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => toggleDay(i)}
                title={`${d.full} - Click to toggle`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isActive ? "#075B55" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  border: isToday
                    ? "2px solid #10B8A6"
                    : isActive
                      ? "1px solid #075B55"
                      : "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s ease, color 0.2s ease",
                  boxShadow: isActive ? "0 4px 10px rgba(7, 91, 85, 0.2)" : "none",
                }}
              >
                <span>{d.label}</span>
                {isToday && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: isActive ? "#10B8A6" : "#075B55",
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Interactive Route Box with Animated Connecting Track */}
      <div
        style={{
          background: "#F5F8F7",
          border: "1px solid #e2ece9",
          borderRadius: 18,
          padding: "18px 20px",
          marginBottom: 16,
          position: "relative",
        }}
      >
        {/* Connecting route track with animated moving car / pulse */}
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 40,
            bottom: 42,
            width: 2,
            background: "linear-gradient(to bottom, #075B55 0%, #10B8A6 100%)",
            opacity: 0.35,
          }}
        />

        {/* Animated Moving Dot / Vehicle along the route */}
        <motion.div
          animate={{
            top: `${Math.min(Math.max(currentPhase.vehicleProgress, 8), 75)}%`,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: 23,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#10B8A6",
            border: "2px solid #ffffff",
            boxShadow: "0 0 10px rgba(16, 184, 166, 0.8)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {/* Origin / Pickup */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18, position: "relative" }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#ffffff",
              border: "2px solid #075B55",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
              zIndex: 3,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#075B55" }} />
          </div>
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#64748b",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              PICKUP LOCATION
            </span>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#142B29", margin: "2px 0 0" }}>
              {route.pickup}
            </p>
            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{route.pickupDetail}</span>
          </div>
        </div>

        {/* Destination / Dropoff */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative" }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#ffffff",
              border: "2px solid #10B8A6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
              zIndex: 3,
            }}
          >
            <MapPin size={12} style={{ color: "#10B8A6" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#64748b",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                DESTINATION
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#075B55",
                  background: "rgba(7, 91, 85, 0.08)",
                  padding: "1px 8px",
                  borderRadius: 6,
                }}
              >
                {route.distance} • ~{route.duration}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#142B29", margin: "2px 0 0" }}>
              {route.dropoff}
            </p>
            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{route.dropoffDetail}</span>
          </div>
        </div>
      </div>

      {/* Driver pop-in card during assigned / transit phases */}
      <AnimatePresence>
        {currentPhase.driver && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "linear-gradient(135deg, rgba(7, 91, 85, 0.05) 0%, rgba(16, 184, 166, 0.08) 100%)",
              border: "1px solid rgba(16, 184, 166, 0.25)",
              borderRadius: 14,
              padding: "10px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "#075B55",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Car size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#142B29" }}>
                    {currentPhase.driver.name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#075B55" }}>
                    {currentPhase.driver.rating}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {currentPhase.driver.car} • {currentPhase.driver.plate}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#075B55",
                background: "#ffffff",
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid #e2ece9",
                whiteSpace: "nowrap",
              }}
            >
              {currentPhase.driver.eta}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time & Occurrence Status Dual Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Clock size={14} style={{ color: "#64748b" }} />
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Pickup Window</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#142B29" }}>
              {currentPhase.pickupTime}
            </span>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Fixed</span>
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {currentPhase.occurrenceIcon === "shield" && <ShieldCheck size={14} style={{ color: "#075B55" }} />}
            {currentPhase.occurrenceIcon === "clock" && <Clock size={14} style={{ color: "#b45309" }} />}
            {currentPhase.occurrenceIcon === "car" && <Car size={14} style={{ color: "#075B55" }} />}
            {currentPhase.occurrenceIcon === "check" && <CheckCircle2 size={14} style={{ color: "#15803d" }} />}
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Occurrence Status</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPhase.occurrenceStatus}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: 13,
                fontWeight: 800,
                color:
                  currentPhase.id === 1
                    ? "#b45309"
                    : currentPhase.id === 4
                      ? "#15803d"
                      : "#075B55",
                display: "block",
              }}
            >
              {currentPhase.occurrenceStatus}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Animatic Stepper Timeline Controls */}
      <div
        style={{
          background: "#F5F8F7",
          border: "1px solid #e2ece9",
          borderRadius: 14,
          padding: "10px 12px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? "#075B55" : "#e2ece9",
                color: isPlaying ? "#ffffff" : "#075B55",
                border: "none",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title={isPlaying ? "Pause simulation" : "Play simulation"}
            >
              {isPlaying ? <Pause size={10} /> : <Play size={10} />}
              <span>{isPlaying ? "Live Simulation" : "Paused"}</span>
            </button>
            <span style={{ fontSize: 10.5, color: "#94a3b8" }}>• Cycle: 4s</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#64748b" }}>
            <Zap size={11} style={{ color: "#10B8A6" }} />
            <span>Next run in <strong>{formatCountdown(secondsUntilNext)}</strong></span>
          </div>
        </div>

        {/* 5-step interactive clickable scrubber */}
        <div style={{ display: "flex", gap: 6 }}>
          {phases.map((p, idx) => {
            const isCurrent = idx === currentPhaseIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCurrentPhaseIndex(idx);
                  setIsPlaying(false);
                }}
                style={{
                  flex: 1,
                  padding: "6px 2px",
                  borderRadius: 6,
                  border: isCurrent ? "1px solid #075B55" : "1px solid transparent",
                  background: isCurrent ? "rgba(7, 91, 85, 0.12)" : "rgba(0,0,0,0.03)",
                  color: isCurrent ? "#075B55" : "#94a3b8",
                  fontSize: 10,
                  fontWeight: isCurrent ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={`Jump to step ${idx + 1}: ${p.label}`}
              >
                {p.shortTag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operational Transparency Note */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase.bannerMessage}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.45,
          }}
        >
          <CheckCircle2 size={16} style={{ color: "#10B8A6", flexShrink: 0 }} />
          <span>{currentPhase.bannerMessage}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
