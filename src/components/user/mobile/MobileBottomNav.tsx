"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CarFront, CalendarClock, Map, Menu
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

const NAV_TABS = [
  { name: "Home", href: "/user/dashboard", icon: LayoutDashboard },
  { name: "Book Ride", href: "/user/book-ride", icon: CarFront },
  { name: "Commute", href: "/user/my-commute", icon: CalendarClock },
  { name: "Trips", href: "/user/trips", icon: Map },
];

export default function MobileBottomNav({ onOpenMenu, isMenuOpen }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#03201e]/96 backdrop-blur-2xl border-t border-white/8 flex items-center justify-around px-2 pt-1 select-none shadow-[0_-6px_25px_rgba(0,0,0,0.35)]"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
        height: "calc(60px + max(env(safe-area-inset-bottom, 0px), 8px))",
      }}
    >
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 group relative active:scale-90"
            style={{ minHeight: "46px" }}
          >
            {/* Active Pill Glow Background */}
            <div
              className={`w-12 h-7.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "bg-teal-400/20 text-[#2dd4bf] shadow-[0_0_14px_rgba(45,212,191,0.3)]"
                  : "text-slate-400 group-hover:text-slate-200"
              }`}
            >
              <Icon size={19} className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-105 stroke-[2.2]" : "stroke-[1.8]"}`} />
            </div>

            <span
              className={`text-[10.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                isActive ? "text-[#2dd4bf]" : "text-slate-400 group-hover:text-slate-300"
              }`}
            >
              {tab.name}
            </span>

            {/* Micro active glowing pill indicator */}
            {isActive && (
              <span className="absolute bottom-0.5 w-3.5 h-0.8 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
            )}
          </Link>
        );
      })}

      {/* 5th Tab: App Menu Sheet Trigger */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 group relative active:scale-90 cursor-pointer"
        style={{ minHeight: "46px" }}
        aria-label="More Features Menu"
      >
        <div
          className={`w-12 h-7.5 rounded-full flex items-center justify-center transition-all duration-200 ${
            isMenuOpen
              ? "bg-teal-400/20 text-[#2dd4bf] shadow-[0_0_14px_rgba(45,212,191,0.3)]"
              : "text-slate-400 group-hover:text-slate-200"
          }`}
        >
          <Menu size={19} className={`shrink-0 transition-transform duration-200 ${isMenuOpen ? "scale-105 stroke-[2.2]" : "stroke-[1.8]"}`} />
        </div>

        <span
          className={`text-[10.5px] font-bold tracking-tight mt-0.5 transition-colors ${
            isMenuOpen ? "text-[#2dd4bf]" : "text-slate-400 group-hover:text-slate-300"
          }`}
        >
          Menu
        </span>

        {isMenuOpen && (
          <span className="absolute bottom-0.5 w-3.5 h-0.8 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
        )}
      </button>
    </nav>
  );
}
