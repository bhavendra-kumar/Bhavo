"use client";

import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import PetFriendlyAnimatic from "./PetFriendlyAnimatic";

export default function PetRidesSection() {
  const highlights = [
    {
      title: "Pet-Friendly Driver Matching",
      desc: "Our dispatch system specifically pairs you with driver captains who have opted in and registered pet-compatible vehicles.",
    },
    {
      title: "Simple One-Tap Toggle",
      desc: "Enable the 'Pet-Friendly' toggle directly on your booking form. Your ride fare automatically includes transparent pet travel parameters.",
    },
    {
      title: "Comfortable, Safe Space",
      desc: "Designed for small-to-medium domestic pets traveling alongside their owners, ensuring a stress-free journey for both rider and pet.",
    },
  ];

  return (
    <section
      id="pet-rides"
      style={{
        background: "#ffffff",
        padding: "56px 24px 60px",
        scrollMarginTop: 80,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="pet-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 36,
            alignItems: "center",
          }}
        >
          {/* Left Column: Interactive Pet Friendly Animatic Motif */}
          <div>
            <PetFriendlyAnimatic />
          </div>

          {/* Right Column: Copy & Actions */}
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
              <span>Inclusive Pet Mobility</span>
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
              Bring Your Pets Along on Every Journey
            </h2>

            <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.65, margin: "0 0 32px" }}>
              We know pets are family. BHAVO allows you to opt into pet-friendly travel directly when booking, connecting you with accommodating drivers without uncertainty.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 36 }}>
              {highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#075B55",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Check size={14} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#142B29", margin: "0 0 4px" }}>
                      {h.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                      {h.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/user/book-ride"
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
                <span>Book a Pet-Friendly Ride</span>
                <ArrowRight size={16} />
              </Link>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Select the Pet Ride toggle during booking.
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .pet-layout {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
