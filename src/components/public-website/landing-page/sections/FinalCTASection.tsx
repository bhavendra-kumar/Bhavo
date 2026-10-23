"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Compass } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section
      id="cta"
      style={{
        background: "#ffffff",
        padding: "56px 24px 60px",
        position: "relative",
        borderTop: "1px solid #e2ece9",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            background: "#F5F8F7",
            border: "1.5px solid #e2ece9",
            borderRadius: 28,
            padding: "44px 28px",
            position: "relative",
            boxShadow: "0 8px 30px rgba(7, 91, 85, 0.05)",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#075B55",
              letterSpacing: 2,
              textTransform: "uppercase",
              background: "#ffffff",
              border: "1px solid #d5e5e2",
              padding: "4px 14px",
              borderRadius: 99,
              display: "inline-block",
              marginBottom: 18,
            }}
          >
            Start Your Journey
          </span>

          <h2
            style={{
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 900,
              color: "#142B29",
              letterSpacing: "-1.5px",
              margin: "0 0 18px",
              lineHeight: 1.15,
            }}
          >
            Ready to Experience Predictable Urban Travel?
          </h2>

          <p
            style={{
              fontSize: 16.5,
              color: "#475569",
              lineHeight: 1.65,
              maxWidth: 580,
              margin: "0 auto 40px",
            }}
          >
            Whether you need a point-to-point ride today or want to automate your upcoming weekday route, BHAVO connects you with verified drivers.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/user/book-ride"
              style={{
                background: "#075B55",
                color: "#ffffff",
                padding: "16px 34px",
                borderRadius: 14,
                fontSize: 15.5,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 18px rgba(7, 91, 85, 0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0a6e67";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#075B55";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <Compass size={18} />
              <span>Book a Ride</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/user/my-commute"
              style={{
                background: "#ffffff",
                color: "#142B29",
                border: "1.5px solid #d5e5e2",
                padding: "15px 30px",
                borderRadius: 14,
                fontSize: 15.5,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#075B55";
                (e.currentTarget as HTMLElement).style.color = "#075B55";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#d5e5e2";
                (e.currentTarget as HTMLElement).style.color = "#142B29";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <CalendarClock size={18} style={{ color: "#075B55" }} />
              <span>Schedule a Commute</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
