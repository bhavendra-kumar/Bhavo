"use client";

import { useInView } from "../hooks";

export default function ContactSection() {
  const { ref, inView } = useInView();

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
            Whether you have a question about features, pricing, or anything
            else, our team is ready to answer all your questions.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "48px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 24,
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
              >
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter your First Name.."
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
              <label
                style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
              >
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter Your Last Name.."
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
            <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Ent"
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
            <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
              Message
            </label>
            <textarea
              placeholder="How can we help you?"
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
            style={{
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "18px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              marginTop: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#1e293b";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#0f172a";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
}
