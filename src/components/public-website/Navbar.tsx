"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useScrolled } from "./landing-page/hooks";
import { NAV_LINKS } from "./landing-page/constants";

export default function Navbar() {
  const scrolled = useScrolled();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const getHref = (link: string | { label: string; href: string }) =>
    typeof link === "string"
      ? `/${link.toLowerCase().replace(/ /g, "-")}`
      : link.href;

  const getLabel = (link: string | { label: string; href: string }) =>
    typeof link === "string" ? link : link.label;

  const isActive = (link: string | { label: string; href: string }) =>
    pathname === getHref(link);

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
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0)",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            padding: "0 24px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            position: "relative",
          }}
        >
          {/* Logo Brand */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              <Image src="/bhavo-logo.png" alt="Bhavo logo" width={36} height={36} style={{ height: 36, width: "auto", display: "block" }} priority />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    color: "#0f172a",
                    lineHeight: 1.1,
                  }}
                >
                  BHAVO
                </span>
              </div>
            </div>
          </Link>

          {/* Center Links */}
          <div
            className="nav-links"
            style={{
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
              const label = getLabel(link);
              const href = getHref(link);
              return (
                <Link
                  key={label}
                  href={href}
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
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <div className="desktop-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Driver Dashboard / Login */}
              <Link
                href="/driver"
                title="Login to Driver Dashboard"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.08)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#f1f5f9";
                  (e.currentTarget as HTMLElement).style.color = "#0f172a";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#334155";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                }}
              >
                <span>🚗</span> Driver Dashboard
              </Link>

              {/* User Dashboard */}
              <Link
                href="/user/dashboard"
                title="Login to User Dashboard"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.08)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#f1f5f9";
                  (e.currentTarget as HTMLElement).style.color = "#0f172a";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#334155";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                }}
              >
                <span>👤</span> User Dashboard
              </Link>

              {/* Drive with Bhavo */}
              <Link
                href="/signup?role=driver"
                style={{
                  background: "transparent",
                  border: "1.5px solid rgba(13,148,136,0.35)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0d9488",
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#0d9488";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.35)";
                }}
              >
                Drive with Bhavo
              </Link>

              {/* Start a Ride */}
              <Link
                href="/signup"
                className="btn-shimmer"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 18px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "all 0.25s",
                  boxShadow: "0 4px 14px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(13,148,136,0.45), inset 0 1px 0 rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
                }}
              >
                Start a Ride →
              </Link>
            </div>

            {/* Mobile Hamburger */}
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

        {/* Mobile Drawer */}
        <div
          style={{
            maxHeight: menuOpen ? 580 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            borderTop: menuOpen ? "1px solid rgba(0,0,0,0.06)" : "none",
          }}
        >
          <div style={{ padding: "16px 28px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
            {NAV_LINKS.map((link) => {
              const label = getLabel(link);
              const href = getHref(link);
              return (
                <Link
                  key={label}
                  href={href}
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
                  {label}
                </Link>
              );
            })}

            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "8px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/driver"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  textAlign: "center",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>🚗</span> Login to Driver Dashboard
              </Link>
              <Link
                href="/user/dashboard"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0f172a",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  textAlign: "center",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>👤</span> Login to User Dashboard
              </Link>
              <Link
                href="/signup?role=driver"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0d9488",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(13,148,136,0.3)",
                  textAlign: "center",
                  background: "rgba(13,148,136,0.05)",
                }}
              >
                Drive with Bhavo (Captain Hub)
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="btn-shimmer"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  textAlign: "center",
                  boxShadow: "0 4px 16px rgba(13,148,136,0.35)",
                }}
              >
                Start a Ride →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 1180px) {
          .nav-links { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .desktop-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}
