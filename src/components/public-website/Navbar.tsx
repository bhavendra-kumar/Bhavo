"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ChevronRight, Sparkles, Clock } from "lucide-react";
import { useScrolled } from "./landing-page/hooks";
import { NAV_LINKS } from "./landing-page/constants";

export default function Navbar() {
  const scrolled = useScrolled();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll and listen for Escape when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);

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
        className={`public-navbar ${menuOpen ? "menu-is-open" : ""}`}
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
        <div className="navbar-inner">
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
                className="bhavo-title-img navbar-logo-img"
                priority
              />
            </div>
          </Link>

          {/* Center Links (Desktop only) */}
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

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              className="hamburger-btn"
            >
              {menuOpen ? <X size={24} color="#0f172a" /> : <Menu size={24} color="#0f172a" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Dedicated Mobile Slide-Out Drawer & Full-Viewport Backdrop (Rendered via React Portal directly to body) */}
      {mounted &&
        createPortal(
          <div className={`mobile-nav-portal-root ${menuOpen ? "open" : ""}`}>
            <div
              className={`mobile-nav-backdrop ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(false)}
              aria-hidden={!menuOpen}
            />

            <aside
              id="mobile-nav-drawer"
              className={`mobile-nav-drawer ${menuOpen ? "open" : ""}`}
              role="dialog"
              aria-modal={menuOpen}
              aria-label="Mobile Navigation"
            >
              {/* Drawer Header */}
              <div className="mobile-drawer-header">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  <Image
                    src="/bhavo-title.png"
                    alt="BHAVO"
                    width={130}
                    height={42}
                    className="bhavo-title-img navbar-logo-img"
                    style={{ height: 38, width: "auto", display: "block" }}
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="drawer-close-btn"
                >
                  <X size={24} color="#0f172a" />
                </button>
              </div>

              {/* Drawer Body Scrollable Content */}
              <div className="mobile-drawer-body">
                {/* Primary CTA: Book a Ride */}
                <Link
                  href="/user/book-ride"
                  onClick={() => setMenuOpen(false)}
                  className="drawer-primary-cta btn-shimmer"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="cta-icon-box">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Start a Ride</div>
                      <div style={{ fontSize: 11.5, opacity: 0.9, fontWeight: 500 }}>Point-to-point city trips</div>
                    </div>
                  </div>
                  <ArrowRight size={18} />
                </Link>

                {/* Commute CTA */}
                <Link
                  href="/user/commutes/new"
                  onClick={() => setMenuOpen(false)}
                  className="drawer-secondary-cta"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="commute-icon-box">
                      <Clock size={16} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", lineHeight: 1.2 }}>
                        Schedule Daily Commute
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                        Automated weekday office travel
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </Link>

                {/* Navigation Links Group */}
                <div className="drawer-section-heading">EXPLORE BHAVO</div>
                <div className="drawer-links-list">
                  {NAV_LINKS.map((link) => {
                    const label = getLabel(link);
                    const href = getHref(link);
                    const active = isActive(link);
                    return (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`drawer-nav-link ${active ? "active" : ""}`}
                      >
                        <span>{label}</span>
                        {active ? (
                          <span className="drawer-active-pill">Current</span>
                        ) : (
                          <ChevronRight size={15} color="#cbd5e1" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="drawer-divider" />

                {/* Driver Network */}
                <div className="drawer-section-heading">CAPTAIN &amp; DRIVER NETWORK</div>
                <div className="drawer-driver-actions">
                  <Link
                    href="/login?role=driver"
                    onClick={() => setMenuOpen(false)}
                    className="drawer-driver-signin-btn"
                  >
                    <span>Captain Sign-In</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/signup?role=driver"
                    onClick={() => setMenuOpen(false)}
                    className="drawer-driver-register-btn"
                  >
                    <span>Become a Driver Partner</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="drawer-divider" />

                {/* Rider Sign In */}
                <div className="drawer-section-heading">RIDER ACCOUNT</div>
                <div className="drawer-rider-actions">
                  <Link
                    href="/login?role=rider"
                    onClick={() => setMenuOpen(false)}
                    className="drawer-rider-signin-btn"
                  >
                    <span>Rider Sign-In</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/signup?role=rider"
                    onClick={() => setMenuOpen(false)}
                    className="drawer-rider-register-btn"
                  >
                    <span>Create Rider Account</span>
                    <ChevronRight size={15} color="#64748b" />
                  </Link>
                </div>

                {/* Footer Note */}
                <div className="drawer-footer-note">
                  <div className="drawer-footer-brand">BHAVO Mobility Platform</div>
                  <div className="drawer-footer-sub">Transparent Upfront Fares • Scheduled Commutes</div>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}

      <style>{`
        .navbar-inner {
          max-width: 1360px;
          margin: 0 auto;
          padding: 0 24px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: relative;
        }

        .navbar-logo-img {
          height: 48px;
          width: auto;
          display: block;
        }

        .hamburger-btn {
          display: none;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .hamburger-btn:hover,
        .hamburger-btn:active {
          background: rgba(0, 0, 0, 0.05);
        }

        /* Mobile Portal Root */
        .mobile-nav-portal-root {
          position: fixed;
          inset: 0;
          z-index: 99998;
          pointer-events: none;
        }

        .mobile-nav-portal-root.open {
          pointer-events: auto;
        }

        @media (min-width: 1181px) {
          .mobile-nav-portal-root {
            display: none !important;
          }
        }

        /* Backdrop spanning the full screen */
        .mobile-nav-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 99998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
        }

        .mobile-nav-backdrop.open {
          opacity: 1;
          pointer-events: auto;
        }

        /* Slide-out Drawer */
        .mobile-nav-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          height: 100dvh;
          max-height: 100dvh;
          width: min(340px, 86vw);
          background: #ffffff;
          z-index: 99999;
          box-shadow: -8px 0 36px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          overflow: hidden;
          box-sizing: border-box;
        }

        .mobile-nav-drawer.open {
          transform: translateX(0);
          pointer-events: auto;
        }

        .mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: max(16px, env(safe-area-inset-top, 16px)) 18px 14px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.07);
          background: #ffffff;
          flex-shrink: 0;
        }

        .drawer-close-btn {
          background: #f1f5f9;
          border: none;
          border-radius: 10px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .drawer-close-btn:active {
          background: #e2e8f0;
        }

        .mobile-drawer-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 18px 18px max(24px, env(safe-area-inset-bottom, 24px));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .drawer-primary-cta {
          background: linear-gradient(135deg, #075b55 0%, #0d9488 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 13px 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 18px rgba(7, 91, 85, 0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .drawer-primary-cta:active {
          transform: scale(0.98);
        }

        .cta-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .drawer-secondary-cta {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          text-decoration: none;
          padding: 11px 14px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.15s ease;
        }

        .drawer-secondary-cta:active {
          background: #f1f5f9;
        }

        .commute-icon-box {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(13, 148, 136, 0.12);
          color: #0d9488;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .drawer-section-heading {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #94a3b8;
          margin: 6px 0 2px;
        }

        .drawer-links-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .drawer-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14.5px;
          font-weight: 600;
          color: #1e293b;
          text-decoration: none;
          padding: 11px 12px;
          border-radius: 10px;
          transition: all 0.15s ease;
          min-height: 44px;
          box-sizing: border-box;
        }

        .drawer-nav-link:active {
          background: rgba(13, 148, 136, 0.08);
          color: #075b55;
        }

        .drawer-nav-link.active {
          background: rgba(13, 148, 136, 0.12);
          color: #075b55;
          font-weight: 700;
        }

        .drawer-active-pill {
          font-size: 10px;
          font-weight: 800;
          color: #075b55;
          background: #ccfbf1;
          padding: 2px 8px;
          border-radius: 99px;
          text-transform: uppercase;
        }

        .drawer-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 2px 0;
        }

        .drawer-driver-actions,
        .drawer-rider-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .drawer-driver-signin-btn {
          font-size: 13.5px;
          font-weight: 700;
          color: #ea580c;
          text-decoration: none;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(234, 88, 12, 0.35);
          background: rgba(234, 88, 12, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 44px;
          box-sizing: border-box;
        }

        .drawer-driver-register-btn {
          font-size: 13.5px;
          font-weight: 700;
          color: #c2410c;
          text-decoration: none;
          padding: 11px 14px;
          background: #fff7ed;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 44px;
          box-sizing: border-box;
        }

        .drawer-rider-signin-btn {
          font-size: 14px;
          font-weight: 700;
          color: #075b55;
          text-decoration: none;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(7, 91, 85, 0.35);
          background: rgba(7, 91, 85, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 44px;
          box-sizing: border-box;
        }

        .drawer-rider-register-btn {
          font-size: 13.5px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 44px;
          box-sizing: border-box;
        }

        .drawer-footer-note {
          padding-top: 10px;
          margin-top: 4px;
          text-align: center;
        }

        .drawer-footer-brand {
          font-size: 11.5px;
          font-weight: 700;
          color: #64748b;
        }

        .drawer-footer-sub {
          font-size: 10.5px;
          color: #94a3b8;
          margin-top: 2px;
        }

        @media (max-width: 1180px) {
          .public-navbar {
            background: #ffffff !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
            box-shadow: 0 2px 14px rgba(0, 0, 0, 0.05) !important;
            z-index: 950 !important;
            transition: opacity 0.25s ease, visibility 0.25s ease !important;
          }
          .public-navbar.menu-is-open {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          .nav-links {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }

        @media (max-width: 768px) {
          .desktop-actions {
            display: none !important;
          }
          .navbar-inner {
            height: 64px !important;
            padding: 0 16px !important;
          }
          .navbar-logo-img {
            height: 38px !important;
          }
          .mobile-drawer-header {
            height: 64px !important;
            padding: 0 16px !important;
            box-sizing: border-box;
          }
          .mobile-nav-drawer {
            width: 100% !important;
            max-width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
