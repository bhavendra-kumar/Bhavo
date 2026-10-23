"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "book-ride",
    question: "How do I book an everyday ride on BHAVO?",
    answer:
      "Sign in to your rider account, navigate to 'Book a Ride', and enter your pickup and destination locations. Choose your vehicle type and optionally enable the pet-friendly option. Fares are calculated server-authoritatively before confirmation. Once requested, nearby verified drivers are notified.",
  },
  {
    id: "daily-commutes",
    question: "How do recurring daily commutes work?",
    answer:
      "Daily commutes are designed for students and working professionals who travel consistent routes on weekdays. You specify your fixed pickup and dropoff locations, select the active days of the week, and set your departure time. BHAVO's scheduling engine automatically generates upcoming ride occurrences ahead of your travel window.",
  },
  {
    id: "manage-commute",
    question: "How do I manage or update my recurring commute schedule?",
    answer:
      "Access the 'My Commute' dashboard inside your rider account. From there, you can view all configured commute rules, edit pickup times or locations, pause recurring generation for vacations or holidays, and inspect individual ride occurrences created by the schedule.",
  },
  {
    id: "pet-rides",
    question: "How do pet-friendly rides work?",
    answer:
      "When configuring your ride or commute, enable the 'Pet-Friendly' toggle. BHAVO filters the dispatch pool exclusively to driver partners who have opted in and registered pet-accommodating vehicles, ensuring a comfortable trip for both you and your companion.",
  },
  {
    id: "driver-matching-tracking",
    question: "How does driver matching and live tracking operate?",
    answer:
      "BHAVO matches trips with active, verified drivers in proximity to your pickup point. Once a driver accepts your trip, real-time vehicle coordinates update on your route map. For safety, a secure 4-digit OTP is generated in your app and must be verified by the driver before departure.",
  },
  {
    id: "payment-methods",
    question: "Which payment methods are currently supported?",
    answer:
      "During current pilot operations, fares are settled directly in cash with the driver upon reaching your destination. Fares are determined strictly server-side based on route distance and duration, and the completed transaction is recorded in your account trip history.",
  },
  {
    id: "cancellations-support",
    question: "How do ride cancellations and customer support work?",
    answer:
      "You can cancel a ride request directly from the trip status screen before the trip begins. If you experience an issue or require assistance with an account or past ride, you can submit a support ticket via the in-app Help & Support portal for review.",
  },
  {
    id: "driver-registration",
    question: "How do I register as a driver partner?",
    answer:
      "Navigate to the 'Become a Driver' signup page, complete your profile, and submit your driving license, vehicle registration certificate (RC), and active vehicle insurance. Once our compliance team verifies your documentation, your account is approved to go on duty and receive trip requests.",
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>("book-ride");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      style={{
        background: "#F5F8F7",
        padding: "56px 24px 60px",
        scrollMarginTop: 80,
        position: "relative",
        borderTop: "1px solid #e2ece9",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: "#075B55",
              background: "rgba(7, 91, 85, 0.08)",
              border: "1px solid rgba(7, 91, 85, 0.18)",
              padding: "5px 14px",
              borderRadius: 99,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} style={{ color: "#10B8A6" }} />
            <span>Common Questions & Inquiries</span>
          </div>
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
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 16.5, color: "#475569", lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>
            Transparent answers regarding ride bookings, recurring commute rules, driver onboarding, and platform policies.
          </p>
        </div>

        {/* Accordion List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  background: "#ffffff",
                  border: isOpen ? "1.5px solid #075B55" : "1px solid #e2ece9",
                  borderRadius: 16,
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  boxShadow: isOpen ? "0 4px 16px rgba(7, 91, 85, 0.06)" : "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <button
                  type="button"
                  id={`faq-btn-${faq.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-ans-${faq.id}`}
                  onClick={() => toggle(faq.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "22px 24px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#142B29",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16.5,
                      fontWeight: 750,
                      color: isOpen ? "#075B55" : "#142B29",
                      lineHeight: 1.4,
                    }}
                  >
                    {faq.question}
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: isOpen ? "#075B55" : "#F5F8F7",
                      color: isOpen ? "#ffffff" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease, background 0.2s ease",
                    }}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-ans-${faq.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${faq.id}`}
                    style={{
                      padding: "0 24px 22px",
                      color: "#475569",
                      fontSize: 15,
                      lineHeight: 1.7,
                      borderTop: "1px solid #f1f5f4",
                      paddingTop: 16,
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
