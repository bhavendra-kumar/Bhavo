"use client";

import React from "react";
import { Sparkles, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypographyH1, TypographyP } from "@/components/ui/typography";

export default function WelcomeWidget() {
  const { user } = useUserStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div
      className="relative rounded-3xl overflow-hidden text-white"
      style={{
        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #059669 100%)",
        boxShadow: "0 20px 60px -12px rgba(13,148,136,0.45), 0 4px 16px rgba(0,0,0,0.1)",
        minHeight: "200px",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
          transform: "translateY(40%)",
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 p-8">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            {/* Badge */}
            <Badge variant="outline" className="bg-white/15 backdrop-blur-sm border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-none">
              <Sparkles size={12} className="text-teal-200 mr-2" />
              AI Commute Active
            </Badge>

            {/* Heading */}
            <TypographyH1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 border-none">
              {greeting}, {user.name.split(" ")[0]} 👋
            </TypographyH1>
            <TypographyP className="text-teal-100 text-sm md:text-base leading-relaxed max-w-lg opacity-90 not-first:mt-0">
              Your office commute is scheduled for{" "}
              <span className="font-bold text-white">8:45 AM</span>. Traffic is lighter today —
              saving you{" "}
              <span className="font-bold text-white">~12 minutes</span>.
            </TypographyP>

            {/* Inline stats */}
            <div className="flex flex-wrap gap-4 mt-5">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <Clock size={14} className="text-teal-200" />
                <span className="text-xs font-semibold text-white">Pickup at 8:45 AM</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <TrendingUp size={14} className="text-teal-200" />
                <span className="text-xs font-semibold text-white">12 min saved today</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex md:flex-col gap-3 shrink-0">
            <Button
              variant="secondary"
              className="bg-white text-teal-700 hover:bg-teal-50 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg h-10 px-5"
            >
              View Route
              <ArrowRight size={15} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              className="rounded-xl font-semibold transition-all text-white/80 hover:text-white hover:bg-white/10 border-white/20 bg-transparent h-10 px-5 shadow-none"
            >
              Skip Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
