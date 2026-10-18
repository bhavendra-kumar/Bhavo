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
            height: 76,
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
              style={{ display: "flex", alignItems: "center", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              <Image
                src="/bhavo-title.png"
                alt="Bhavo"
                width={150}
                height={50}
                className="bhavo-title-img"
                style={{ height: 48, width: "auto", display: "block" }}
                priority
              />
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
            <div className="desktop-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Login as User */}
              <Link
                href="/login?role=rider"
                title="Login as User"
                className="btn-shimmer"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  color: "#fff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "9px 18px",
                  borderRadius: 10,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 14px rgba(13,148,136,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(13,148,136,0.45), inset 0 1px 0 rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(13,148,136,0.32), inset 0 1px 0 rgba(255,255,255,0.18)";
                }}
              >
                Login as User
              </Link>

              {/* Login as Driver */}
              <Link
                href="/login?role=driver"
                title="Login as Driver"
                style={{
                  background: "rgba(13,148,136,0.05)",
                  border: "1.5px solid rgba(13,148,136,0.35)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#0d9488",
                  cursor: "pointer",
                  padding: "8.5px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#0d9488";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.35)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                Login as Driver
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
                href="/login?role=rider"
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(13,148,136,0.35)",
                }}
              >
                Login as User
              </Link>
              <Link
                href="/login?role=driver"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0d9488",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(13,148,136,0.35)",
                  textAlign: "center",
                  background: "rgba(13,148,136,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Login as Driver
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
