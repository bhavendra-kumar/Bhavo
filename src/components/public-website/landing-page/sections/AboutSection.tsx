"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Leaf,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Cpu,
  Zap,
  Award,
  HeartHandshake,
  Compass,
} from "lucide-react";

type PillarId = "mission" | "transparency" | "sustainability" | "community";

interface Pillar {
  id: PillarId;
  label: string;
  tag: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  bulletPoints: string[];
  spotlightTag: string;
  spotlightTitle: string;
  spotlightDesc: string;
  spotlightPill: string;
}

const PILLARS: Pillar[] = [
  {
    id: "mission",
    label: "Our Mission",
    tag: "Commute on Autopilot",
    icon: Clock,
    title: "Ending Daily Commute Anxiety for Urban Riders",
    description:
      "BHAVO was founded on a simple realization: city professionals and students shouldn't have to endure a chaotic, high-stress booking lottery every morning. By turning recurring weekday travel into automated, pre-dispatched occurrences, we restore peace of mind to daily routines.",
    bulletPoints: [
      "Fixed route memory with zero daily re-booking taps",
      "Automated occurrence dispatch ahead of travel windows",
      "Guaranteed vehicle assignment with dedicated verified captains",
    ],
    spotlightTag: "Commute Autopilot",
    spotlightTitle: "Set Once, Ride Daily",
    spotlightDesc: "Eliminating the morning scramble with scheduled route dispatch boundaries.",
    spotlightPill: "Automated Dispatch Engine",
  },
  {
    id: "transparency",
    label: "Fair Pricing",
    tag: "Server-Authoritative Pricing",
    icon: ShieldCheck,
    title: "Server-Authoritative Pricing with No Hidden Multipliers",
    description:
      "We believe that fair travel requires deterministic math, not predatory algorithms that exploit rainstorms or rush hours. Every fare in BHAVO is computed strictly on our server with crystal-clear distance and duration parameters that never inflate unexpectedly.",
    bulletPoints: [
      "Upfront flat fare guarantee before you confirm your ride",
      "Shielded commute subscriptions with zero surge penalties",
      "Full digital itemization with driver earnings transparency",
    ],
    spotlightTag: "Deterministic Pricing",
    spotlightTitle: "Predictable Fares",
    spotlightDesc: "Server-calculated rates based strictly on verified trip distance and duration.",
    spotlightPill: "Upfront Fare Guarantee",
  },
  {
    id: "sustainability",
    label: "Eco Fleet",
    tag: "Green Corridors",
    icon: Leaf,
    title: "Accelerating the Transition to Zero-Emission Urban Fleets",
    description:
      "Urban mobility must be sustainable. BHAVO prioritizes electric vehicles (EVs) across our hatchback, sedan, and auto categories. Combined with smart corridor batching that eliminates empty return deadheads, we actively minimize city emissions.",
    bulletPoints: [
      "Rapidly expanding electric two-wheeler and four-wheeler fleets",
      "Corridor clustering algorithm to eliminate deadhead return miles",
      "Eco-optimized routes designed to cut transit idling across major avenues",
    ],
    spotlightTag: "Green Mobility",
    spotlightTitle: "Electric Fleet Priority",
    spotlightDesc: "Smart corridor batching and EV deployment to cut urban transit emissions.",
    spotlightPill: "Zero-Emission Commitment",
  },
  {
    id: "community",
    label: "Driver Dignity",
    tag: "Captain Welfare",
    icon: Users,
    title: "Treating Drivers as Valued Partners, Not Commodities",
    description:
      "A great passenger ride begins with a respected, unstressed captain. Unlike legacy platforms that impose punitive acceptance quotas and arbitrary deactivations, BHAVO offers guaranteed recurring batches, fair platform margins, and instant settlements.",
    bulletPoints: [
      "Instant same-day shift payouts directly to verified bank accounts",
      "Opt-in ride preferences including pet-friendly certified travel",
      "Human-supported appeals and responsive captain care desk",
    ],
    spotlightTag: "Captain Integrity",
    spotlightTitle: "Partner-First Ecosystem",
    spotlightDesc: "Sustainable driver earnings, direct corridor matching, and dedicated support.",
    spotlightPill: "Respectful Partnerships",
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Surge-Free Guarantee",
    desc: "Fixed deterministic fares calculated on the server with zero unexpected surge multipliers.",
  },
  {
    icon: Clock,
    title: "Commute Autopilot",
    desc: "Recurring weekday rides materialized ahead of departure without manual morning re-booking.",
  },
  {
    icon: HeartHandshake,
    title: "Pet-Friendly Fleet",
    desc: "Selective opt-in driver matching so domestic pets and owners travel safely without refusal.",
  },
  {
    icon: Compass,
    title: "Direct Settlements",
    desc: "Transparent platform fees and instant same-day captain payouts with zero delays.",
  },
];

const COMPARISON_ROWS = [
  {
    category: "Peak Hour Fares",
    traditional: "Unpredictable surge pricing spikes during rain or high demand",
    bhavo: "Server-authoritative fixed fares with guaranteed surge-free commutes",
  },
  {
    category: "Weekday Commutes",
    traditional: "Manual app scramble every morning with unpredictable ETAs",
    bhavo: "Autopilot dispatch: set once, occurrences generate automatically",
  },
  {
    category: "Pet Accommodations",
    traditional: "Frequent driver refusals, cancellation fees, and friction",
    bhavo: "Dedicated 'Pet-Friendly' filter with 100% opted-in certified captains",
  },
  {
    category: "Driver Economics",
    traditional: "High platform take rates, penalty quotas, and delayed weekly payouts",
    bhavo: "Transparent platform fees, corridor chaining, and instant settlements",
  },
  {
    category: "Vehicle Tracking",
    traditional: "Rough approximate map updates with frequent GPS drift",
    bhavo: "Sub-meter telemetry with real-time waypoint progression",
  },
];

