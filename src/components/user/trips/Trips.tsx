"use client";

import React, { useState } from "react";
import { Map, MapPin, Star, Receipt, FileText, TrendingUp } from "lucide-react";

const TABS = ["Upcoming", "Active", "Completed", "Cancelled"];

const TRIPS = [
  {
    id: "TRP-8821A",
    date: "Oct 24, 2024 · 8:45 AM",
    vehicle: "Bhavo Premium",
    driver: "Rajesh K.",
    driverRating: 4.9,
    amount: "₹380",
    pickup: "123 Tech Park Avenue",
    dropoff: "Bhavo Headquarters",
    duration: "45 mins",
    distance: "12.4 km",
  },
  {
    id: "TRP-8820B",
    date: "Oct 23, 2024 · 6:30 PM",
    vehicle: "Bhavo Eco",
    driver: "Amit S.",
    driverRating: 4.7,
    amount: "₹240",
    pickup: "Bhavo Headquarters",
    dropoff: "123 Tech Park Avenue",
    duration: "55 mins",
    distance: "12.4 km",
  },
];

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState("Completed");

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
            >
              <Map size={18} className="text-white" />
            </div>
            My Trips
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Your ride history and upcoming bookings.</p>
        </div>

        {/* Stats pill */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0"
          style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.12)" }}
        >
          <TrendingUp size={15} className="text-teal-600" />
          <span className="text-sm font-bold text-teal-700">34 rides this month</span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex bg-white p-1.5 rounded-2xl w-full md:w-max overflow-x-auto no-scrollbar gap-1"
        style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.06)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 md:flex-none px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab ? "#0f172a" : "transparent",
              color: activeTab === tab ? "white" : "#94a3b8",
              boxShadow: activeTab === tab ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trip cards */}
      <div className="flex flex-col gap-4">
        {activeTab === "Completed" ? (
          TRIPS.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              style={{
                border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)",
              }}
            >
              {/* Top row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                <div>
                  <p className="text-sm font-bold text-slate-900">{trip.date}</p>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {trip.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-xl text-slate-900">{trip.amount}</span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
                  >
                    Completed
                  </span>
                </div>
              </div>

              {/* Route + Driver */}
              <div className="flex flex-col md:flex-row gap-5">
                {/* Route */}
                <div className="flex-1 relative flex flex-col justify-center">
                  <div
                    className="absolute left-2.75 top-5 bottom-5 w-px"
                    style={{ background: "#e2e8f0" }}
                  />
                  <div className="relative flex items-start gap-3 mb-6">
                    <div
                      className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "#f1f5f9", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                    >
                      <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                    </div>
                    <p className="text-sm font-medium text-slate-800 pt-0.5">{trip.pickup}</p>
                  </div>
                  <div className="relative flex items-start gap-3">
                    <div
                      className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(13,148,136,0.1)", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                    >
                      <MapPin size={10} className="text-teal-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-800 pt-0.5">{trip.dropoff}</p>
                  </div>
                </div>

                {/* Driver info */}
                <div
                  className="flex-1 p-4 rounded-xl flex flex-col gap-3"
                  style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.06)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                        style={{ background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)", color: "#475569" }}
                      >
                        {trip.driver.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{trip.driver}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Star size={11} className="text-amber-400 fill-amber-400" /> {trip.driverRating}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{trip.vehicle}</p>
                      <p className="text-xs text-slate-400">{trip.distance} · {trip.duration}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors hover:bg-white"
                      style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", color: "#475569" }}
                    >
                      <Receipt size={13} /> Receipt
                    </button>
                    <button
                      className="flex-1 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors hover:bg-white"
                      style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", color: "#475569" }}
                    >
                      <Star size={13} /> Rate Ride
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
            style={{ background: "#f8fafc", border: "1.5px dashed rgba(15,23,42,0.1)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}
            >
              <FileText size={22} className="text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No {activeTab.toLowerCase()} rides</h3>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xs">
              You don&apos;t have any {activeTab.toLowerCase()} rides to show right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
