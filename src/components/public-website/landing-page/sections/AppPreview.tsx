"use client";

import { useInView } from "../hooks";

export default function AppPreview() {
  const { ref, inView } = useInView();

  return (
    <section
      id="features"
      ref={ref}
      style={{
        background: "#f1f5f9",
        padding: "100px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        {/* Section header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 72,
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(32px)",
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
            The Platform
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            Experience the Difference
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "#64748b",
              maxWidth: 480,
              margin: "16px auto 0",
              lineHeight: 1.6,
            }}
          >
            A unified ecosystem designed for absolute clarity.
          </p>
        </div>

        {/* Mock UI cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(48px)",
            transition: "all 0.9s 0.2s ease",
          }}
        >
          {/* ── Left: Booking card ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 32,
              boxShadow:
                "0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Map placeholder */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #e6f7f6 0%, #d1fae5 50%, #e0f2fe 100%)",
                borderRadius: 16,
                height: 160,
                marginBottom: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: `${i * 20}%`,
                    height: 1,
                    background: "rgba(13,148,136,0.15)",
                  }}
                />
              ))}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${i * 14.28}%`,
                    width: 1,
                    background: "rgba(13,148,136,0.15)",
                  }}
                />
              ))}
              <svg
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
                viewBox="0 0 400 160"
                preserveAspectRatio="none"
              >
                <path
                  d="M 60 130 C 100 80, 200 110, 280 50 C 320 25, 360 30, 380 20"
                  stroke="#0d9488"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                />
                <circle cx="60" cy="130" r="6" fill="#0d9488" />
                <circle cx="380" cy="20" r="6" fill="#6366f1" />
              </svg>
              <span style={{ fontSize: 28, position: "relative", zIndex: 1 }}>
                🗺️
              </span>
            </div>

            {/* Pickup / Destination rows */}
            {[
              {
                label: "PICKUP",
                value: "124 Tech Campus Blvd",
                color: "#0d9488",
                icon: "●",
              },
              {
                label: "DESTINATION",
                value: "Downtown Transit Hub",
                color: "#6366f1",
                icon: "◆",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <span style={{ color: item.color, fontSize: 10 }}>
                  {item.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#94a3b8",
                      letterSpacing: 1.5,
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            ))}

            <button
              style={{
                width: "100%",
                marginTop: 16,
                background: "linear-gradient(135deg, #0d9488, #0f766e)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(13,148,136,0.3)",
              }}
            >
              Confirm Commute · $14.50
            </button>
          </div>

          {/* ── Right: info cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Upcoming ride */}
            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 28,
                boxShadow:
                  "0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}
                >
                  Upcoming Ride
                </span>
                <span
                  style={{
                    background: "rgba(13,148,136,0.1)",
                    color: "#0d9488",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 100,
                  }}
                >
                  Auto-Booked
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  S
                </div>
                <div>
                  <div
                    style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}
                  >
                    Sarah J. · Premium EV
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                  >
                    Arriving in 12 min · ⭐ 4.9
                  </div>
                </div>
              </div>
            </div>

            {/* AI Smart Route */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d9488, #0f766e)",
                borderRadius: 24,
                padding: 28,
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>⚡</span>
                <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
                  AI Smart Route
                </span>
              </div>
              <p
                style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9, margin: 0 }}
              >
                Heavy traffic detected on I-95. Rerouting via Express Lane
                saves{" "}
                <strong style={{ color: "#99f6e4" }}>14 minutes</strong> today.
              </p>
            </div>

            {/* Stats mini card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 24,
                boxShadow:
                  "0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.08)",
                display: "flex",
              }}
            >
              {[
                { label: "Rides This Month", value: "23" },
                { label: "Time Saved", value: "4.2h" },
                { label: "CO₂ Offset", value: "18kg" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
                    padding: "0 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#0d9488",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontWeight: 600,
                      marginTop: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
