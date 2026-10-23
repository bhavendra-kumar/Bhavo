"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Car,
  CalendarClock,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
} from "lucide-react";

type ServiceId = "everyday-rides" | "daily-commutes" | "pet-rides";

interface ServiceDetail {
  id: ServiceId;
  label: string;
  tag: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  href: string;
  actionText: string;
  features: string[];
  spotlightBadge: string;
  spotlightDesc: string;
}

const SERVICES: ServiceDetail[] = [
  {
    id: "everyday-rides",
    label: "Everyday City Rides",
    tag: "On-Demand Mobility",
    title: "Instant Point-to-Point City Travel",
    category: "ON-DEMAND TRAVEL",
    description:
      "Request convenient, point-to-point rides for daily errands, office meetings, and spontaneous city journeys. Enjoy guaranteed upfront pricing calculated on the server with zero unexpected surge multipliers.",
    icon: Car,
    href: "/user/book-ride",
    actionText: "Book an Everyday Ride",
    features: [
      "Sub-meter driver approach tracking & live telemetry",
      "Secure 4-digit OTP passenger boarding verification",
      "Multiple vehicle tiers: Quick Hatchback, Comfort Sedan, and Premium XL",
    ],
    spotlightBadge: "Instant Dispatch",
    spotlightDesc: "Nearby verified drivers assigned promptly within your target dispatch radius.",
  },
  {
    id: "daily-commutes",
    label: "Daily Commute Autopilot",
    tag: "Signature Capability",
    title: "Automated Weekday Commutes on Autopilot",
    category: "RECURRING AUTOMATION",
    description:
      "Configure your regular home-to-office or university route once. Select your operational weekdays and target morning/evening windows to have recurring ride occurrences generated ahead of time without daily app re-booking.",
    icon: CalendarClock,
    href: "#commutes",
    actionText: "Configure Your Commute",
    features: [
      "Fixed route memory with zero repetitive booking steps",
      "Shielded commute subscriptions with zero rain or peak-hour surges",
      "Pre-window dispatch: nearby captain assigned ahead of scheduled time",
    ],
    spotlightBadge: "Automated Routine",
    spotlightDesc: "Never scramble for a morning ride again. Occurrences materialize seamlessly.",
  },
  {
    id: "pet-rides",
    label: "Pet-Friendly Travel",
    tag: "Inclusive Mobility",
    title: "Travel Safely with Your Companion Pets",
    category: "PET-FRIENDLY TRAVEL",
    description:
      "Travel comfortably alongside your domestic pets. Our dedicated pet filter pairs you exclusively with captains who have registered pet-accommodating vehicles equipped with clean, protective seat covers.",
    icon: HeartHandshake,
    href: "#pet-rides",
    actionText: "Explore Pet-Friendly Rides",
    features: [
      "100% opted-in captains with pet-friendly vehicle configurations",
      "Accommodating setups for dogs, cats in carriers, and companion pets",
      "Zero extra surcharge during regular booking — transparent platform policy",
    ],
    spotlightBadge: "Pet Certified",
    spotlightDesc: "Stress-free, comfortable journeys for pets and pet parents alike.",
  },
];

const SERVICE_PILLARS = [
  {
    icon: ShieldCheck,
    title: "Upfront Fare Guarantee",
    desc: "Every rate is computed server-authoritatively before trip confirmation with no hidden surge fees.",
  },
  {
    icon: Clock,
    title: "Punctual Pre-Dispatch",
    desc: "Commutes and rides are matched with nearby active-duty captains ahead of your scheduled departure.",
  },
  {
    icon: Compass,
    title: "Sub-Meter Tracking",
    desc: "Live waypoint telemetry keeps riders and families informed throughout the journey.",
  },
  {
    icon: Zap,
    title: "Eco-Fleet Priority",
    desc: "Expanding electric vehicle availability and green corridor clustering to reduce transit emissions.",
  },
];

