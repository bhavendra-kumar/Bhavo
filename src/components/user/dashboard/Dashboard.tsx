"use client";

import React from "react";
import {
  Sparkles, Navigation, Clock, MapPin, CarFront, Route,
  CalendarClock, ArrowRight, Star, Dog, Plus
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ─── Dashboard ──────────────────────────── */
export default function DashboardPage() {
  const { user } = useUserStore();
  const router = useRouter();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* Hero */}
      <div className="card p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="pill-teal inline-flex items-center gap-1.5">
                <Sparkles size={10} /> Auto Booking: Active
              </span>
            </div>

            <h2 className="text-[20px] font-bold leading-snug mt-3" style={{ color: "#042f2e" }}>
              {greeting}, {user?.name?.split(" ")[0] ?? "there"} —<br />
              Your commute is on track for{" "}
              <span style={{ color: "#14b8a6" }}>8:45 AM</span>.
            </h2>
            <p className="text-[13px] font-medium mt-2" style={{ color: "#0f766e" }}>
              <span className="text-amber-600 font-bold">Traffic Alert:</span> Moderate congestion on NH-44. We&apos;ve adjusted your pickup earlier by 5 mins to compensate.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/user/my-commute"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "#0d9488" }}
            >
              View Route <ArrowRight size={14} />
            </Link>
            <button
              className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ccfbf1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")}
            >
              Modify Schedule
            </button>
          </div>
        </div>

        <div className="hidden md:block w-px" style={{ background: "#ccfbf1" }} />

        {/* Upcoming Ride */}
        <div className="md:w-70 shrink-0 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>Upcoming Ride</p>
            <span className="pill-slate">In 45 mins</span>
          </div>
          <div className="relative pl-5 flex flex-col gap-5">
            <div className="absolute left-1.75 top-2 bottom-6 w-px" style={{ background: "#99f6e4" }} />
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white" style={{ borderColor: "#5eead4" }} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1 mb-0.5" style={{ color: "#0f766e" }}>
                  <Clock size={10} /> 8:45 AM · Pickup
                </p>
                <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>123 Tech Park Avenue</p>
                <p className="text-[12px] font-medium" style={{ color: "#0f766e" }}>Block B, Main Gate</p>
              </div>
            </div>
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#14b8a6" }}>
                <MapPin size={8} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#0f766e" }}>~9:30 AM · Drop-off</p>
                <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>Bhavo Headquarters</p>
                <p className="text-[12px] font-medium" style={{ color: "#0f766e" }}>Sector 44, Cyber City</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid #ccfbf1" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#ccfbf1" }}>
                <CarFront size={16} style={{ color: "#0d9488" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>Premium Sedan</p>
                <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: "#0f766e" }}>
                  Rajesh K. · <Star size={10} className="text-amber-400 fill-amber-400" /> 4.9
                </p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90" style={{ background: "#0d9488" }}>
              <Navigation size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[15px] font-bold mb-3 tracking-tight" style={{ color: "#042f2e" }}>Book a Ride</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Book Now", icon: CarFront, href: "/user/book-ride" },
            { label: "Schedule Ride", icon: CalendarClock, href: "/user/book-ride?tab=schedule" },
            { label: "My Commute", icon: Route, href: "/user/my-commute" },
            { label: "Pet Ride", icon: Dog, href: "/user/book-ride?tab=pet" },
          ].map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className="card p-4 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-teal-50"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#ccfbf1" }}>
                <Icon size={18} style={{ color: "#0d9488" }} />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Rides */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-bold tracking-tight" style={{ color: "#042f2e" }}>Your Scheduled Rides</p>
          <button
            onClick={() => router.push("/user/book-ride?tab=schedule")}
            className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors" style={{ color: "#0d9488" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0f766e")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#0d9488")}
          >
            <Plus size={14} /> Add New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Morning Commute", time: "Mon-Fri · 8:45 AM", to: "HQ Office", vehicle: "Sedan" },
            { title: "Evening Return", time: "Mon-Fri · 6:30 PM", to: "Home", vehicle: "SUV" },
            { title: "Airport Drop", time: "Sat, Oct 25 · 4:00 AM", to: "Terminal 2", vehicle: "Premium" },
          ].map((ride, i) => (
            <div key={i} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "#042f2e" }}>{ride.title}</p>
                  <p className="text-[12px] font-medium mt-0.5 flex items-center gap-1.5" style={{ color: "#0f766e" }}>
                    <CalendarClock size={12} /> {ride.time}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <CarFront size={14} style={{ color: "#0d9488" }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #e6faf8" }}>
                <p className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "#0f766e" }}>
                  <MapPin size={11} className="text-teal-400" /> To: {ride.to}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-teal-50 text-teal-700">
                  {ride.vehicle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
