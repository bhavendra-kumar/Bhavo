"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Shield,
  Lock,
  Scale,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Zap,
} from "lucide-react";

type PolicyTab = "terms" | "privacy" | "fares" | "compliance";

interface PolicySectionData {
  id: PolicyTab;
  label: string;
  tag: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  title: string;
  summary: string;
  clauses: { title: string; desc: string }[];
  spotlightBadge: string;
  spotlightTitle: string;
  spotlightDesc: string;
}

const POLICIES: PolicySectionData[] = [
  {
    id: "terms",
    label: "Terms of Service",
    tag: "Platform Agreement",
    icon: FileText,
    title: "Platform Rules, Trip Agreements & Passenger Conduct",
    summary:
      "BHAVO operates as a technology coordination platform connecting riders requesting passenger transport with independent drivers operating verified motor vehicles.",
    clauses: [
      {
        title: "1.1 Platform Scope & Neutral Technology",
        desc: "BHAVO facilitates connections between registered riders and verified captains. Individual ride bookings and recurring commute schedules represent transportation arrangements coordinated through our digital dispatch system.",
      },
      {
        title: "1.2 Commute Occurrence Dispatch",
        desc: "Recurring commute schedules generate individual trip occurrences within configured operational windows. Riders may pause, modify, or cancel upcoming occurrences directly in the application before dispatch matching begins.",
      },
      {
        title: "1.3 Mutual Respect & Code of Conduct",
        desc: "Passengers and captains agree to treat each other respectfully. Aggressive behavior, harassment, or violation of municipal traffic regulations will result in immediate suspension from the network.",
      },
    ],
    spotlightBadge: "Fair Agreement",
    spotlightTitle: "Clear User Terms",
    spotlightDesc: "Plain-language terms designed to protect riders and drivers with complete transparency.",
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    tag: "Data Protection",
    icon: Lock,
    title: "How We Safeguard Your Personal Data & Location Telemetry",
    summary:
      "We believe privacy is a fundamental right. Your coordinates, trip history, and contact credentials are cryptographically protected and never sold to third-party ad networks.",
    clauses: [
      {
        title: "2.1 Real-Time Location Telemetry",
        desc: "GPS coordinates are accessed strictly during active ride search, waypoint progress, and safety monitoring. Background location is never tracked when the app is inactive.",
      },
      {
        title: "2.2 Cryptographic Data Sanitization",
        desc: "Sensitive authentication tokens and payment credentials are encrypted in transit and at rest. System logs and telemetry traces are sanitized to ensure zero leakage of private data.",
      },
      {
        title: "2.3 Zero Third-Party Advertising",
        desc: "BHAVO does not monetize passenger travel histories, commute routines, or behavioral data through third-party ad exchanges or data brokers.",
      },
    ],
    spotlightBadge: "Privacy First",
    spotlightTitle: "Zero Ad Tracking",
    spotlightDesc: "Your travel data exists solely to power accurate routing and safe ride dispatch.",
  },
  {
    id: "fares",
    label: "Fare & Settlement Policy",
    tag: "Pricing Integrity",
    icon: Scale,
    title: "Server-Authoritative Pricing & Flat Commute Guarantee",
    summary:
      "Every fare on BHAVO is computed strictly on our backend server based on verified route distance, duration, and eligible parameters before you confirm.",
    clauses: [
      {
        title: "3.1 Upfront Flat Rate Guarantee",
        desc: "The fare displayed at confirmation is deterministic. There are no sudden dynamic surge multipliers, hidden booking charges, or unexpected invoice revisions upon trip completion.",
      },
      {
        title: "3.2 Scheduled Commute Fare Lock",
        desc: "Recurring weekday commute subscribers enjoy locked base rates immune to rainstorms, peak office hours, or regional traffic congestion.",
      },
      {
        title: "3.3 Transparent Driver Remittance",
        desc: "Platform service margins are fixed and transparent. Drivers receive instant same-day settlements with zero arbitrary deductions or penalty withholdings.",
      },
    ],
    spotlightBadge: "Deterministic Pricing",
    spotlightTitle: "Zero Surge Gouging",
    spotlightDesc: "Server-verified math guarantees honest pricing for passengers and fair earnings for captains.",
  },
  {
    id: "compliance",
    label: "Safety & Compliance",
    tag: "Safety Standard",
    icon: Shield,
    title: "Driver Document Verification & Vehicle Standards",
    summary:
      "Passenger safety is built into our software architecture through mandatory document validation, single-use OTP verification, and vehicle fitness guidelines.",
    clauses: [
      {
        title: "4.1 Multi-Point Document Review",
        desc: "Captains must upload active driving licenses, vehicle registration certificates (RC), and valid insurance policies. Each document is manually verified by compliance staff before duty activation.",
      },
      {
        title: "4.2 Secure 4-Digit OTP Authentication",
        desc: "Trips cannot begin until the rider provides their unique 4-digit boarding OTP. This ensures the correct passenger enters the assigned vehicle every single time.",
      },
      {
        title: "4.3 Pet-Friendly Travel Certification",
        desc: "Captains offering pet rides must formally opt in and maintain vehicle protective covers, ensuring clean, welcoming environments for both pets and subsequent passengers.",
      },
    ],
    spotlightBadge: "Safety Architecture",
    spotlightTitle: "Verified Captains",
    spotlightDesc: "Rigorous onboarding and authentication ensure passenger peace of mind on every journey.",
  },
];

