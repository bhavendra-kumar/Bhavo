"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CarFront,
  CalendarClock,
  Map,
  BarChart3,
  Wallet,
  MapPin,
  Bell,
  User,
  Settings,
  ChevronLeft,
  LogOut,
  Bike,
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";

/* ── Nav sections for grouped layout ── */
const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
      { name: "Book Ride", href: "/user/book-ride", icon: CarFront },
      { name: "My Commute", href: "/user/my-commute", icon: CalendarClock },
      { name: "Trips", href: "/user/trips", icon: Map },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { name: "Insights", href: "/user/mobility-insights", icon: BarChart3 },
      { name: "Wallet", href: "/user/wallet", icon: Wallet },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { name: "Places", href: "/user/places", icon: MapPin },
      { name: "Notifications", href: "/user/notifications", icon: Bell },
      { name: "Profile", href: "/user/profile", icon: User },
      { name: "Settings", href: "/user/settings", icon: Settings },
    ],
  },
];

/* ── Inline SVG car icon for the animation ── */
function AnimatedCar() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" style={{ display: "block" }}>
      <rect x="2" y="3" width="18" height="6" rx="2" fill="#14b8a6" />
      <path d="M6 3 L8 0.5 L14 0.5 L16 3" fill="#0d9488" stroke="#0d9488" strokeWidth="0.5" strokeLinejoin="round" />
      <rect x="8.5" y="1.2" width="2.2" height="1.5" rx="0.3" fill="rgba(255,255,255,0.35)" />
      <rect x="11.3" y="1.2" width="2.2" height="1.5" rx="0.3" fill="rgba(255,255,255,0.25)" />
      <circle cx="20" cy="6" r="1" fill="#fbbf24">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="2" cy="6" r="0.8" fill="#f87171">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.9s" repeatCount="indefinite" />
      </circle>
      <circle cx="6" cy="9.5" r="2" fill="#1e293b" stroke="#334155" strokeWidth="0.6" />
      <circle cx="6" cy="9.5" r="0.7" fill="#475569" />
      <circle cx="16" cy="9.5" r="2" fill="#1e293b" stroke="#334155" strokeWidth="0.6" />
      <circle cx="16" cy="9.5" r="0.7" fill="#475569" />
    </svg>
  );
}
export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUserStore();

  return (
    <div
      className={`relative h-screen flex flex-col z-20 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-18" : "w-63"
      }`}
      style={{
        background: "linear-gradient(180deg, #0a0d12 0%, #0d1320 50%, #0f172a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes vehicle-drive-1 {
          0%   { left: -60px; }
          40%  { left: 120%; }
          100% { left: 120%; }
        }
        @keyframes vehicle-drive-2 {
          0%, 50% { left: -60px; }
          50.1%   { left: -60px; }
          90%     { left: 120%; }
          100%    { left: 120%; }
        }
        @keyframes road-dash {
          0%   { background-position: 0 0; }
          100% { background-position: -40px 0; }
        }
        @keyframes title-glow {
          0%, 100% { text-shadow: 0 0 6px rgba(20,184,166,0.3), 0 0 20px rgba(20,184,166,0.08); }
          50%       { text-shadow: 0 0 12px rgba(20,184,166,0.6), 0 0 36px rgba(20,184,166,0.18); }
        }
        @keyframes logo-breathe {
          0%, 100% { box-shadow: 0 0 12px rgba(20,184,166,0.25); }
          50%       { box-shadow: 0 0 22px rgba(20,184,166,0.55), 0 0 40px rgba(20,184,166,0.15); }
        }
        @keyframes headlight-beam {
          0%   { opacity: 0; }
          15%  { opacity: 0.5; }
          85%  { opacity: 0.5; }
          100% { opacity: 0; }
        }
        .sidebar-link {
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.04) !important;
          transform: translateX(2px);
        }
        .sidebar-link:active {
          transform: translateX(0px) scale(0.98);
        }
      `}</style>

      {/* ══════════════════════════════════════
          BRAND HEADER
         ══════════════════════════════════════ */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: isSidebarCollapsed ? "16px 0" : "18px 20px 14px",
          transition: "padding 0.3s",
        }}
      >
        {/* ─ Expanded ─ */}
        {!isSidebarCollapsed && (
          <Link href="/user/dashboard" className="flex flex-col w-full" style={{ textDecoration: "none", gap: "6px" }}>
            <div className="flex items-center" style={{ gap: "12px" }}>
              <Image
                src="/logo.png"
                alt="Bhavo Logo"
                width={38}
                height={38}
                className="rounded-xl shrink-0"
                style={{ animation: "logo-breathe 3s ease-in-out infinite" }}
              />
              <div className="flex flex-col" style={{ gap: "1px" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "19px",
                    letterSpacing: "2.5px",
                    background: "linear-gradient(135deg, #ffffff 0%, #5eead4 50%, #14b8a6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "title-glow 3s ease-in-out infinite",
                    lineHeight: 1.1,
                  }}
                >
                  BHAVO
                </span>
                <span style={{ fontSize: "8.5px", color: "#475569", letterSpacing: "1.8px", fontWeight: 600 }}>
                  SMART COMMUTE
                </span>
              </div>
            </div>

            {/* Road + animated car */}
            <div style={{ position: "relative", width: "100%", height: "14px", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "3px", borderRadius: "2px",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
              <div
                style={{
                  position: "absolute", bottom: "1px", left: 0, right: 0, height: "1px",
                  backgroundImage: "repeating-linear-gradient(90deg, rgba(251,191,36,0.45) 0px, rgba(251,191,36,0.45) 6px, transparent 6px, transparent 14px)",
                  backgroundSize: "20px 1px",
                  animation: "road-dash 1.2s linear infinite",
                }}
              />
              {/* Moving bike */}
              <div style={{ position: "absolute", bottom: "1px", left: "-60px", animation: "vehicle-drive-2 7s linear infinite" }}>
                <Bike size={14} color="#14b8a6" strokeWidth={2} />
              </div>
              {/* Moving car */}
              <div style={{ position: "absolute", bottom: "1px", left: "-60px", animation: "vehicle-drive-1 7s linear infinite" }}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute", bottom: "1px", left: "20px",
                      width: "22px", height: "6px", borderRadius: "50%",
                      background: "radial-gradient(ellipse at center, rgba(251,191,36,0.35), transparent 70%)",
                      animation: "headlight-beam 5s linear infinite",
                      filter: "blur(2px)",
                    }}
                  />
                  <AnimatedCar />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ─ Collapsed ─ */}
        {isSidebarCollapsed && (
          <Link href="/user/dashboard" className="flex items-center justify-center transition-all duration-300">
            <Image
              src="/logo.png"
              alt="Bhavo Logo"
              width={38}
              height={38}
              className="rounded-xl"
              style={{ animation: "logo-breathe 3s ease-in-out infinite" }}
            />
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={`absolute -right-3 top-7 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 z-30 cursor-pointer ${
          isSidebarCollapsed ? "rotate-180" : ""
        }`}
        style={{
          background: "linear-gradient(135deg, #1e293b, #1a2332)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          color: "#94a3b8",
        }}
      >
        <ChevronLeft size={13} />
      </button>

      {/* ══════════════════════════════════════
          NAVIGATION
         ══════════════════════════════════════ */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          padding: isSidebarCollapsed ? "12px 8px" : "8px 12px",
          transition: "padding 0.3s",
        }}
      >
        {NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={section.label} style={{ marginBottom: "4px" }}>
            {/* Section label */}
            {!isSidebarCollapsed && (
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "1.6px",
                  color: "#334155",
                  padding: sectionIdx === 0 ? "8px 12px 8px" : "16px 12px 8px",
                  userSelect: "none",
                }}
              >
                {section.label}
              </div>
            )}

            {/* Collapsed: thin divider between groups */}
            {isSidebarCollapsed && sectionIdx > 0 && (
              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.04)",
                  margin: "8px 6px",
                }}
              />
            )}

            {/* Nav items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className="sidebar-link relative flex items-center rounded-lg"
                    style={{
                      padding: isSidebarCollapsed ? "10px 0" : "9px 12px",
                      justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                      gap: "12px",
                      background: isActive
                        ? "linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(16,185,129,0.06) 100%)"
                        : "transparent",
                      borderLeft: isActive ? "2px solid #14b8a6" : "2px solid transparent",
                      textDecoration: "none",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: isActive ? "rgba(20,184,166,0.12)" : "transparent",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <item.icon
                        size={18}
                        style={{
                          color: isActive ? "#2dd4bf" : "#536480",
                          transition: "color 0.2s",
                        }}
                      />
                    </div>

                    {/* Label */}
                    {!isSidebarCollapsed && (
                      <span
                        style={{
                          fontSize: "13.5px",
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? "#e2e8f0" : "#7a8ba5",
                          whiteSpace: "nowrap",
                          transition: "color 0.2s",
                          letterSpacing: "0.2px",
                        }}
                      >
                        {item.name}
                      </span>
                    )}

                    {/* Active glow dot */}
                    {isActive && !isSidebarCollapsed && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#14b8a6",
                          boxShadow: "0 0 8px rgba(20,184,166,0.7)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════
          LOGOUT FOOTER
         ══════════════════════════════════════ */}
      <div
        className="shrink-0"
        style={{
          padding: isSidebarCollapsed ? "12px 8px" : "12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          className="sidebar-link flex items-center rounded-lg w-full cursor-pointer"
          style={{
            padding: isSidebarCollapsed ? "10px 0" : "9px 12px",
            justifyContent: isSidebarCollapsed ? "center" : "flex-start",
            gap: "12px",
            background: "transparent",
            border: "none",
            color: "#536480",
            transition: "color 0.2s",
          }}
          title={isSidebarCollapsed ? "Log Out" : undefined}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#536480")}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <LogOut size={18} />
          </div>
          {!isSidebarCollapsed && (
            <span style={{ fontSize: "13.5px", fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "0.2px" }}>
              Log Out
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
