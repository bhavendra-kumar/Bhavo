"use client";

import { useInView } from "../hooks";
import { STEPS } from "../constants";

export default function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      style={{
        background: "linear-gradient(180deg, #f8fffe 0%, #f0fdfa 100%)",
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            Getting Started
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
            Up &amp; Running in Minutes
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 40,
            position: "relative",
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: "calc(16.66% + 24px)",
              right: "calc(16.66% + 24px)",
              height: 2,
              background:
                "linear-gradient(90deg, #0d9488 0%, #14b8a6 50%, #0d9488 100%)",
              opacity: 0.25,
            }}
          />

          {STEPS.map((step, i) => (
            <div
              key={step.number}
              style={{
                textAlign: "center",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(32px)",
                transition: `all 0.7s ${i * 0.15}s ease`,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 28px",
                  boxShadow: "0 8px 32px rgba(13,148,136,0.35)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {step.number}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 12px",
                  letterSpacing: "-0.3px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  lineHeight: 1.7,
                  margin: "0 auto",
                  maxWidth: 280,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
