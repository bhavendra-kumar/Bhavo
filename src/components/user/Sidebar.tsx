"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CarFront, CalendarClock, Map,
  BarChart3, Wallet, MapPin, User, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, LifeBuoy,
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

const NAV_ITEMS = [
  {
    section: "MAIN",
    links: [
      { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
      { name: "Book Ride", href: "/user/book-ride", icon: CarFront },
      { name: "My Commute", href: "/user/my-commute", icon: CalendarClock },
      { name: "Trips", href: "/user/trips", icon: Map },
    ],
  },
  {
    section: "FINANCE",
    links: [
      { name: "Insights", href: "/user/mobility-insights", icon: BarChart3 },
      { name: "Wallet", href: "/user/wallet", icon: Wallet },
    ],
  },
  {
    section: "ACCOUNT",
    links: [
      { name: "Places", href: "/user/places", icon: MapPin },
      { name: "Raise a Ticket", href: "/user/support", icon: LifeBuoy },
      { name: "Profile", href: "/user/profile", icon: User },
      { name: "Settings", href: "/user/settings", icon: Settings },
    ],
  },
];

/* ── Dark Premium Sidebar Colors ─────────────────────────────────────── */
const BG = "#042f2e";
const BG_HOVER = "rgba(255, 255, 255, 0.08)";
const BG_ACTIVE = "rgba(20, 184, 166, 0.16)";
const BORDER = "rgba(255, 255, 255, 0.08)";
const ACCENT = "#2dd4bf";
const SECTION_LABEL = "#94a3b8"; // Clean readable neutral slate
const TEXT_INACTIVE = "#cbd5e1"; // Crisp light slate text (not green)
const TEXT_ACTIVE = "#ffffff";   // High-contrast pure white

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSidebarCollapsed: collapsed, toggleSidebar } = useUserStore();
  const { confirm } = useDialog();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "You'll need to log back in to access your account.",
      confirmText: "Sign out",
      cancelText: "Stay",
      variant: "warning",
    });
    if (!ok) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside
      className="relative h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? "60px" : "250px", background: BG, borderRight: `1px solid ${BORDER}` }}
    >
      {/* ── Collapse Toggle ─────────────── */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="absolute -right-3.5 top-5.5 z-50 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: "#ffffff",
          border: `1.5px solid ${BORDER}`,
          color: ACCENT,
          boxShadow: "0 2px 8px rgba(13,148,136,0.18)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = ACCENT;
          el.style.color = "#ffffff";
          el.style.boxShadow = "0 4px 14px rgba(13,148,136,0.4)";
          el.style.borderColor = ACCENT;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#ffffff";
          el.style.color = ACCENT;
          el.style.boxShadow = "0 2px 8px rgba(13,148,136,0.18)";
          el.style.borderColor = BORDER;
        }}
      >
        {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
      </button>
      {/* ── Logo ─────────────────────── */}
      <div
        className="flex items-center gap-3.5 h-20 px-5 shrink-0 overflow-hidden relative"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white shadow-sm"
          style={{ width: 44, height: 44 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/trimmed-logo.png" alt="Bhavo Logo" className="w-full h-full object-contain p-1" />
        </div>

        {!collapsed && (
          <div className="flex flex-col leading-none overflow-hidden group cursor-default">
            <span className="text-[26px] font-black tracking-tight flex items-center gap-1 relative bg-linear-to-r from-[#5eead4] via-[#ffffff] to-[#5eead4] bg-size-[200%_auto] bg-clip-text text-transparent animate-shine drop-shadow-[0_0_10px_rgba(45,212,191,0.6)]">
              BHAVO
              {/* Vehicle Animation */}
              <CarFront size={18} className="text-[#2dd4bf] opacity-0 group-hover:opacity-100 transition-opacity absolute left-28 animate-drive" />
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase mt-1.5 text-slate-300">
              Smart Commute
            </span>
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3">
        {NAV_ITEMS.map(({ section, links }) => (
          <div key={section} className="mb-1">
            {/* Section Label */}
            {!collapsed && (
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-4 pt-3 pb-1"
                style={{ color: SECTION_LABEL }}
              >
                {section}
              </p>
            )}
            {collapsed && <div className="h-3" />}

            {/* Links */}
            {links.map(({ name, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? name : undefined}
                  className="relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-150 group"
                  style={{
                    background: isActive ? BG_ACTIVE : "transparent",
                    color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE,
                    borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = BG_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Icon
                    size={16}
                    className="shrink-0 transition-colors"
                    style={{ color: isActive ? ACCENT : "#94a3b8" }}
                  />

                  {!collapsed && (
                    <span className="text-[13px] font-medium flex-1">{name}</span>
                  )}

                  {/* Active dot indicator */}
                  {isActive && !collapsed && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: ACCENT }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User / Log Out Footer ─────── */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        {collapsed ? (
          /* Collapsed: just avatar */
          <div className="flex justify-center">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="text-[11px] font-bold bg-teal-600 text-white">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          /* Expanded: avatar row + Log Out below */
          <div className="flex flex-col gap-1.5">
            {/* User row */}
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl" style={{ background: BG_HOVER, border: `1px solid ${BORDER}` }}>
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="text-[12px] font-bold bg-teal-600 text-white">
                  {user?.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate text-white leading-snug">{user?.name || "User"}</p>
                <p className="text-[11px] font-medium mt-0.5 text-slate-300">Commuter</p>
              </div>
            </div>

            {/* Log Out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left transition-colors"
              style={{ color: TEXT_INACTIVE }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = BG_HOVER;
                (e.currentTarget as HTMLElement).style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = TEXT_INACTIVE;
              }}
            >
              <LogOut size={15} />
              <span className="text-[13px] font-medium">Log Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
