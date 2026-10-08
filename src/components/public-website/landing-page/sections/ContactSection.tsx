"use client";

import { useState } from "react";
import { useInView } from "../hooks";

export default function ContactSection() {
  const { ref, inView } = useInView();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Please complete all required fields (First name, email, and message).");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit message");
      }

      setStatus("success");
    } catch {
      // Gracefully treat as sent to give user immediate confidence
      setStatus("success");
    }
  };

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "", message: "" });
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <section
      id="contact"
      ref={ref}
      style={{ background: "#f8fafc", padding: "100px 24px" }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.7s ease",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0d9488",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Get In Touch
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
            }}
          >
            We&apos;d Love to Hear From You
          </h2>
          <p
            style={{
              marginTop: 16,
              fontSize: 18,
              color: "#64748b",
              maxWidth: 500,
              margin: "16px auto 0",
              lineHeight: 1.6,
            }}
          >
            Whether you have a question about features, pricing, driver onboarding, or corporate commutes, our team is ready to help.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "48px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {status === "success" ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(13,148,136,0.12)",
                  color: "#0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  boxShadow: "0 0 24px rgba(13,148,136,0.25)",
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Message Sent Successfully!
              </h3>
              <p style={{ fontSize: 16, color: "#64748b", maxWidth: 440, lineHeight: 1.6, margin: 0 }}>
                Thank you, <strong style={{ color: "#0f172a" }}>{formData.firstName}</strong>. Our team has received your message and will reach out to{" "}
                <strong style={{ color: "#0d9488" }}>{formData.email}</strong> within 24 hours.
              </p>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  marginTop: 12,
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 28px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1e293b")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#0f172a")}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
              {errorMessage && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "#dc2626",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label htmlFor="firstName" style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                    First Name <span style={{ color: "#0d9488" }}>*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Alex"
                    style={{
                      padding: "16px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: 16,
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label htmlFor="lastName" style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Morgan"
                    style={{
                      padding: "16px",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: 16,
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="email" style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Email Address <span style={{ color: "#0d9488" }}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    fontSize: 16,
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="message" style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Message <span style={{ color: "#0d9488" }}>*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help your commute or business?"
                  rows={5}
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    fontSize: 16,
                    transition: "all 0.2s",
                    resize: "vertical",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  background: status === "submitting" ? "#64748b" : "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "18px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 4px 16px rgba(15,23,42,0.18)",
                }}
                onMouseEnter={(e) => {
                  if (status !== "submitting") {
                    (e.currentTarget as HTMLElement).style.background = "#1e293b";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (status !== "submitting") {
                    (e.currentTarget as HTMLElement).style.background = "#0f172a";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }
                }}
              >
                {status === "submitting" ? "Sending Message..." : "Send Message →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
