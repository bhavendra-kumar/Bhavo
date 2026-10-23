"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  Heart,
  Check,
  Star,
  Shield,
} from "lucide-react";

type PetType = "dog" | "cat" | "other";

interface PetOptionConfig {
  type: PetType;
  emoji: string;
  name: string;
  desc: string;
  amenity: string;
  recommendedVehicle: string;
}

const PET_OPTIONS: PetOptionConfig[] = [
  {
    type: "dog",
    emoji: "🐕",
    name: "Dogs & Pups",
    desc: "Spacious rear row equipped with protective waterproof hammock seat cover.",
    amenity: "Waterproof Seat Hammock • Clean AC Cabin",
    recommendedVehicle: "BHAVO XL / Premier Sedan",
  },
  {
    type: "cat",
    emoji: "🐈",
    name: "Cats in Carrier",
    desc: "Quiet, climate-controlled ride with smooth acceleration for nervous travelers.",
    amenity: "Acoustic Dampening • Gentle Driving Protocol",
    recommendedVehicle: "BHAVO Comfort EV",
  },
  {
    type: "other",
    emoji: "🐾",
    name: "Other Companion Pets",
    desc: "Secure transport for bunnies, birds, and small pets in secure carriers.",
    amenity: "Temperature Monitored • Zero Driver Hesitation",
    recommendedVehicle: "BHAVO Hatch / Compact",
  },
];

export default function PetFriendlyAnimatic() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [selectedPet, setSelectedPet] = useState<PetType>("dog");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Auto-cycle through pet types & dispatch states if autoRotate is true
  useEffect(() => {
    if (!autoRotate || !isEnabled) return;

    const petKeys: PetType[] = ["dog", "cat", "other"];
    const interval = setInterval(() => {
      setSelectedPet((prev) => {
        const nextIdx = (petKeys.indexOf(prev) + 1) % petKeys.length;
        return petKeys[nextIdx];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [autoRotate, isEnabled]);

  const activePetConfig = PET_OPTIONS.find((p) => p.type === selectedPet) || PET_OPTIONS[0];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(7, 91, 85, 0.05) 0%, rgba(16, 184, 166, 0.09) 100%)",
        border: "1.5px solid #ccfbf1",
        borderRadius: 28,
        padding: "36px 30px 28px",
        position: "relative",
        boxShadow: "0 16px 45px -10px rgba(7, 91, 85, 0.12), 0 0 0 1px rgba(16, 184, 166, 0.08)",
        overflow: "hidden",
      }}
    >
      {/* Soft decorative background orb */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 184, 166, 0.15) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Floating Badge Bar: Squircle Icon + Status & Live Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        {/* Animated Squircle Brand Icon */}
        <motion.div
          animate={{
            scale: isEnabled ? [1, 1.05, 1] : 1,
            rotate: isEnabled ? [0, -2, 2, 0] : 0,
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 20,
            background: isEnabled
              ? "linear-gradient(135deg, #075B55 0%, #0d9488 100%)"
              : "#94a3b8",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isEnabled
              ? "0 10px 25px rgba(7, 91, 85, 0.28)"
              : "0 4px 12px rgba(0,0,0,0.08)",
            position: "relative",
            transition: "background 0.3s ease",
          }}
        >
          <HeartHandshake size={30} />
          {isEnabled && (
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#10B8A6",
                border: "2px solid #ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={8} fill="#ffffff" color="#ffffff" />
            </motion.span>
          )}
        </motion.div>

        {/* Interactive Master Switch Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>
            {isEnabled ? "Filter Active" : "Filter Inactive"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsEnabled(!isEnabled);
              setAutoRotate(false);
            }}
            aria-label="Toggle pet friendly filter"
            style={{
              width: 52,
              height: 30,
              borderRadius: 99,
              background: isEnabled ? "#075B55" : "#cbd5e1",
              border: "none",
              cursor: "pointer",
              padding: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: isEnabled ? "flex-end" : "flex-start",
              transition: "background 0.25s ease",
              boxShadow: isEnabled
                ? "0 2px 8px rgba(7, 91, 85, 0.3)"
                : "none",
            }}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isEnabled ? "#075B55" : "#94a3b8",
                fontSize: 10,
              }}
            >
              {isEnabled ? <Check size={14} strokeWidth={3} /> : null}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Main Interactive Pet-Friendly Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 22,
          padding: "22px 22px 18px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          marginBottom: 16,
          border: "1px solid #e2ece9",
          position: "relative",
          transition: "all 0.3s ease",
        }}
      >
        {/* Card Header: Title & Dynamic Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#142B29" }}>
              Pet-Friendly Ride Option
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#10B8A6",
                background: "rgba(16, 184, 166, 0.1)",
                padding: "2px 7px",
                borderRadius: 6,
              }}
            >
              Zero Surcharge
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.span
              key={isEnabled ? "enabled" : "disabled"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: isEnabled ? "#075B55" : "#64748b",
                background: isEnabled ? "#ccfbf1" : "#f1f5f9",
                border: isEnabled ? "1px solid #99f6e4" : "1px solid #e2e8f0",
                padding: "3px 11px",
                borderRadius: 99,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {isEnabled && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#075B55",
                    display: "inline-block",
                  }}
                />
              )}
              {isEnabled ? "Enabled" : "Disabled"}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Dynamic Description or Prompt */}
        <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
          {isEnabled
            ? "Active filter applied to driver dispatch. Only verified drivers with pet-accommodating vehicles will receive your ride request."
            : "Standard dispatch mode. Enable this toggle to ensure your driver welcomes companion pets."}
        </p>

        {/* Pet Companion Category Switcher (Animatic interactive chips) */}
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#94a3b8",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Select Pet Companion Type:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {PET_OPTIONS.map((opt) => {
                const isSelected = selectedPet === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedPet(opt.type);
                      setAutoRotate(false);
                    }}
                    style={{
                      background: isSelected ? "rgba(7, 91, 85, 0.08)" : "#f8fafc",
                      border: isSelected ? "1.5px solid #075B55" : "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "8px 6px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                  >
                    <span style={{ fontSize: 16, display: "block", marginBottom: 2 }}>
                      {opt.emoji}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? "#075B55" : "#64748b",
                        display: "block",
                      }}
                    >
                      {opt.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Live Matched Pet-Friendly Captain Mini Card */}
        {isEnabled && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPet}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%)",
                border: "1px solid #bbf7d0",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#075B55",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {activePetConfig.emoji}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#142B29" }}>
                      Captain Vikram S.
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#075B55",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      4.96
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#0f766e", fontWeight: 600 }}>
                    {activePetConfig.amenity}
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#075B55",
                  background: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "1px solid #ccfbf1",
                  whiteSpace: "nowrap",
                }}
              >
                🐾 Pet Certified
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Verified Driver Pill / Respectful Opt-In */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 18,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid #e2ece9",
          boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(16, 184, 166, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#075B55",
              flexShrink: 0,
            }}
          >
            <Shield size={19} />
          </div>
          <div>
            <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "#142B29", margin: 0 }}>
              Selective Driver Opt-In
            </h4>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
              Respectful of both passenger needs and driver comfort.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10B8A6",
              boxShadow: "0 0 8px rgba(16, 184, 166, 0.8)",
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#075B55" }}>
            100% Opted-In
          </span>
        </div>
      </div>
    </div>
  );
}