const POLICY_PILLARS = [
  {
    icon: Scale,
    title: "Zero Hidden Multipliers",
    desc: "Upfront deterministic fares calculated on the backend before booking confirmation.",
  },
  {
    icon: Lock,
    title: "Telemetry Privacy",
    desc: "Location data processed solely during active trips with cryptographic safeguards.",
  },
  {
    icon: Shield,
    title: "Verified Documentation",
    desc: "Mandatory manual verification of driver licenses, vehicle RC, and active insurance.",
  },
  {
    icon: AlertCircle,
    title: "Human Support Desk",
    desc: "Direct access to our operational team for fare queries, lost property, and feedback.",
  },
];

export default function TermsSection() {
  const [activePolicy, setActivePolicy] = useState<PolicyTab>("terms");
  const currentPolicy = POLICIES.find((p) => p.id === activePolicy) || POLICIES[0];
  const PolicyIcon = currentPolicy.icon;

  return (
    <section
      id="terms-policies"
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
            <span>Terms & Compliance Policies</span>
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
            Clear Rules, Open Privacy & Full Operational Transparency
          </h2>

          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
            We believe legal policies should be straightforward, fair, and protective of both passenger rights
            and captain safety.
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
          {POLICY_PILLARS.map((p, i) => {
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

        {/* Interactive Policy Tabs Container */}
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
            {POLICIES.map((p) => {
              const isActive = activePolicy === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePolicy(p.id)}
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

          {/* Active Policy Content Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPolicy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: 40,
                alignItems: "flex-start",
              }}
              className="policy-layout-split"
            >
              {/* Left Column: Clauses */}
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
                    {currentPolicy.tag}
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
                  {currentPolicy.title}
                </h3>

                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "0 0 28px" }}>
                  {currentPolicy.summary}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {currentPolicy.clauses.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#F5F8F7",
                        border: "1px solid #e2ece9",
                        borderRadius: 16,
                        padding: "18px 20px",
                      }}
                    >
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "#142B29", margin: "0 0 8px" }}>
                        {c.title}
                      </h4>
                      <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>
                        {c.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual Summary Spotlight Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(7, 91, 85, 0.05) 0%, rgba(16, 184, 166, 0.1) 100%)",
                  border: "1.5px solid #ccfbf1",
                  borderRadius: 22,
                  padding: "36px 30px",
                  textAlign: "center",
                  boxShadow: "0 8px 30px rgba(7, 91, 85, 0.06)",
                  position: "sticky",
                  top: 100,
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
                  <PolicyIcon size={32} />
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
                  {currentPolicy.spotlightBadge}
                </div>

                <div style={{ fontSize: 22, fontWeight: 900, color: "#142B29", lineHeight: 1.25, marginBottom: 10 }}>
                  {currentPolicy.spotlightTitle}
                </div>

                <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 auto 20px", lineHeight: 1.6, maxWidth: 300 }}>
                  {currentPolicy.spotlightDesc}
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
                  <span>Enforced Across All Trips</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Contact / Inquiries Strip */}
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
            <HelpCircle size={22} style={{ color: "#075B55" }} />
            <span style={{ fontSize: 14, color: "#142B29", fontWeight: 700 }}>
              Have questions regarding specific platform terms or data policies?
            </span>
          </div>

          <Link
            href="/contact"
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
            <span>Contact Legal & Support Desk</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .policy-layout-split {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