export default function AboutSection() {
  const [activePillar, setActivePillar] = useState<PillarId>("mission");
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const currentPillar = PILLARS.find((p) => p.id === activePillar) || PILLARS[0];
  const PillarIcon = currentPillar.icon;

  return (
    <section
      id="about"
      style={{
        background: "#F5F8F7",
        padding: "72px 24px 80px",
        scrollMarginTop: 80,
        position: "relative",
        borderTop: "1px solid #e2ece9",
        borderBottom: "1px solid #e2ece9",
        overflow: "hidden",
      }}
    >
      {/* Subtle ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(16, 184, 166, 0.08) 0%, rgba(245, 248, 247, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Section Header */}
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
            <span>About BHAVO Mobility</span>
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
            Rethinking Daily Urban Mobility from the Ground Up
          </h2>

          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
            BHAVO was engineered to replace erratic hailing games with guaranteed punctuality,
            server-authoritative pricing fairness, and genuine respect for both passengers and drivers.
          </p>
        </div>

        {/* 4 Core Architectural Principles (Zero synthetic metrics) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginBottom: 44,
          }}
        >
          {PRINCIPLES.map((pr, i) => {
            const Icon = pr.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2ece9",
                  borderRadius: 20,
                  padding: "24px 22px",
                  boxShadow: "0 4px 16px rgba(7, 91, 85, 0.04)",
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
                    {pr.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.55 }}>
                    {pr.desc}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Mission & Core Pillars Tabs */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2ece9",
            borderRadius: 28,
            boxShadow: "0 14px 40px rgba(7, 91, 85, 0.07)",
            padding: "36px 32px",
            marginBottom: 44,
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
            {PILLARS.map((p) => {
              const isActive = activePillar === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePillar(p.id)}
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
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Content Display with Smooth Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPillar.id}
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
              className="about-pillar-layout"
            >
              {/* Left Column: Description & Bullet Points */}
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
                    {currentPillar.tag}
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
                  {currentPillar.title}
                </h3>

                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "0 0 24px" }}>
                  {currentPillar.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {currentPillar.bulletPoints.map((b, idx) => (
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
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual Infographic Feature Card (No numerical metrics) */}
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
                  <PillarIcon size={32} />
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
                  {currentPillar.spotlightTag}
                </div>

                <div style={{ fontSize: 24, fontWeight: 900, color: "#142B29", lineHeight: 1.2, marginBottom: 10 }}>
                  {currentPillar.spotlightTitle}
                </div>

                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 auto 20px", lineHeight: 1.6, maxWidth: 300 }}>
                  {currentPillar.spotlightDesc}
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
                  <span>{currentPillar.spotlightPill}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Interactive Comparison Accordion: Traditional Hailing vs The BHAVO Way */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2ece9",
            borderRadius: 24,
            padding: "28px 32px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setShowComparison(!showComparison)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(7, 91, 85, 0.08)",
                  color: "#075B55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Award size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#142B29", margin: 0 }}>
                  The BHAVO Standard vs. Legacy Aggregators
                </h4>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                  Click to explore how our deterministic architecture compares to traditional ride apps.
                </p>
              </div>
            </div>

            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#075B55",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{showComparison ? "Collapse Table" : "View Comparison"}</span>
              <motion.span
                animate={{ rotate: showComparison ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "inline-block" }}
              >
                ▼
              </motion.span>
            </button>
          </div>

          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: "hidden", marginTop: 24 }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2ece9" }}>
                        <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Feature
                        </th>
                        <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "#ef4444", textTransform: "uppercase" }}>
                          Legacy Ride Aggregators
                        </th>
                        <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "#075B55", textTransform: "uppercase" }}>
                          The BHAVO Way
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_ROWS.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px", fontSize: 13.5, fontWeight: 700, color: "#142B29" }}>
                            {row.category}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <XCircle size={15} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />
                              <span>{row.traditional}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#075B55", fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <CheckCircle2 size={15} style={{ color: "#10B8A6", marginTop: 2, flexShrink: 0 }} />
                              <span>{row.bhavo}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Call to Action strip */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            padding: "20px 24px",
            background: "linear-gradient(135deg, rgba(7, 91, 85, 0.04) 0%, rgba(16, 184, 166, 0.07) 100%)",
            borderRadius: 18,
            border: "1px solid #ccfbf1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Cpu size={22} style={{ color: "#075B55" }} />
            <span style={{ fontSize: 14, color: "#142B29", fontWeight: 700 }}>
              Ready to experience modern, automated city travel?
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/user/book-ride"
              style={{
                background: "linear-gradient(135deg, #075B55 0%, #0d9488 100%)",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 10,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 12px rgba(7, 91, 85, 0.2)",
              }}
            >
              <span>Start Riding</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/driver/signup"
              style={{
                background: "#ffffff",
                color: "#075B55",
                fontSize: 13.5,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 10,
                textDecoration: "none",
                border: "1px solid #ccfbf1",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>Drive With Us</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-pillar-layout {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
