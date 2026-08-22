"use client";

import React from "react";
import { User, ShieldCheck, Dog, Camera, Edit2, PhoneCall, ShieldAlert, Monitor, Key, Plus, Trash2 } from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";

export default function ProfilePage() {
  const { user } = useUserStore();

  if (!user) return null;

  const FIELDS = [
    { label: "Full Name", value: user.name },
    { label: "Email Address", value: user.email },
    { label: "Phone Number", value: "+91 98765 43210" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col: Profile Card */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="card overflow-hidden flex flex-col items-center text-center">
            {/* Banner */}
            <div className="w-full h-24 relative" style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)" }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <div className="w-20 h-20 rounded-full overflow-hidden relative" style={{ border: "3px solid white", boxShadow: "0 4px 16px rgba(13,148,136,0.2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatar ?? undefined} alt={user.name ?? undefined} className="w-full h-full object-cover bg-teal-100" />
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md bg-[#042f2e] border-2 border-white transition-transform hover:scale-110">
                  <Camera size={12} />
                </button>
              </div>
            </div>

            <div className="pt-14 pb-6 px-6 w-full">
              <h2 className="text-[16px] font-bold text-[#042f2e]">{user.name}</h2>
              <p className="text-[13px] font-medium text-[#0f766e] mt-0.5">{user.email}</p>
              
              <div className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                <ShieldCheck size={12} /> Verified User
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-2 gap-3 w-full">
                {[{ label: "Total Rides", value: "128" }, { label: "Avg Rating", value: "★ " + user.rating }].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-[#f0fdfa] border border-[#ccfbf1]">
                    <p className="font-bold text-[#042f2e] text-[16px]">{value}</p>
                    <p className="text-[10px] font-bold text-[#0d9488] uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Personal Info */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#042f2e] flex items-center gap-2">
                <User size={16} className="text-[#0d9488]" /> Personal Information
              </h3>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1]">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map(({ label, value }) => (
                <div key={label} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-[13px] font-semibold text-[#042f2e]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#042f2e] flex items-center gap-2">
                <PhoneCall size={16} className="text-[#0d9488]" /> Emergency Contacts
              </h3>
              <button className="text-[11px] font-bold text-[#0d9488] hover:text-[#0f766e] flex items-center gap-1">
                <Plus size={14} /> Add New
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { name: "Mom", phone: "+91 91234 56789" },
                { name: "Brother", phone: "+91 99887 77665" },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-teal-100 transition-colors">
                  <div>
                    <p className="text-[13px] font-bold text-[#042f2e]">{c.name}</p>
                    <p className="text-[12px] font-medium text-[#0f766e] mt-0.5">{c.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-7 h-7 rounded-md bg-slate-50 text-slate-500 hover:bg-teal-50 hover:text-teal-600 flex items-center justify-center"><Edit2 size={12} /></button>
                    <button className="w-7 h-7 rounded-md bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pet Profiles */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#042f2e] flex items-center gap-2">
                <Dog size={16} className="text-orange-500" /> Pet Profiles
              </h3>
              <button className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
                <Plus size={14} /> Add Pet
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white shadow-sm border border-orange-200">🐶</div>
                <div>
                  <p className="text-[14px] font-bold text-orange-950">Max</p>
                  <p className="text-[12px] font-medium text-orange-700">Golden Retriever · 25kg</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-7 h-7 rounded-md bg-white text-orange-600 hover:bg-orange-100 flex items-center justify-center shadow-sm"><Edit2 size={12} /></button>
                <button className="w-7 h-7 rounded-md bg-white text-rose-500 hover:bg-rose-50 flex items-center justify-center shadow-sm"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card p-6 border-t-4 border-t-rose-400">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#042f2e] flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-500" /> Security
              </h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <button className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors w-full text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Key size={14} className="text-slate-600" /></div>
                  <div>
                    <p className="text-[13px] font-bold text-[#042f2e]">Change Password</p>
                    <p className="text-[11px] font-medium text-[#0f766e]">Last changed 3 months ago</p>
                  </div>
                </div>
                <Edit2 size={14} className="text-slate-400" />
              </button>

              <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Active Sessions</p>
                <div className="flex flex-col gap-3">
                  {[
                    { device: "MacBook Pro - Chrome", location: "Bangalore, India", current: true },
                    { device: "iPhone 13 - iOS App", location: "Bangalore, India", current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Monitor size={14} className={s.current ? "text-teal-600" : "text-slate-400"} />
                        <div>
                          <p className="text-[13px] font-bold text-[#042f2e] flex items-center gap-2">
                            {s.device}
                            {s.current && <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 uppercase tracking-widest">Current</span>}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{s.location}</p>
                        </div>
                      </div>
                      {!s.current && (
                        <button className="text-[11px] font-bold text-rose-500 hover:text-rose-600">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
