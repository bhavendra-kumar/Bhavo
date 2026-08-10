"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrolled } from "./landing-page/hooks";
import { NAV_LINKS } from "./landing-page/constants";

export default function Navbar() {
  const scrolled = useScrolled();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const getHref = (link: string) =>
    `/${link.toLowerCase().replace(/ /g, "-")}`;

  const isActive = (link: string) => pathname === getHref(link);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          background: scrolled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0)",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 28px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Bhavo logo" style={{ height: 36, width: "auto", display: "block" }} />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  color: "#0f172a",
                }}
              >
                BHAVO
              </span>
            </div>
          </Link>

          {/* Desktop nav links — absolutely centred */}
          <div
            className="nav-links"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 4,
              alignItems: "center",
              background: scrolled ? "transparent" : "rgba(255,255,255,0.7)",
              backdropFilter: scrolled ? "none" : "blur(12px)",
              border: scrolled ? "none" : "1px solid rgba(0,0,0,0.07)",
              borderRadius: 100,
              padding: scrolled ? "0" : "6px 8px",
              transition: "all 0.4s ease",
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              return (
                <Link
                  key={link}
                  href={getHref(link)}
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#0d9488" : "#374151",
                    textDecoration: "none",
                    padding: "8px 18px",
                    borderRadius: 100,
                    background: active ? "rgba(13,148,136,0.1)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "#0d9488";
                      (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.07)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "#374151";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {link}
                </Link>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href="/login"
              style={{
                background: "transparent",
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
                cursor: "pointer",
                padding: "9px 18px",
                borderRadius: 10,
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                (e.currentTarget as HTMLElement).style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#374151";
              }}
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className="btn-shimmer"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 11,
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.25s",
                boxShadow: "0 4px 16px rgba(13,148,136,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(13,148,136,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(13,148,136,0.4), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
            >
              Start a Ride →
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="hamburger-btn"
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 8,
                flexDirection: "column",
                gap: 5,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    width: 22,
                    height: 2,
                    background: "#0f172a",
                    borderRadius: 2,
                    transition: "all 0.3s",
                    transformOrigin: "center",
                    transform:
                      menuOpen && i === 0 ? "rotate(45deg) translate(5px, 5px)"
                        : menuOpen && i === 1 ? "scaleX(0)"
                          : menuOpen && i === 2 ? "rotate(-45deg) translate(5px, -5px)"
                            : "none",
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          style={{
            maxHeight: menuOpen ? 400 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            borderTop: menuOpen ? "1px solid rgba(0,0,0,0.06)" : "none",
          }}
        >
          <div style={{ padding: "16px 28px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link}
                href={getHref(link)}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: isActive(link) ? "#0d9488" : "#374151",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: isActive(link) ? "rgba(13,148,136,0.08)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
