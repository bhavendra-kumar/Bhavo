"use client";

import Link from "next/link";
import Image from "next/image";

const NAV_GROUPS = [
  {
    heading: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Our Services", href: "/our-services" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Why BHAVO", href: "/why-us" },
    ],
  },
  {
    heading: "Portals",
    links: [
      { label: "Rider Sign-In", href: "/login?role=rider" },
      { label: "Driver Sign-In", href: "/login?role=driver" },
      { label: "Become a Driver", href: "/signup?role=driver" },
    ],
  },
  {
    heading: "Company & Support",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Customer Reviews", href: "/reviews" },
      { label: "Contact Us", href: "/contact" },
      { label: "Frequently Asked Questions", href: "/#faq" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0d1f1d",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        color: "#94a3b8",
        padding: "48px 24px 28px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Main Grid */}
        <div
          className="footer-content-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 36,
          }}
        >
          {/* Brand Info */}
          <div>
            <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 14 }}>
              <Image
                src="/bhavo-title.png"
                alt="BHAVO"
                width={150}
                height={50}
                className="bhavo-title-img"
                style={{ height: 44, width: "auto", display: "block" }}
              />
            </Link>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
              Connecting passengers with verified drivers for convenient everyday trips and automated recurring commutes.
            </p>
          </div>

          {/* Links Columns */}
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <h4
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#e2ece9",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  margin: "0 0 16px",
                }}
              >
                {group.heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: 13.5,
                        color: "#94a3b8",
                        textDecoration: "none",
                        transition: "color 0.2s ease, transform 0.2s ease",
                        display: "inline-block",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#10B8A6";
                        (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                        (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Legal Bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12.5,
            color: "#64748b",
          }}
        >
          <div>
            © {new Date().getFullYear()} BHAVO Technologies. All rights reserved.
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <Link
              href="/terms-and-policies#terms"
              style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#10B8A6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
            >
              Terms of Service
            </Link>
            <Link
              href="/terms-and-policies#privacy"
              style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#10B8A6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-content-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 560px) {
          .footer-content-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </footer>
  );
}
