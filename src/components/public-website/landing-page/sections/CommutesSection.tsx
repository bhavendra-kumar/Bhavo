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
          <div className="commutes-text-col">
            <div
              className="commutes-kicker-badge"
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
              className="commutes-heading"
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

            <p className="commutes-subheading" style={{ fontSize: 16, color: "#475569", lineHeight: 1.65, margin: "0 0 36px" }}>
              Eliminate daily booking stress. Configure your recurring commute schedule once, and BHAVO authoritatively generates your upcoming weekday rides ahead of time.
            </p>

            {/* 3 Steps */}
            <div className="commutes-steps-list" style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
              {steps.map((st) => (
                <div
                  key={st.num}
                  className="commutes-step-card"
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
                    className="commutes-step-num"
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
                    <h3 className="commutes-step-title" style={{ fontSize: 16, fontWeight: 700, color: "#142B29", margin: "0 0 6px" }}>
                      {st.title}
                    </h3>
                    <p className="commutes-step-desc" style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="commutes-cta-group" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/user/my-commute"
                className="commutes-primary-btn"
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
              <span className="commutes-hint" style={{ fontSize: 13, color: "#64748b" }}>
                Pause, resume, or modify upcoming occurrences anytime.
              </span>
            </div>
          </div>

          {/* Right Column: Visual Commute Schedule Preview (Animatic Simulation) */}
          <div className="commutes-animatic-col">
            <CommuteScheduleAnimatic />
          </div>
        </div>
      </div>

      <style>{`
        /* Native Mobile App Card Layout for mobile screens */
        @media (max-width: 960px) {
          #commutes {
            padding: 48px 16px 52px !important;
          }
          .commutes-layout {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .commutes-heading {
            font-size: clamp(22px, 5.5vw, 28px) !important;
            letter-spacing: -0.6px !important;
            line-height: 1.22 !important;
            margin-bottom: 12px !important;
          }
          .commutes-subheading {
            font-size: 14px !important;
            line-height: 1.55 !important;
            margin-bottom: 24px !important;
          }
          .commutes-steps-list {
            gap: 12px !important;
            margin-bottom: 24px !important;
          }
          .commutes-step-card {
            padding: 14px 16px !important;
            border-radius: 14px !important;
            gap: 14px !important;
          }
          .commutes-step-num {
            width: 34px !important;
            height: 34px !important;
            font-size: 13px !important;
            border-radius: 10px !important;
          }
          .commutes-step-title {
            font-size: 14.5px !important;
            margin-bottom: 4px !important;
          }
          .commutes-step-desc {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
          }
          .commutes-cta-group {
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          .commutes-primary-btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 48px !important;
            font-size: 15px !important;
            border-radius: 14px !important;
            box-sizing: border-box !important;
          }
          .commutes-hint {
            display: block !important;
            text-align: center !important;
            width: 100% !important;
            font-size: 12px !important;
            margin-top: 6px !important;
          }
          .commutes-animatic-col {
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          #commutes {
            padding: 40px 14px 44px !important;
          }
          .commutes-step-card {
            padding: 12px 14px !important;
            gap: 12px !important;
          }
          .commutes-step-num {
            width: 30px !important;
            height: 30px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
