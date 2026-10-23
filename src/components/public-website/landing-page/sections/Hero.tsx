"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation, CalendarClock, ArrowRight, ShieldCheck } from "lucide-react";
import HeroBookingExperience from "../HeroBookingExperience";

const ROTATING_PHRASES = [
  "Automated daily commutes on autopilot.",
  "Effortless office & business travel.",
  "Pet-friendly city journeys with verified drivers.",
  "Scheduled campus rides on time.",
  "Reliable on-demand city trips anytime.",
  "Stress-free recurring weekday routines.",
];

export default function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullPhrase = ROTATING_PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (currentText.length < fullPhrase.length) {
        timer = setTimeout(() => {
          setCurrentText(fullPhrase.slice(0, currentText.length + 1));
        }, 55);
      } else {
        // Pause after full phrase is typed out
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(fullPhrase.slice(0, currentText.length - 1));
        }, 30);
      } else {
        // Finished backspacing, switch to next word
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
        timer = setTimeout(() => { }, 250);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex]);

  return (
    <section id="hero" className="hero-section">
      {/* Background Ambience & Road Grid Pattern */}
      <div className="hero-bg-glow" />
      <div className="hero-grid-pattern" />

      <div className="hero-container">
        {/* Left Column: Eyebrow, Rotating Headline, Subheading, CTAs & Trust Badges */}
        <div className="hero-content">
          {/* Editorial Mobility Badge */}
          <div className="hero-kicker-badge">
            <span className="hero-kicker-tag">BHAVO MOBILITY</span>
            <span className="hero-kicker-text">Transparent Upfront Fares &bull; Scheduled Commutes</span>
          </div>

          {/* Dynamic Typing Headline */}
          <h1 className="hero-headline">
            <span className="hero-static-title">Everyday rides and</span>
            <span className="hero-dynamic-row">
              <span className="hero-dynamic-word" aria-live="polite">
                {currentText}
                <span className="hero-dynamic-cursor" aria-hidden="true">|</span>
              </span>
            </span>
          </h1>

          {/* Concise Platform Explanation */}
          <p className="hero-subheading">
            Book point-to-point city trips or set your recurring weekday travel on autopilot. BHAVO connects passengers with verified drivers through transparent upfront pricing and scheduled route automation.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="hero-btn-group">
            <Link href="/user/book-ride" className="hero-primary-btn">
              <span>Start a Ride</span>
              <ArrowRight size={18} className="hero-btn-arrow" />
            </Link>

            <Link href="/user/my-commute" className="hero-secondary-btn">
              <CalendarClock size={18} className="btn-icon" />
              <span>Schedule a Commute</span>
            </Link>
          </div>

          {/* Elevated Trust Badges */}
          <div className="hero-trust-bar">
            <div className="hero-trust-pill">
              <div className="trust-icon-box">
                <ShieldCheck size={14} />
              </div>
              <span>Verified Drivers</span>
            </div>
            <div className="hero-trust-pill">
              <div className="trust-icon-box">
                <Navigation size={14} />
              </div>
              <span>Live GPS Tracking</span>
            </div>
            <div className="hero-trust-pill">
              <div className="trust-icon-box">
                <CalendarClock size={14} />
              </div>
              <span>Automated Schedules</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Booking Experience */}
        <div className="hero-booking-column">
          <HeroBookingExperience />
        </div>
      </div>

      <style>{`
        .hero-section {
          min-height: auto;
          display: flex;
          align-items: flex-start;
          justifyContent: center;
          padding: 92px 24px 48px;
          position: relative;
          background: #ffffff;
          overflow: hidden;
        }

        .hero-bg-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 14% 20%, rgba(7, 91, 85, 0.07) 0%, transparent 45%),
            radial-gradient(circle at 86% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 45%);
          pointer-events: none;
        }

        .hero-grid-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(7, 91, 85, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(7, 91, 85, 0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }

        .hero-container {
          max-width: 1260px;
          width: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 44px;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          text-align: left;
        }

        /* Editorial Mobility Badge */
        .hero-kicker-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1.5px solid #e2ece9;
          padding: 5px 14px 5px 6px;
          border-radius: 10px;
          margin-bottom: 22px;
          box-shadow: 0 2px 10px rgba(7, 91, 85, 0.05);
          transition: all 0.2s ease;
        }

        .hero-kicker-badge:hover {
          border-color: #0d9488;
          box-shadow: 0 4px 14px rgba(7, 91, 85, 0.1);
          transform: translateY(-1px);
        }

        .hero-kicker-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #ffffff;
          background: #075b55;
          padding: 4px 9px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .hero-kicker-text {
          font-size: 12.5px;
          font-weight: 700;
          color: #334155;
          letter-spacing: 0.1px;
        }

        .hero-kicker-arrow {
          color: #0d9488;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .hero-kicker-badge:hover .hero-kicker-arrow {
          transform: translateX(2px);
        }

        /* Dynamic Headline */
        .hero-headline {
          font-size: clamp(34px, 4vw, 50px);
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: -1.4px;
          color: #112826;
          margin: 0 0 18px;
          min-height: 3.75em;
        }

        .hero-static-title {
          display: block;
        }

        .hero-dynamic-row {
          display: block;
          min-height: 2.45em;
          margin-top: 6px;
          position: relative;
        }

        .hero-dynamic-word {
          display: inline;
          color: #075B55;
          background: linear-gradient(135deg, #075B55 0%, #0D9488 50%, #10B981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        .hero-dynamic-cursor {
          display: inline-block;
          margin-left: 2px;
          color: #0D9488;
          -webkit-text-fill-color: #0D9488;
          font-weight: 300;
          animation: cursorBlink 0.85s steps(2, start) infinite;
          user-select: none;
          vertical-align: baseline;
        }

        @keyframes cursorBlink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-live-ping {
            display: none;
          }
          .hero-dynamic-cursor {
            animation: none;
          }
        }

        .hero-subheading {
          font-size: clamp(15.5px, 1.7vw, 17.5px);
          color: #4A5D5A;
          line-height: 1.65;
          margin: 0 0 28px;
          max-width: 580px;
        }

        .hero-btn-group {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .hero-primary-btn {
          background: linear-gradient(135deg, #075B55 0%, #0A6E67 100%);
          color: #ffffff;
          padding: 15px 30px;
          border-radius: 14px;
          font-size: 15.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 6px 20px -2px rgba(7, 91, 85, 0.35);
        }

        .hero-primary-btn:hover {
          background: linear-gradient(135deg, #086660 0%, #0C7D75 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px -2px rgba(7, 91, 85, 0.45);
        }

        .hero-primary-btn:hover .hero-btn-arrow {
          transform: translateX(4px);
        }

        .hero-btn-arrow {
          transition: transform 0.2s ease;
        }

        .hero-secondary-btn {
          background: #ffffff;
          color: #142B29;
          border: 1.5px solid #D5E5E2;
          padding: 14.5px 26px;
          border-radius: 14px;
          font-size: 15.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        }

        .hero-secondary-btn:hover {
          background: #F4F9F8;
          border-color: #075B55;
          color: #075B55;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(7, 91, 85, 0.12);
        }

        .hero-trust-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero-trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #F7FAF9;
          border: 1px solid #E5EFEC;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          color: #334D49;
          transition: all 0.2s ease;
        }

        .hero-trust-pill:hover {
          background: #EFF6F4;
          border-color: #CCE3DE;
        }

        .trust-icon-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: rgba(7, 91, 85, 0.1);
          color: #075B55;
        }

        @media (max-width: 960px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .hero-content {
            text-align: center;
          }
          .hero-eyebrow {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-subheading {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-btn-group {
            justify-content: center;
          }
          .hero-trust-bar {
            justify-content: center;
          }
        }

        @media (max-width: 600px) {
          .hero-section {
            padding: 96px 16px 50px;
          }
          .hero-headline {
            min-height: 4.8em;
          }
          .hero-dynamic-row {
            min-height: 3.6em;
          }
          .hero-btn-group {
            flex-direction: column;
            width: 100%;
          }
          .hero-primary-btn, .hero-secondary-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
