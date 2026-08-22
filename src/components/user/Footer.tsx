"use client";

import React from "react";
import Link from "next/link";
import {
  CarFront, Shield, FileText, HelpCircle,
  MapPin, Bell, BarChart3, Wallet, CalendarClock,
  Mail, Phone,
} from "lucide-react";

const QUICK_LINKS = [
  { label: "Dashboard", href: "/user/dashboard", icon: CarFront },
  { label: "Book a Ride", href: "/user/book-ride", icon: CarFront },
  { label: "My Commute", href: "/user/my-commute", icon: CalendarClock },
  { label: "Trips", href: "/user/trips", icon: MapPin },
];

const ACCOUNT_LINKS = [
  { label: "Insights", href: "/user/mobility-insights", icon: BarChart3 },
  { label: "Wallet", href: "/user/wallet", icon: Wallet },
  { label: "Notifications", href: "/user/notifications", icon: Bell },
  { label: "Places", href: "/user/places", icon: MapPin },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms", icon: FileText },
  { label: "Privacy Policy", href: "/privacy", icon: Shield },
  { label: "Help Center", href: "/help", icon: HelpCircle },
];

export default function Footer() {
  return (
    <footer
      className="w-full mt-auto shrink-0"
      style={{ background: "#042f2e", borderTop: "1px solid #115e59" }}
    >
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Brand column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#115e59" }}
            >
              <CarFront size={18} style={{ color: "#5eead4" }} />
            </div>
            <div>
              <p className="text-[22px] font-black tracking-tight leading-none bg-linear-to-r from-[#5eead4] via-[#ffffff] to-[#5eead4] bg-size-[200%_auto] bg-clip-text text-transparent animate-shine drop-shadow-[0_0_10px_rgba(45,212,191,0.6)]">BHAVO</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: "#5eead4" }}>Smart Commute</p>
            </div>
          </div>
          <p className="text-[12px] font-medium leading-relaxed" style={{ color: "#99f6e4" }}>
            Your intelligent ride companion. Fast, safe, and sustainable commutes across the city.
          </p>

          {/* Status pill */}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#134e4a", color: "#4ade80", border: "1px solid #115e59" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#5eead4" }}>Navigate</p>
          <ul className="flex flex-col gap-2">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[12px] font-medium transition-colors group"
                  style={{ color: "#ccfbf1" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#ccfbf1")}
                >
                  <Icon size={12} style={{ color: "#2dd4bf" }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account Links */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#5eead4" }}>Account</p>
          <ul className="flex flex-col gap-2">
            {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[12px] font-medium transition-colors"
                  style={{ color: "#ccfbf1" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#ccfbf1")}
                >
                  <Icon size={12} style={{ color: "#2dd4bf" }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#5eead4" }}>Support</p>
          <ul className="flex flex-col gap-2">
            {LEGAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[12px] font-medium transition-colors"
                  style={{ color: "#ccfbf1" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#ccfbf1")}
                >
                  <Icon size={12} style={{ color: "#2dd4bf" }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Contact mini-block */}
          <div className="mt-2 flex flex-col gap-1.5">
            <a href="mailto:support@bhavo.in" className="flex items-center gap-2 text-[11px] font-medium transition-colors" style={{ color: "#ccfbf1" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ccfbf1")}>
              <Mail size={11} style={{ color: "#2dd4bf" }} /> support@bhavo.in
            </a>
            <a href="tel:+911800000000" className="flex items-center gap-2 text-[11px] font-medium transition-colors" style={{ color: "#ccfbf1" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ccfbf1")}>
              <Phone size={11} style={{ color: "#2dd4bf" }} /> 1800-000-0000
            </a>
          </div>
        </div>
      </div>


    </footer>
  );
}
