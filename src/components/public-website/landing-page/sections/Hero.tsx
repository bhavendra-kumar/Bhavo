"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const WORDS = ["Smarter.", "Faster.", "Safer.", "Effortlessly."];

export default function Hero() {
  const [typed, setTyped] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const wordRef = useRef(0);
  const charRef = useRef(0);
  const dirRef = useRef<"forward" | "back">("forward");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function tick() {
      const word = WORDS[wordRef.current];
      if (dirRef.current === "forward") {
        charRef.current++;
        setTyped(word.slice(0, charRef.current));
        if (charRef.current === word.length) {
          dirRef.current = "back";
          timerRef.current = setTimeout(tick, 1900);
          return;
        }
      } else {
        charRef.current--;
        setTyped(word.slice(0, charRef.current));
        if (charRef.current === 0) {
          wordRef.current = (wordRef.current + 1) % WORDS.length;
          dirRef.current = "forward";
          timerRef.current = setTimeout(tick, 300);
          return;
        }
      }
      timerRef.current = setTimeout(tick, dirRef.current === "forward" ? 80 : 45);
    }
    timerRef.current = setTimeout(tick, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const { width, height } = sectionRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX / width - 0.5) * 28,
        y: (e.clientY / height - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section id="hero" ref={sectionRef} className="hero-section">
      {/* Dynamic Background Mesh & Grid */}
      <div className="hero-grid-pattern" />

      {/* Floating Aurora Orbs with mouse parallax */}
      <div
        className="aurora-orb aurora-orb-1"
        style={{
          transform: `translate(${mousePos.x * 0.45}px, ${mousePos.y * 0.45}px)`,
        }}
      />
      <div
        className="aurora-orb aurora-orb-2"
        style={{
          transform: `translate(${mousePos.x * -0.35}px, ${mousePos.y * -0.35}px)`,
        }}
      />
      <div
        className="aurora-orb aurora-orb-3"
        style={{
          transform: `translate(${mousePos.x * 0.25}px, ${mousePos.y * 0.25}px)`,
        }}
      />



      {/* Hero Content Container */}
      <div className="hero-content">
        {/* Headline with Dynamic Gradient Typing */}
        <h1 className="hero-headline">
          Ride{" "}
          <span className="hero-typed-wrapper">
            <span className="hero-typed-word">{typed}</span>
            <span className="hero-cursor" />
          </span>
          <br />
          Commute Better.
        </h1>

        {/* Subheading */}
        <p className="hero-subheading">
          Bhavo combines AI-powered ride booking &amp; recurring commute automation for riders with a dedicated real-time dispatch and earnings console for drivers - all in one platform.
        </p>

        {/* Action Buttons */}
        <div className="hero-btn-group">
          {/* Primary CTA - Book Your Ride */}
          <Link href="/signup" className="hero-primary-btn">
            <span className="btn-shimmer-sweep" />
            <span className="btn-text">Book Your Ride</span>
            <span className="btn-arrow-icon">→</span>
          </Link>

          {/* Secondary CTA - Drive with Bhavo */}
          <Link href="/signup?role=driver" className="hero-secondary-btn">
            <span className="btn-driver-dot" />
            <span className="btn-text">Drive with Bhavo</span>
            <span className="btn-subtext-pill">Captain Hub</span>
          </Link>
        </div>

        {/* Trust & Metric Highlights */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <span className="trust-stars">★★★★★</span>
            <span className="trust-text">4.5/5 Commuter Rating</span>
          </div>
          <div className="trust-separator">•</div>
          <div className="trust-item">
            <span className="trust-icon">⏱️</span>
            <span className="trust-text">&lt; 3 Min Pickups</span>
          </div>
          <div className="trust-separator">•</div>
          <div className="trust-item">
            <span className="trust-icon">🛡️</span>
            <span className="trust-text">100% Vetted Drivers</span>
          </div>
          <div className="trust-separator">•</div>
          <div className="trust-item">
            <span className="trust-icon">₹</span>
            <span className="trust-text">Transparent Pricing</span>
          </div>
        </div>
      </div>

      {/* Custom Scoped Animations and Styles */}
      <style>{`
        .hero-section {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          text-align: center;
          padding: 130px 24px 80px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(ellipse 90% 70% at 50% -15%, rgba(13,148,136,0.14) 0%, rgba(240,253,250,0.5) 45%, #ffffff 100%);
        }

        .hero-grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(13,148,136,0.04) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(13,148,136,0.04) 1.5px, transparent 1.5px);
          background-size: 56px 56px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse 85% 65% at 50% 35%, black 25%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 85% 65% at 50% 35%, black 25%, transparent 100%);
        }

        /* Glowing Orbs */
        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
        }

        .aurora-orb-1 {
          top: -12%;
          left: -4%;
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(13,148,136,0.18) 0%, rgba(20,184,166,0.06) 50%, transparent 70%);
          filter: blur(52px);
          animation: orb-drift 18s ease-in-out infinite alternate;
        }

        .aurora-orb-2 {
          bottom: -15%;
          right: -6%;
          width: 580px;
          height: 580px;
          background: radial-gradient(circle, rgba(13,148,136,0.12) 0%, rgba(13,148,136,0.03) 50%, transparent 70%);
          filter: blur(56px);
          animation: orb-drift 22s ease-in-out infinite alternate-reverse;
        }

        .aurora-orb-3 {
          top: 30%;
          right: 14%;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 68%);
          filter: blur(36px);
          animation: orb-float 12s ease-in-out infinite;
        }

        @keyframes orb-drift {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.08); }
          100% { transform: translateY(20px) scale(0.96); }
        }

        @keyframes orb-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-24px) translateX(-18px); }
        }

        /* Hero Main Content */
        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-headline {
          font-size: clamp(48px, 7.5vw, 88px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -2.5px;
          color: #0f172a;
          margin: 0 0 24px;
          animation: hero-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-typed-wrapper {
          display: inline-flex;
          align-items: baseline;
          position: relative;
        }

        .hero-typed-word {
          color: #0d9488;
          display: inline-block;
          min-width: 4.8ch;
          text-align: left;
        }

        .hero-cursor {
          display: inline-block;
          width: 3.5px;
          height: 0.82em;
          background: #0d9488;
          margin-left: 4px;
          vertical-align: middle;
          border-radius: 2px;
          animation: blink 1s step-end infinite;
          box-shadow: 0 0 8px rgba(13,148,136,0.6);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .hero-subheading {
          font-size: clamp(16px, 2vw, 19.5px);
          color: #475569;
          max-width: 660px;
          line-height: 1.7;
          margin: 0 0 44px;
          font-weight: 450;
          letter-spacing: -0.15px;
          animation: hero-fade-up 0.8s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Action Buttons */
        .hero-btn-group {
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
          animation: hero-fade-up 0.9s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Primary Button */
        .hero-primary-btn {
          position: relative;
          background: #0d9488;
          color: #ffffff;
          padding: 16px 36px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          cursor: pointer;
          letter-spacing: -0.2px;
          transition: all 0.28s cubic-bezier(0.2, 0.8, 0.4, 1);
          box-shadow: 0 8px 24px -4px rgba(13,148,136,0.4), 0 20px 48px -8px rgba(13,148,136,0.3);
        }

        .hero-primary-btn:hover {
          background: #0f766e;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 36px -4px rgba(13,148,136,0.5), 0 28px 64px -8px rgba(13,148,136,0.4);
        }

        .hero-primary-btn:active {
          transform: translateY(1px) scale(0.99);
        }

        .btn-arrow-icon {
          font-size: 18px;
          line-height: 1;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
        }

        .hero-primary-btn:hover .btn-arrow-icon {
          transform: translateX(4px);
        }

        .btn-shimmer-sweep {
          position: absolute;
          top: 0;
          left: -120%;
          width: 80%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          transform: skewX(-25deg);
          animation: sweep-light 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        @keyframes sweep-light {
          0% { left: -120%; }
          30% { left: 160%; }
          100% { left: 160%; }
        }

        /* Secondary Button */
        .hero-secondary-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #0f172a;
          border: 1.5px solid rgba(13,148,136,0.32);
          padding: 15px 28px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 650;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          letter-spacing: -0.2px;
          transition: all 0.28s cubic-bezier(0.2, 0.8, 0.4, 1);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .hero-secondary-btn:hover {
          background: rgba(240, 253, 250, 0.95);
          border-color: #0d9488;
          color: #0d9488;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 32px rgba(13,148,136,0.18), 0 2px 8px rgba(13,148,136,0.08);
        }

        .hero-secondary-btn:active {
          transform: translateY(1px) scale(0.99);
        }

        .btn-driver-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0d9488;
          box-shadow: 0 0 6px rgba(13,148,136,0.6);
        }

        .btn-subtext-pill {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0d9488;
          background: rgba(13, 148, 136, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .hero-secondary-btn:hover .btn-subtext-pill {
          background: #0d9488;
          color: #ffffff;
        }

        /* Trust & Social Proof Bar */
        .hero-trust-bar {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 10px 22px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 100px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          flex-wrap: wrap;
          justify-content: center;
          animation: hero-fade-up 1s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
        }

        .trust-stars {
          color: #f59e0b;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .trust-separator {
          color: #cbd5e1;
          font-size: 12px;
        }

        @keyframes hero-fade-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }



        @media (max-width: 640px) {
          .hero-section {
            padding: 110px 16px 60px;
          }
          .hero-btn-group {
            flex-direction: column;
            width: 100%;
            gap: 12px;
          }
          .hero-primary-btn, .hero-secondary-btn {
            width: 100%;
            justify-content: center;
            padding: 16px 20px;
          }
          .hero-trust-bar {
            padding: 10px 14px;
            gap: 8px;
            border-radius: 16px;
          }
          .trust-separator {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