export default function ServicesSection() {
  const [activeService, setActiveService] = useState<ServiceId>("everyday-rides");
  const currentService = SERVICES.find((s) => s.id === activeService) || SERVICES[0];
  const CurrentIcon = currentService.icon;

  return (
    <section
      id="services"
      style={{
        background: "#ffffff",
        padding: "72px 24px 80px",
        scrollMarginTop: 80,
        position: "relative",
        borderTop: "1px solid #e2ece9",
        borderBottom: "1px solid #e2ece9",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Section Header with Exact Eyebrow Pill */}
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: "#075B55",
              background: "rgba(7, 91, 85, 0.08)",
              border: "1px solid rgba(7, 91, 85, 0.18)",
              padding: "5px 14px",
              borderRadius: 99,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} style={{ color: "#10B8A6" }} />
            <span>Our Mobility Services</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(30px, 4.2vw, 46px)",
              fontWeight: 900,
              color: "#142B29",
              letterSpacing: "-1.2px",
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            Distinct Mobility Built Around Your Everyday Routine
          </h2>

          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
            From spontaneous point-to-point hops to recurring weekday commutes and certified pet travel,
            BHAVO delivers reliable, transparent transit powered by verified drivers.
          </p>
        </div>

        {/* 4 Feature Highlights Grid (No fake metrics) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginBottom: 44,
          }}
        >
          {SERVICE_PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: "#F5F8F7",
                  border: "1px solid #e2ece9",
                  borderRadius: 20,
                  padding: "24px 22px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(16, 184, 166, 0.12)",
                    color: "#075B55",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: "#142B29" }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.55 }}>
                    {p.desc}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Service Deep-Dive Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2ece9",
            borderRadius: 28,
            boxShadow: "0 14px 40px rgba(7, 91, 85, 0.07)",
            padding: "36px 32px",
            marginBottom: 40,
          }}
        >
          {/* Navigation Pill Buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: 20,
              marginBottom: 32,
              overflowX: "auto",
            }}
          >
            {SERVICES.map((s) => {
              const isActive = activeService === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveService(s.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 99,
                    border: isActive ? "1.5px solid #075B55" : "1px solid #e2e8f0",
                    background: isActive ? "rgba(7, 91, 85, 0.08)" : "#f8fafc",
                    color: isActive ? "#075B55" : "#64748b",
                    fontSize: 13.5,
                    fontWeight: isActive ? 800 : 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? "#075B55" : "#94a3b8" }} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Service Content Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentService.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: 40,
                alignItems: "center",
              }}
              className="services-layout-split"
            >
              {/* Left Column: Details */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: "#10B8A6",
                      background: "rgba(16, 184, 166, 0.12)",
                      padding: "3px 10px",
                      borderRadius: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {currentService.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 800,
                    color: "#142B29",
                    lineHeight: 1.25,
                    margin: "0 0 16px",
                  }}
                >
                  {currentService.title}
                </h3>

                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "0 0 24px" }}>
                  {currentService.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                  {currentService.features.map((f, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(7, 91, 85, 0.12)",
                          color: "#075B55",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={13} style={{ color: "#075B55" }} />
                      </div>
                      <span style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={currentService.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg, #075B55 0%, #0d9488 100%)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderRadius: 12,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(7, 91, 85, 0.25)",
                  }}
                >
                  <span>{currentService.actionText}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Right Column: Visual Spotlight Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(7, 91, 85, 0.05) 0%, rgba(16, 184, 166, 0.1) 100%)",
                  border: "1.5px solid #ccfbf1",
                  borderRadius: 22,
                  padding: "36px 30px",
                  textAlign: "center",
                  position: "relative",
                  boxShadow: "0 8px 30px rgba(7, 91, 85, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 22,
                    background: "#075B55",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: "0 10px 25px rgba(7, 91, 85, 0.25)",
                  }}
                >
                  <CurrentIcon size={32} />
                </div>

                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "#075B55",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {currentService.spotlightBadge}
                </div>

                <div style={{ fontSize: 22, fontWeight: 900, color: "#142B29", lineHeight: 1.25, marginBottom: 10 }}>
                  {currentService.label}
                </div>

                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 auto 20px", lineHeight: 1.6, maxWidth: 300 }}>
                  {currentService.spotlightDesc}
                </p>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 12,
                    padding: "10px 16px",
                    border: "1px solid #e2ece9",
                    fontSize: 12.5,
                    color: "#075B55",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <Zap size={14} style={{ color: "#10B8A6" }} />
                  <span>Verified Captain Coverage</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .services-layout-split {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
