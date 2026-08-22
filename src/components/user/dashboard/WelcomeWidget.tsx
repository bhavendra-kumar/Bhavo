"use client";

import React from "react";
import { Sparkles, ArrowRight, Clock, MapPin } from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";

export default function WelcomeWidget() {
  const { user } = useUserStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative rounded-3xl overflow-hidden text-white bg-[#0a0f1c] shadow-[0_8px_30px_rgba(10,15,28,0.4)]">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }}
      />

      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row gap-8 justify-between items-start">
        <div className="flex-1 max-w-2xl">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <Sparkles size={14} className="text-teal-400" />
            <span className="text-[11px] font-semibold text-teal-50 uppercase tracking-widest">AI Commute Active</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            {greeting}, {user?.name?.split(" ")[0] ?? "User"}.
          </h1>
          
          <p className="text-slate-300 text-[15px] md:text-[17px] leading-relaxed max-w-lg">
            Your office commute is on track for <strong className="text-white font-semibold">8:45 AM</strong>. 
            Traffic is lighter today, saving you approximately <strong className="text-teal-400 font-semibold">12 minutes</strong> on your route.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button className="h-11 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-semibold text-[14px] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              View Live Route <ArrowRight size={16} />
            </button>
            <button className="h-11 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-[14px] transition-all">
              Modify Schedule
            </button>
          </div>
        </div>

        {/* Right side live status card */}
        <div className="w-full md:w-72 shrink-0 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest">Current Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[12px] font-medium text-teal-400">Monitoring</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Clock size={14} className="text-slate-300" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white mb-0.5">Estimated Pickup</p>
              <p className="text-[16px] font-bold text-teal-400">8:45 AM</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-slate-300" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white mb-0.5">Arrival at HQ</p>
              <p className="text-[16px] font-bold text-teal-400">9:30 AM <span className="text-slate-400 font-medium text-[12px] ml-1">(-12m)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
