"use client";

import { useInView } from "../hooks";

export default function CTASection() {
  const { ref, inView } = useInView();

  return (
    <section
      id="drivers"
      ref={ref}
      style={{ background: "#fff", padding: "100px 24px" }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background:
            "linear-gradient(135deg, #0d9488 0%, #0f766e 60%, #134e4a 100%)",
          borderRadius: 36,
          padding: "80px 60px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          opacity: inView ? 1 : 0,
          transform: inView ? "scale(1)" : "scale(0.96)",
          transition: "all 0.7s ease",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />

        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(153,246,228,0.9)",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Start Today
        </p>
        <h2
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-2px",
            margin: "0 0 20px",
            lineHeight: 1.05,
          }}
        >
          Your Perfect Commute
          <br />
          Starts Tomorrow.
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 500,
            margin: "0 auto 48px",
            lineHeight: 1.6,
          }}
        >
          Join 50,000+ professionals who&apos;ve made their daily commute the
          easiest part of their day.
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              background: "#fff",
              color: "#0d9488",
              border: "none",
              borderRadius: 14,
              padding: "16px 36px",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.25s",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px) scale(1.02)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 16px 48px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0) scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.15)";
            }}
          >
            Get Started Free →
          </button>
          <button
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: 14,
              padding: "16px 36px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.2)";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
            }}
          >
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}
