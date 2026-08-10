"use client";

import React from "react";
import { MapPin, Home, Briefcase, Plus, Heart, Navigation, Edit2 } from "lucide-react";

const PLACES = [
  {
    id: 1,
    name: "Home",
    address: "Apt 4B, Serenity Heights, Sector 12",
    icon: Home,
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    glow: "rgba(59,130,246,0.3)",
    lightBg: "rgba(59,130,246,0.08)",
    tag: "Primary",
  },
  {
    id: 2,
    name: "Office",
    address: "Bhavo Headquarters, Sector 44, Cyber City",
    icon: Briefcase,
    gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    glow: "rgba(124,58,237,0.3)",
    lightBg: "rgba(124,58,237,0.08)",
    tag: "Work",
  },
  {
    id: 3,
    name: "Gym",
    address: "FitPro Center, Downtown",
    icon: Heart,
    gradient: "linear-gradient(135deg, #e11d48, #be123c)",
    glow: "rgba(225,29,72,0.3)",
    lightBg: "rgba(225,29,72,0.08)",
    tag: "Favourite",
  },
];

export default function PlacesPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
            >
              <MapPin size={18} className="text-white" />
            </div>
            Saved Places
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Your favourite destinations for quick booking.</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #0f766e, #059669)",
            boxShadow: "0 6px 20px rgba(13,148,136,0.3)",
          }}
        >
          <Plus size={16} /> Add Place
        </button>
      </div>

      {/* Places grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLACES.map((place) => (
          <div
            key={place.id}
            className="bg-white rounded-2xl p-5 cursor-pointer group transition-all hover:-translate-y-0.5 relative overflow-hidden"
            style={{
              border: "1px solid rgba(15,23,42,0.07)",
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(ellipse at top right, ${place.lightBg} 0%, transparent 70%)` }}
            />

            <div className="relative z-10 flex items-start gap-4">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  background: place.gradient,
                  boxShadow: `0 6px 18px ${place.glow}`,
                  width: "52px",
                  height: "52px",
                }}
              >
                <place.icon size={22} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-slate-900">{place.name}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: place.lightBg, color: place.gradient.includes("3b82f6") ? "#2563eb" : place.gradient.includes("7c3aed") ? "#6d28d9" : "#be123c" }}
                  >
                    {place.tag}
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{place.address}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                    style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488" }}
                  >
                    <Navigation size={11} /> Book Ride
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 size={11} /> Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <button
          className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 transition-all hover:text-teal-600 group min-h-36"
          style={{
            border: "1.5px dashed rgba(15,23,42,0.12)",
            background: "rgba(248,250,252,0.5)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform"
            style={{ border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Plus size={22} />
          </div>
          <span className="font-bold text-sm">Add New Destination</span>
        </button>
      </div>
    </div>
  );
}
