"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  UserCheck,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  KeyRound,
  Zap,
} from "lucide-react";

type FlowPerspective = "rider" | "captain";

interface StepDetail {
  number: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  highlight: string;
  featurePill: string;
}

const RIDER_STEPS: StepDetail[] = [
  {
    number: "01",
    title: "Configure Route & Routine Preferences",
    desc: "Input your pickup and destination coordinates. Select vehicle preference, optionally enable the pet-friendly travel filter, or set recurring weekdays for commute autopilot.",
    icon: Compass,
    highlight: "Deterministic Server Pricing",
    featurePill: "Instant or Scheduled",
  },
  {
    number: "02",
    title: "Intelligent Pre-Window Captain Matching",
    desc: "BHAVO's dispatch engine searches active-duty, compliant captains within your geographic sector, matching verified drivers who meet your specific vehicle and pet criteria.",
    icon: UserCheck,
    highlight: "Active Document Compliance",
    featurePill: "Zero Cancellation Bias",
  },
  {
    number: "03",
    title: "Sub-Meter Telemetry & Secure OTP Start",
    desc: "Follow your driver's real-time approach on the map. Verify boarding with a secure 4-digit PIN OTP, enjoy a smooth ride, and settle your flat upfront fare upon arrival.",
    icon: Navigation,
    highlight: "Live Waypoint Progress",
    featurePill: "Secure OTP Authentication",
  },
];

const CAPTAIN_STEPS: StepDetail[] = [
  {
    number: "01",
    title: "Toggle Online Duty & Set Preferred Zones",
    desc: "Open your dedicated Captain console, perform your daily vehicle safety checklist, and toggle duty mode active to enter the regional dispatch pool.",
    icon: Car,
    highlight: "Flexible Operational Hours",
    featurePill: "1-Tap Duty Toggle",
  },
  {
    number: "02",
    title: "Accept High-Yield Corridors & Commutes",
    desc: "Receive nearby point-to-point ride requests and recurring morning commute batches along your habitual travel corridor, eliminating unpaid return miles.",
    icon: Zap,
    highlight: "Guaranteed Upfront Net Pay",
    featurePill: "Corridor Chaining",
  },
  {
    number: "03",
    title: "Complete Trip & Receive Direct Settlement",
    desc: "Enter the rider's boarding OTP, follow optimized live turn-by-turn guidance, and enjoy direct same-day earnings deposited straight to your bank account.",
    icon: KeyRound,
    highlight: "Zero Commission Penalties",
    featurePill: "Immediate Payout",
  },
];

const WORKFLOW_PILLARS = [
  {
    icon: ShieldCheck,
    title: "Server Authoritative",
    desc: "Fares, routes, and dispatch constraints are calculated deterministically on the server.",
  },
  {
    icon: Clock,
    title: "Pre-Window Dispatch",
    desc: "Automated commute occurrences assign nearby captains ahead of departure time.",
  },
  {
    icon: KeyRound,
    title: "OTP-Secured Trips",
    desc: "Every passenger trip begins only after authenticating a unique single-use 4-digit code.",
  },
  {
    icon: CheckCircle2,
    title: "Verified Documentation",
    desc: "All drivers undergo manual document validation including license, RC, and insurance.",
  },
];

export default function HowItWorksSection() {
  const [perspective, setPerspective] = useState<FlowPerspective>("rider");
  const steps = perspective === "rider" ? RIDER_STEPS : CAPTAIN_STEPS;

  return (
    <section
      id="how-it-works"
      style={{
        background: "#F5F8F7",
        padding: "72px 24px 80px",
        scrollMarginTop: 80,
        position: "relative",
        borderTop: "1px solid #e2ece9",
        borderBottom: "1px solid #e2ece9",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Section Header with Eyebrow Pill */}
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
            <span>How BHAVO Works</span>
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
            Simple, Transparent, and Predictable Workflows
          </h2>

          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
            From single spontaneous bookings to automated recurring commute subscriptions,
            explore how BHAVO coordinates urban travel seamlessly.
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
          {WORKFLOW_PILLARS.map((p, i) => {
            const Icon = p.icon;
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

        {/* Perspective Toggle: Rider Experience vs Captain Workflow */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "#ffffff",
              padding: 4,
              borderRadius: 14,
              border: "1px solid #e2ece9",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <button
              type="button"
              onClick={() => setPerspective("rider")}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: perspective === "rider" ? "#075B55" : "transparent",
                color: perspective === "rider" ? "#ffffff" : "#64748b",
                fontWeight: perspective === "rider" ? 800 : 600,
                fontSize: 13.5,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Passenger Workflow
            </button>
            <button
              type="button"
              onClick={() => setPerspective("captain")}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: perspective === "captain" ? "#075B55" : "transparent",
                color: perspective === "captain" ? "#ffffff" : "#64748b",
                fontWeight: perspective === "captain" ? 800 : 600,
                fontSize: 13.5,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Captain Workflow
            </button>
          </div>
        </div>

        {/* 3 Interactive Workflow Cards with Smooth Motion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={perspective}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              marginBottom: 44,
            }}
            className="how-steps-grid"
          >
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.number}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2ece9",
                    borderRadius: 24,
                    padding: "36px 30px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    boxShadow: "0 6px 24px rgba(7, 91, 85, 0.05)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: "#075B55",
                          background: "rgba(16, 184, 166, 0.12)",
                          borderRadius: 12,
                          width: 44,
                          height: 44,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {s.number}
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#075B55",
                          background: "rgba(7, 91, 85, 0.08)",
                          padding: "3px 10px",
                          borderRadius: 99,
                        }}
                      >
                        {s.featurePill}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 800,
                        color: "#142B29",
                        margin: "0 0 12px",
                        lineHeight: 1.3,
                        letterSpacing: "-0.4px",
                      }}
                    >
                      {s.title}
                    </h3>

                    <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.65, margin: 0 }}>
                      {s.desc}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 24,
                      paddingTop: 16,
                      borderTop: "1px solid #f1f5f9",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#075B55",
                    }}
                  >
                    <Icon size={16} style={{ color: "#10B8A6" }} />
                    <span>{s.highlight}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

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
            <Navigation size={22} style={{ color: "#075B55" }} />
            <span style={{ fontSize: 14, color: "#142B29", fontWeight: 700 }}>
              {perspective === "rider"
                ? "Ready to schedule your everyday commute on autopilot?"
                : "Interested in driving on high-yield recurring commute corridors?"}
            </span>
          </div>

          <Link
            href={perspective === "rider" ? "/user/my-commute" : "/driver/signup"}
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
            <span>{perspective === "rider" ? "Schedule a Commute" : "Register as Captain"}</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .how-steps-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </section>
  );
}
