"use client";

import { useState, useEffect } from "react";
import { useInView } from "../hooks";
import { TESTIMONIALS } from "../constants";

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView();

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(
      () => setActive((prev) => (prev + 1) % TESTIMONIALS.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <section
      id="business"
      ref={ref}
      style={{ background: "#0f172a", padding: "100px 24px" }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#14b8a6",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 14,
            opacity: inView ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        >
          Testimonials
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            color: "#f1f5f9",
            letterSpacing: "-1.5px",
            margin: "0 0 64px",
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(24px)",
            transition: "all 0.7s 0.1s ease",
          }}
        >
          Loved by 50,000+ Commuters
        </h2>

        {/* Testimonial card — key forces remount animation on change */}
        <div
          key={active}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 28,
            padding: "48px 56px",
            backdropFilter: "blur(12px)",
            animation: "fadeUp 0.5s ease",
            opacity: inView ? 1 : 0,
            transition: "opacity 0.7s 0.2s ease",
          }}
        >
          {/* Stars */}
          <div style={{ marginBottom: 28, fontSize: 20, color: "#f59e0b" }}>
            {"★".repeat(t.rating)}
          </div>

          <p
            style={{
              fontSize: "clamp(18px, 2.2vw, 24px)",
              color: "#e2e8f0",
              lineHeight: 1.65,
              fontStyle: "italic",
              margin: "0 0 40px",
              fontWeight: 400,
            }}
          >
            &ldquo;{t.quote}&rdquo;
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0d9488, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {t.avatar}
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}
              >
                {t.name}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                {t.role} · {t.company}
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicator */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 28 : 8,
                height: 8,
                borderRadius: 100,
                background:
                  i === active ? "#14b8a6" : "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
