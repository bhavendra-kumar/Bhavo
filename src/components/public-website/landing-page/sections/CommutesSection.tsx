"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import CommuteScheduleAnimatic from "./CommuteScheduleAnimatic";

export default function CommutesSection() {
  const steps = [
    {
      num: "01",
      title: "Set Your Fixed Route",
      desc: "Specify your regular home and office or university coordinates once. Save preferred pickup spots so you never have to re-enter trip addresses.",
    },
    {
      num: "02",
      title: "Select Weekdays & Pickup Time",
      desc: "Select which days your schedule runs (e.g., Monday through Friday) and set your target departure window for morning or evening commutes.",
    },
    {
      num: "03",
      title: "Automated Dispatch Occurrences",
      desc: "BHAVO generates individual trip occurrences automatically ahead of each commute window, matching you with available nearby verified drivers.",
    },
  ];

  return (
    <section
      id="commutes"
      style={{
        background: "#F5F8F7",
        padding: "56px 24px 60px",
        scrollMarginTop: 80,
        position: "relative",
        borderTop: "1px solid #e2ece9",
        borderBottom: "1px solid #e2ece9",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="commutes-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 36,
            alignItems: "center",
          }}
        >
          {/* Left Column: Information & Steps */}
          <div>
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
              <span>Signature Commute Capability</span>
            </div>

            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 900,
                color: "#142B29",
                letterSpacing: "-1px",
                lineHeight: 1.15,
                margin: "0 0 16px",
              }}
            >
              Daily Commutes on Autopilot for Students & Professionals
            </h2>

            <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.65, margin: "0 0 36px" }}>
              Eliminate daily booking stress. Configure your recurring commute schedule once, and BHAVO authoritatively generates your upcoming weekday rides ahead of time.
            </p>

            {/* 3 Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
              {steps.map((st) => (
                <div
                  key={st.num}
                  style={{
                    display: "flex",
                    gap: 18,
                    background: "#ffffff",
                    border: "1px solid #e2ece9",
                    borderRadius: 18,
                    padding: "20px 22px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#075B55",
                      background: "rgba(16, 184, 166, 0.12)",
                      borderRadius: 12,
                      width: 38,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {st.num}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#142B29", margin: "0 0 6px" }}>
                      {st.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/user/my-commute"
                style={{
                  background: "linear-gradient(135deg, #075B55 0%, #0d9488 100%)",
                  color: "#ffffff",
                  fontSize: 14.5,
                  fontWeight: 700,
                  padding: "13px 26px",
                  borderRadius: 12,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 16px rgba(7, 91, 85, 0.25)",
                }}
              >
                <span>Schedule a Commute</span>
                <ArrowRight size={16} />
              </Link>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Pause, resume, or modify upcoming occurrences anytime.
              </span>
            </div>
          </div>

          {/* Right Column: Visual Commute Schedule Preview (Animatic Simulation) */}
          <div>
            <CommuteScheduleAnimatic />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .commutes-layout {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
