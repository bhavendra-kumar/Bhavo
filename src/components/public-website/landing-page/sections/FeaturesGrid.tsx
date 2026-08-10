"use client";

import { useState } from "react";
import { useInView } from "../hooks";
import { FEATURES, Feature } from "../constants";

function FeatureCard({
  feat,
  delay,
  inView,
}: {
  feat: Feature;
  delay: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? feat.accent : "#f8fafc",
        borderRadius: 24,
        padding: 32,
        cursor: "pointer",
        transition: "all 0.35s ease",
        boxShadow: hovered
          ? `0 24px 64px ${feat.accent}33`
          : "0 2px 8px rgba(0,0,0,0.04)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transitionDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: hovered ? "rgba(255,255,255,0.2)" : `${feat.accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: hovered ? "#fff" : feat.accent,
          marginBottom: 20,
          transition: "all 0.3s",
        }}
      >
        {feat.icon}
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: hovered ? "#fff" : "#0f172a",
          margin: "0 0 10px",
          letterSpacing: "-0.3px",
          transition: "color 0.3s",
        }}
      >
        {feat.title}
      </h3>
      <p
        style={{
          fontSize: 14,
          color: hovered ? "rgba(255,255,255,0.85)" : "#64748b",
          lineHeight: 1.7,
          margin: 0,
          transition: "color 0.3s",
        }}
      >
        {feat.description}
      </p>
    </div>
  );
}

export default function FeaturesGrid() {
  const { ref, inView } = useInView();

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{ background: "#fff", padding: "100px 24px" }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 72,
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(32px)",
            transition: "all 0.7s ease",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0d9488",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Why Bhavo
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Everything Your Commute Needs
          </h2>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {FEATURES.map((feat, i) => (
            <FeatureCard
              key={feat.title}
              feat={feat}
              delay={i * 0.08}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
