"use client";

import Link from "next/link";
import { MessageSquareCheck, ShieldCheck, ArrowRight } from "lucide-react";

export default function ReviewsSection() {
  return (
    <section
      id="reviews"
      style={{
        background: "#F5F8F7",
        padding: "56px 24px 60px",
        scrollMarginTop: 80,
        position: "relative",
        borderTop: "1px solid #e2ece9",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        {/* Section Header */}
        <p
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: "#075B55",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Customer Reviews
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 900,
            color: "#142B29",
            letterSpacing: "-1px",
            margin: "0 0 16px",
            lineHeight: 1.15,
          }}
        >
          Verified Passenger Feedback
        </h2>
        <p
          style={{
            fontSize: 16.5,
            color: "#475569",
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "0 auto 32px",
          }}
        >
          BHAVO only publishes authentic ratings collected directly from completed passenger rides and recurring commute journeys.
        </p>

        {/* Honest, Elegant Empty State Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2ece9",
            borderRadius: 24,
            padding: "36px 28px",
            maxWidth: 720,
            margin: "0 auto",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: "#F5F8F7",
              border: "1px solid #e2ece9",
              color: "#075B55",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <MessageSquareCheck size={28} />
          </div>

          <h3
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#142B29",
              margin: "0 0 12px",
            }}
          >
            Verified Reviews Under Collection
          </h3>

          <p
            style={{
              fontSize: 14.5,
              color: "#64748b",
              lineHeight: 1.7,
              maxWidth: 540,
              margin: "0 auto 28px",
            }}
          >
            We adhere strictly to truthful attribution. As riders and drivers complete everyday trips and recurring commute occurrences, verified feedback and ratings will appear here after compliance verification.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#F5F8F7",
              border: "1px solid #d5e5e2",
              padding: "8px 16px",
              borderRadius: 99,
              fontSize: 12.5,
              fontWeight: 700,
              color: "#075B55",
              marginBottom: 28,
            }}
          >
            <ShieldCheck size={16} />
            <span>Zero Fabricated Testimonials Policy</span>
          </div>

          <div>
            <Link
              href="/reviews"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "#075B55",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#10B8A6";
                (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#075B55";
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
              }}
            >
              <span>View Reviews Policy &amp; Portal</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
