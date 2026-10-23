"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CalendarClock,
  Calculator,
  UserCheck,
  HeartHandshake,
  Headphones,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";

type DifferentiatorId = "pricing" | "automation" | "compliance" | "pet" | "support";

interface Differentiator {
  id: DifferentiatorId;
  label: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  bulletPoints: string[];
  spotlightBadge: string;
  spotlightTitle: string;
  spotlightDesc: string;
}

const DIFFERENTIATORS: Differentiator[] = [
  {
    id: "pricing",
    label: "Server-Authoritative Pricing",
    tag: "Fair Math",
    title: "Zero Surge Gouging, Zero Hidden Multipliers",
    description:
      "Unlike conventional mobility platforms that apply opaque surge algorithms during rain or peak hours, BHAVO calculates fares deterministically on our backend server using validated distance, duration, and eligible parameters.",
    icon: Calculator,
    bulletPoints: [
      "100% upfront flat fare lock before booking confirmation",
      "Shielded commute subscriptions with zero surge penalties",
      "Complete itemization with full transparency for rider and driver",
    ],
    spotlightBadge: "Deterministic Fares",
    spotlightTitle: "Transparent Fare Policy",
    spotlightDesc: "Every rupee is calculated on our backend using validated distance and duration metrics.",
  },
  {
    id: "automation",
    label: "Commute Autopilot",
    tag: "Time Freedom",
    title: "Never Scramble for a Morning Ride Again",
    description:
      "Configure your regular work or campus coordinates once. BHAVO automatically generates and dispatches upcoming occurrences ahead of your scheduled window, assigning nearby verified drivers without repetitive daily taps.",
    icon: CalendarClock,
    bulletPoints: [
      "Fixed route memory with zero daily re-booking taps",
      "Pre-window dispatch: nearby captain reserved ahead of time",
      "Pause, resume, or modify upcoming occurrences anytime with ease",
    ],
    spotlightBadge: "Autopilot Engine",
    spotlightTitle: "Predictable Routines",
    spotlightDesc: "Set your weekly schedule once and let our dispatch engine coordinate the rest.",
  },
  {
    id: "compliance",
    label: "Verified Driver Eligibility",
    tag: "Passenger Safety",
    title: "100% Compliant & Document-Verified Captains",
    description:
      "Every captain operating on the BHAVO network must hold an active commercial or personal driving license, vehicle registration (RC), and valid insurance. Our manual compliance desk verifies records before a driver goes on duty.",
    icon: UserCheck,
    bulletPoints: [
      "Mandatory license and vehicle registration document validation",
      "Vehicle fitness inspections and clean safety records",
      "Secure 4-digit PIN OTP verification before every passenger boarding",
    ],
    spotlightBadge: "Strict Compliance",
    spotlightTitle: "Safety by Design",
    spotlightDesc: "Rigorous onboarding ensures only trustworthy, verified drivers operate on the network.",
  },
  {
    id: "pet",
    label: "Pet-Friendly Travel",
    tag: "Inclusive Mobility",
    title: "Travel with Companion Animals Without Friction",
    description:
      "Pets are family. BHAVO allows riders to opt into pet-friendly travel directly when booking, matching exclusively with drivers whose vehicle specifications accommodate companion pets respectfully and safely.",
    icon: HeartHandshake,
    bulletPoints: [
      "Dedicated opt-in filter with 100% pet-certified captains",
      "Protective seat covers and clean climate-controlled cabins",
      "Zero extra surcharge during regular booking",
    ],
    spotlightBadge: "Pet Certified",
    spotlightTitle: "Comfort for All",
    spotlightDesc: "No awkward negotiations or cancellations — just welcoming, pet-safe travel.",
  },
  {
    id: "support",
    label: "Responsive Care & Support",
    tag: "Human First",
    title: "Real Human Support When You Need It",
    description:
      "We replace endless bot loops with dedicated operational staff. Whether clarifying a route query, managing a lost item, or resolving a fare question, our care desk is accessible directly in the app.",
    icon: Headphones,
    bulletPoints: [
      "In-app ticketing with direct ticket resolution tracking",
      "Fast response times during active operating hours",
      "Dedicated support lines for both riders and driver partners",
    ],
    spotlightBadge: "Human Care Desk",
    spotlightTitle: "Always Within Reach",
    spotlightDesc: "Get direct answers and real resolutions from our dedicated operations team.",
  },
];

const ARCHITECTURAL_PILLARS = [
  {
    icon: Calculator,
    title: "Server Authoritative",
    desc: "Deterministic math computes exact upfront fares without predatory surge algorithms.",
  },
  {
    icon: CalendarClock,
    title: "Scheduled Autopilot",
    desc: "Automated occurrence generation delivers dependable recurring rides on time.",
  },
  {
    icon: UserCheck,
    title: "Verified Captains",
    desc: "Rigorous manual review of license, registration, and insurance documents.",
  },
  {
    icon: TrendingUp,
    title: "Partner Dignity",
    desc: "Fair platform margins, instant same-day settlements, and zero penalty quotas.",
  },
];

export default function WhyBhavoSection() {
  const [activeTab, setActiveTab] = useState<DifferentiatorId>("pricing");
  const currentDiff = DIFFERENTIATORS.find((d) => d.id === activeTab) || DIFFERENTIATORS[0];
  const CurrentIcon = currentDiff.icon;

  return (
    <section
      id="why-bhavo"
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
            <span>Why Choose BHAVO</span>
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
            Engineered for Reliability, Built on Mutual Respect
          </h2>

          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
            We stripped away arbitrary surge multipliers, phantom driver cancellations, and high take rates.
            Here is why everyday passengers and drivers choose BHAVO.
          </p>
        </div>

        {/* 4 Architectural Principles Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginBottom: 44,
          }}
        >
          {ARCHITECTURAL_PILLARS.map((p, i) => {
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

        {/* Interactive Feature Deep-Dive Card */}
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
            {DIFFERENTIATORS.map((d) => {
              const isActive = activeTab === d.id;
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveTab(d.id)}
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
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content Display with Smooth Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDiff.id}
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
              className="why-layout-split"
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
                    {currentDiff.tag}
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
                  {currentDiff.title}
                </h3>

                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "0 0 24px" }}>
                  {currentDiff.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {currentDiff.bulletPoints.map((b, idx) => (
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

              {/* Right Column: Visual Infographic Feature Card */}
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
                  {currentDiff.spotlightBadge}
                </div>

                <div style={{ fontSize: 22, fontWeight: 900, color: "#142B29", lineHeight: 1.25, marginBottom: 10 }}>
                  {currentDiff.spotlightTitle}
                </div>

                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 auto 20px", lineHeight: 1.6, maxWidth: 300 }}>
                  {currentDiff.spotlightDesc}
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
                  <span>Platform Standard Guaranteed</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA Action Strip */}
        <div
          style={{
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
            <Award size={22} style={{ color: "#075B55" }} />
            <span style={{ fontSize: 14, color: "#142B29", fontWeight: 700 }}>
              Join thousands of daily riders choosing predictable, surge-free travel.
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
              <span>Book a Ride</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/user/my-commute"
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
              <span>Schedule Commute</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .why-layout-split {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
