"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
      style={{ background: "#042f2e", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="flex flex-col gap-2">
          <div>
            <Image
              src="/bhavo-title.png"
              alt="Bhavo"
              width={120}
              height={40}
              className="bhavo-title-img h-8.5 w-auto object-contain"
            />
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-300">Smart Commute</p>
          </div>
          <p className="text-[12px] font-medium leading-relaxed text-slate-300">
            Your intelligent ride companion. Fast, safe, and sustainable commutes across the city.
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full text-slate-200" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Navigate</p>
          <ul className="flex flex-col gap-2">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                  style={{ color: "#cbd5e1" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  <Icon size={13} style={{ color: "#2dd4bf" }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Account</p>
          <ul className="flex flex-col gap-2">
            {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                  style={{ color: "#cbd5e1" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  <Icon size={13} style={{ color: "#2dd4bf" }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Support</p>
          <ul className="flex flex-col gap-2">
            {LEGAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                  style={{ color: "#cbd5e1" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  <Icon size={13} style={{ color: "#2dd4bf" }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-col gap-1.5">
            <a href="mailto:support@bhavo.in" className="flex items-center gap-2 text-[12px] font-medium transition-colors" style={{ color: "#cbd5e1" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}>
              <Mail size={12} style={{ color: "#2dd4bf" }} /> support@bhavo.in
            </a>
            <a href="tel:+911800000000" className="flex items-center gap-2 text-[12px] font-medium transition-colors" style={{ color: "#cbd5e1" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}>
              <Phone size={12} style={{ color: "#2dd4bf" }} /> 1800-000-0000
            </a>
          </div>
        </div>
      </div>

    </footer>
  );
}
