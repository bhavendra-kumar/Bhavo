"use client";

import React from "react";
import { User, ShieldCheck, Dog, Camera, Edit2 } from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";

export default function ProfilePage() {
  const { user } = useUserStore();

  const FIELDS = [
    { label: "Full Name", value: user.name },
    { label: "Email Address", value: user.email },
    { label: "Phone Number", value: "+91 98765 43210" },
    { label: "Emergency Contact", value: "Mom · +91 91234 56789" },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
            >
              <User size={18} className="text-white" />
            </div>
            My Profile
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Manage your personal info and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Profile card */}
        <div
          className="lg:col-span-1 bg-white rounded-2xl overflow-hidden flex flex-col items-center text-center"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
        >
          {/* Banner */}
          <div
            className="w-full h-24 relative"
            style={{ background: "linear-gradient(135deg, #0f766e 0%, #059669 100%)" }}
          >
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            >
              <div
                className="w-20 h-20 rounded-full overflow-hidden relative"
                style={{ border: "3px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <button
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ background: "#0f172a", border: "2px solid white" }}
              >
                <Camera size={12} />
              </button>
            </div>
          </div>

          <div className="pt-14 pb-6 px-6 w-full">
            <h2 className="text-lg font-black text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            <div
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
            >
              <ShieldCheck size={12} /> Verified User
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 w-full">
              {[{ label: "Total Rides", value: "128" }, { label: "Avg Rating", value: "★ " + user.rating }].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl text-center"
                  style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.06)" }}
                >
                  <p className="font-black text-slate-900 text-lg">{value}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Personal Info */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900">Personal Information</h3>
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100"
                style={{ color: "#0d9488" }}
              >
                <Edit2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map(({ label, value }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl"
                  style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.06)" }}
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pet Profile */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Dog size={18} className="text-orange-500" /> Pet Profiles
              </h3>
              <button className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors">
                Add Pet
              </button>
            </div>

            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(251,146,60,0.12)" }}
              >
                🐶
              </div>
              <div>
                <p className="font-bold text-slate-900">Max</p>
                <p className="text-xs text-slate-500">Golden Retriever · 25kg</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
