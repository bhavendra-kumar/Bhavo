"use client";

import { useState, useEffect, useRef } from "react";

export default function Hero() {
  const [typed, setTyped] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const words = ["Smarter.", "Faster.", "Effortlessly."];
  const wordRef = useRef(0);
  const charRef = useRef(0);
  const dirRef = useRef<"forward" | "back">("forward");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Typewriter
  useEffect(() => {
    function tick() {
      const word = words[wordRef.current];
      if (dirRef.current === "forward") {
        charRef.current++;
        setTyped(word.slice(0, charRef.current));
        if (charRef.current === word.length) {
          dirRef.current = "back";
          timerRef.current = setTimeout(tick, 1800);
          return;
        }
      } else {
        charRef.current--;
        setTyped(word.slice(0, charRef.current));
        if (charRef.current === 0) {
          wordRef.current = (wordRef.current + 1) % words.length;
          dirRef.current = "forward";
          timerRef.current = setTimeout(tick, 300);
          return;
        }
      }
      timerRef.current = setTimeout(tick, dirRef.current === "forward" ? 75 : 45);
    }
    timerRef.current = setTimeout(tick, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parallax on mouse move
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const { width, height } = sectionRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX / width - 0.5) * 24,
        y: (e.clientY / height - 0.5) * 16,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(13,148,136,0.1) 0%, transparent 65%), #ffffff",
      }}
    >
      {/* Subtle grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          pointerEvents: "none",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
        }}
      />

      {/* Aurora orb 1 — teal top-left */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-5%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 65%)",
          filter: "blur(48px)",
          animation: "float-slow 16s ease-in-out infinite",
          pointerEvents: "none",
          transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)`,
          transition: "transform 0.2s ease-out",
        }}
      />
      {/* Aurora orb 2 — indigo bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)",
          filter: "blur(48px)",
          animation: "float-medium 20s ease-in-out infinite",
          pointerEvents: "none",
          transform: `translate(${mousePos.x * -0.25}px, ${mousePos.y * -0.25}px)`,
          transition: "transform 0.2s ease-out",
        }}
      />
      {/* Orb 3 — small accent */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          right: "12%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 70%)",
          filter: "blur(32px)",
          animation: "float-fast 10s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(13,148,136,0.08)",
          border: "1px solid rgba(13,148,136,0.25)",
          borderRadius: 100,
          padding: "7px 18px",
          marginBottom: 36,
          animation: "fadeUp 0.6s ease both, badge-glow 3s ease-in-out infinite 0.6s",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#0d9488",
            boxShadow: "0 0 8px rgba(13,148,136,0.8)",
            animation: "ring-pulse 2.5s infinite",
          }}
        />
        <span style={{ fontSize: 12, color: "#0d9488", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
          AI-Powered Commutes
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(52px, 7.5vw, 90px)",
          fontWeight: 900,
          lineHeight: 1.03,
          letterSpacing: "-3px",
          color: "#0f172a",
          margin: "0 0 28px",
          maxWidth: 860,
          animation: "fadeUp 0.7s 0.1s ease both",
          position: "relative",
          zIndex: 1,
        }}
      >
        Ride{" "}
        <span
          style={{
            color: "#0d9488",
            display: "inline-block",
            minWidth: "5ch",
          }}
        >
          {typed}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: "0.82em",
              background: "#0d9488",
              marginLeft: 3,
              verticalAlign: "middle",
              animation: "blink 1s step-end infinite",
              borderRadius: 2,
            }}
          />
        </span>
        <br />
        Commute Better.
      </h1>

      {/* Subheading */}
      <p
        style={{
          fontSize: "clamp(16px, 2vw, 19px)",
          color: "#64748b",
          maxWidth: 540,
          lineHeight: 1.75,
          margin: "0 0 52px",
          animation: "fadeUp 0.8s 0.2s ease both",
          position: "relative",
          zIndex: 1,
        }}
      >
        Bhavo combines AI-powered ride booking with recurring commute automation
        to deliver seamless, predictable, and premium daily travel experiences.
      </p>

      {/* CTA buttons */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          animation: "fadeUp 0.9s 0.3s ease both",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button
          className="btn-shimmer"
          style={{
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "17px 40px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 8px 32px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            letterSpacing: "-0.2px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 56px rgba(13,148,136,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
          }}
        >
          Get Started Free →
        </button>
        <button
          style={{
            background: "#fff",
            color: "#0f172a",
            border: "1.5px solid #e2e8f0",
            borderRadius: 14,
            padding: "17px 40px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#0d9488";
            (e.currentTarget as HTMLElement).style.color = "#0d9488";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(13,148,136,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
            (e.currentTarget as HTMLElement).style.color = "#0f172a";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
          }}
        >
          Become a Driver
        </button>
      </div>
    </section>
  );
}
