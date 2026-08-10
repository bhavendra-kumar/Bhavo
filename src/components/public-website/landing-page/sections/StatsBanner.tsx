"use client";

import { useInView } from "../hooks";
import { STATS } from "../constants";

export default function StatsBanner() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      style={{ background: "#0f172a", padding: "80px 24px" }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          textAlign: "center",
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(24px)",
              transition: `all 0.6s ${i * 0.1}s ease`,
            }}
          >
            <div
              style={{
                fontSize: "clamp(36px, 4vw, 56px)",
                fontWeight: 900,
                color: "#14b8a6",
                letterSpacing: "-1.5px",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#64748b",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginTop: 10,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
