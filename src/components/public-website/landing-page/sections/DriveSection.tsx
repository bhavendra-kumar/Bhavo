"use client";

import Link from "next/link";
import { FileCheck, ShieldCheck, Car, ArrowRight, UserCheck, Sparkles } from "lucide-react";

export default function DriveSection() {
  const steps = [
    {
      icon: FileCheck,
      title: "1. Register & Upload Documents",
      desc: "Provide your commercial or personal driving license, vehicle registration (RC), and active insurance documents via our digital onboarding form.",
    },
    {
      icon: ShieldCheck,
      title: "2. Compliance & Verification Review",
      desc: "Our verification team validates each document for validity and compliance before approving your driver account to maintain passenger safety.",
    },
    {
      icon: Car,
      title: "3. Go On Duty & Accept Trips",
      desc: "Access your dedicated Captain console to toggle online duty, receive nearby everyday ride requests, and view scheduled commute occurrences.",
    },
  ];

  return (
    <section
      id="drive"
      style={{
        background: "#ffffff",
        padding: "56px 24px 60px",
        scrollMarginTop: 80,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="drive-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 36,
            alignItems: "center",
          }}
        >
          {/* Left Column: Onboarding Steps */}
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
              <span>Driver Partner Network</span>
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
              Drive with BHAVO. Built on Fairness and Compliance.
            </h2>

            <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.65, margin: "0 0 36px" }}>
              Join a structured mobility network. We connect verified drivers with everyday riders and scheduled weekday commuters through transparent dispatch and a dedicated driver portal.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
              {steps.map((st, i) => {
                const Icon = st.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 18,
                      background: "#F5F8F7",
                      border: "1px solid #e2ece9",
                      borderRadius: 18,
                      padding: "20px 22px",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#075B55",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#142B29",
                          margin: "0 0 6px",
                        }}
                      >
                        {st.title}
                      </h4>
                      <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/signup?role=driver"
                style={{
                  background: "#075B55",
                  color: "#ffffff",
                  padding: "15px 30px",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.2s ease",
                  boxShadow: "0 4px 16px rgba(7, 91, 85, 0.25)",
                }}
              >
                <span>Become a Driver</span>
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/login?role=driver"
                style={{
                  background: "#F5F8F7",
                  color: "#142B29",
                  border: "1.5px solid #d5e5e2",
                  padding: "14px 24px",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UserCheck size={16} />
                <span>Driver Sign-In</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Driver Compliance Card Visual */}
          <div>
            <div
              style={{
                background: "#F5F8F7",
                border: "1.5px solid #e2ece9",
                borderRadius: 28,
                padding: "36px 32px",
                position: "relative",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: 24,
                  border: "1px solid #e2ece9",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#142B29" }}>
                    Driver Onboarding Requirements
                  </span>
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
                    Mandatory
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#475569" }}>
                    <span style={{ color: "#075B55", fontWeight: "bold" }}>✓</span>
                    <span>Valid Motor Driving License</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#475569" }}>
                    <span style={{ color: "#075B55", fontWeight: "bold" }}>✓</span>
                    <span>Vehicle Registration Certificate (RC)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#475569" }}>
                    <span style={{ color: "#075B55", fontWeight: "bold" }}>✓</span>
                    <span>Active Commercial or Comprehensive Vehicle Insurance</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#475569" }}>
                    <span style={{ color: "#075B55", fontWeight: "bold" }}>✓</span>
                    <span>Optional: Pet-Friendly Vehicle Registration</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: "16px 20px",
                  border: "1px solid #e2ece9",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <ShieldCheck size={24} style={{ color: "#075B55", flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  Account activation is granted upon complete verification by BHAVO compliance officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .drive-layout {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
