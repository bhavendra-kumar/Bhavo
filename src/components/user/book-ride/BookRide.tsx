"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Clock, CarFront, Users, Wallet, Check, ChevronRight } from "lucide-react";

const vehicles = [
  { id: "eco", name: "Bhavo Eco", desc: "Affordable, compact rides", price: "₹240", capacity: 4, eta: "3 min", color: "#16a34a" },
  { id: "premium", name: "Bhavo Premium", desc: "Top-rated sedans, extra legroom", price: "₹380", capacity: 4, eta: "5 min", color: "#0d9488" },
  { id: "suv", name: "Bhavo SUV", desc: "Spacious rides for groups", price: "₹520", capacity: 6, eta: "8 min", color: "#7c3aed" },
];

export default function BookRidePage() {
  const [selectedVehicle, setSelectedVehicle] = useState("premium");
  const [isPetFriendly, setIsPetFriendly] = useState(false);

  const selected = vehicles.find((v) => v.id === selectedVehicle)!;

  return (
    <div className="flex flex-col lg:flex-row gap-5 pb-6" style={{ height: "calc(100vh - 100px)" }}>

      {/* Left Panel */}
      <div className="w-full lg:w-100 shrink-0 flex flex-col gap-4 overflow-y-auto no-scrollbar">

        {/* Location Inputs */}
        <div
          className="bg-white rounded-2xl p-5 flex flex-col gap-4"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}
        >
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Book a Ride</h2>

          <div className="relative flex flex-col gap-3">
            {/* Connecting line */}
            <div
              className="absolute left-3.75 top-5 h-[calc(100%-40px)] w-px"
              style={{ background: "linear-gradient(to bottom, #e2e8f0 0%, #e2e8f0 100%)" }}
            />

            <div className="relative z-10 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#f1f5f9", border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
              >
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
              </div>
              <input
                type="text"
                defaultValue="123 Tech Park Avenue"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.08)" }}
              />
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(13,148,136,0.1)", border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
              >
                <MapPin size={14} className="text-teal-600" />
              </div>
              <input
                type="text"
                placeholder="Where to?"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-400"
                style={{ background: "white", border: "1px solid rgba(15,23,42,0.12)" }}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div
          className="bg-white rounded-2xl p-5 flex flex-col gap-3"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}
        >
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Ride</h3>

          {vehicles.map((v) => {
            const isSelected = selectedVehicle === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: isSelected ? `${v.color}0d` : "#f8fafc",
                  border: isSelected ? `1.5px solid ${v.color}40` : "1.5px solid transparent",
                  boxShadow: isSelected ? `0 4px 16px ${v.color}20` : "none",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: isSelected ? `${v.color}18` : "rgba(15,23,42,0.06)",
                  }}
                >
                  <CarFront size={24} style={{ color: isSelected ? v.color : "#94a3b8" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900 text-sm">{v.name}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      <Users size={10} /> {v.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{v.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-slate-900 text-base">{v.price}</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${v.color}15`, color: v.color }}
                  >
                    {v.eta}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Options */}
        <div
          className="bg-white rounded-2xl p-5 flex flex-col gap-3"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => setIsPetFriendly(!isPetFriendly)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
            style={{ border: "1px solid rgba(15,23,42,0.07)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🐶</div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Pet-Friendly Ride</p>
                <p className="text-xs text-slate-500">Travel with your furry friend</p>
              </div>
            </div>
            <div
              className="w-5 h-5 rounded flex items-center justify-center transition-all"
              style={{
                background: isPetFriendly ? "#0d9488" : "rgba(15,23,42,0.08)",
              }}
            >
              {isPetFriendly && <Check size={12} className="text-white" />}
            </div>
          </button>

          <button
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            style={{ border: "1px solid rgba(15,23,42,0.07)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Wallet size={18} className="text-slate-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Payment Method</p>
                <p className="text-xs text-slate-500">Bhavo Wallet (₹1,250)</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        {/* CTA */}
        <button
          className="w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #059669 100%)",
            boxShadow: "0 8px 24px rgba(13,148,136,0.35)",
          }}
        >
          Confirm {selected.name}
          <Navigation size={17} />
        </button>
      </div>

      {/* Right Panel - Map */}
      <div
        className="flex-1 rounded-3xl overflow-hidden relative min-h-100"
        style={{
          background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
          border: "3px solid white",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* Map dot pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Roads simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#475569" strokeWidth="2" />
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#475569" strokeWidth="1" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#475569" strokeWidth="2" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#475569" strokeWidth="1" />
        </svg>

        {/* Top bar */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-center">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-800"
            style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <Clock size={15} className="text-teal-600" />
            Pickup in 5 mins
          </div>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors"
            style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <Navigation size={17} />
          </button>
        </div>

        {/* Center pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
          <div
            className="px-4 py-2 rounded-xl text-xs font-bold text-white mb-2 whitespace-nowrap"
            style={{ background: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
          >
            Set Pickup Location
          </div>
          <div className="w-0.5 h-8 bg-slate-900 opacity-60" />
          <div className="w-3 h-1.5 rounded-full bg-black/20 blur-sm" />
        </div>

        {/* Selected vehicle label */}
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            color: selected.color,
            border: `1px solid ${selected.color}30`,
          }}
        >
          <CarFront size={16} />
          {selected.name} · {selected.eta}
        </div>
      </div>
    </div>
  );
}
