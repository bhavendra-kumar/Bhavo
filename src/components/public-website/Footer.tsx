"use client";

import Link from "next/link";
import Image from "next/image";

const NAV_COLS = [
  {
    heading: "Platform",
    links: [
      { label: "Real-Time Platform", href: "/#real-time-platform" },
      { label: "Features", href: "/features" },
      { label: "How it Works", href: "/how-it-works" },
    ],
  },
  {
    heading: "Captains",
    links: [
      { label: "Become a Driver", href: "/signup?role=driver" },
      { label: "Captain Hub Portal", href: "/driver" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Why Us", href: "/why-us" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0a0f1a",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, #0d9488 30%, #14b8a6 50%, #0d9488 70%, transparent 100%)",
        }}
      />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 24px 20px", position: "relative" }}>
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 28,
            alignItems: "start",
          }}
        >
          <div>
            <Link
              href="/"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", marginBottom: 12 }}
            >
              <Image
                src="/bhavo-title.png"
                alt="Bhavo"
                width={138}
                height={46}
                className="bhavo-title-img"
                style={{ height: 42, width: "auto", display: "block" }}
              />
            </Link>

            <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, maxWidth: 320, margin: 0 }}>
              Redefining daily mobility through AI-powered automation and premium commute experiences.
            </p>
          </div>

          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                }}
              >
                {col.heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map((lnk) => (
                  <li key={lnk.label}>
                    <Link
                      href={lnk.href}
                      style={{
                        fontSize: 13.5,
                        color: "#64748b",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        display: "inline-block",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#14b8a6";
                        (e.currentTarget as HTMLElement).style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#64748b";
                        (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                      }}
                    >
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12.5,
            color: "#64748b",
          }}
        >
          <div>© {new Date().getFullYear()} Bhavo Technologies Inc. All rights reserved.</div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#14b8a6")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748b")}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#14b8a6")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748b")}>Terms of Service</Link>
            <Link href="/contact" style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#14b8a6")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748b")}>Contact Us</Link>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </footer>
  );
}
