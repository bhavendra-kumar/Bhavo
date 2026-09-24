"use client";

import React from "react";
import { Star, Award, Heart, ThumbsUp, ShieldCheck } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

export default function DriverRatings() {
  const { stats } = useDriverStore();

  const compliments = [
    { title: "Smooth & Safe Driving", count: 142, icon: ShieldCheck },
    { title: "Polite & Professional", count: 98, icon: ThumbsUp },
    { title: "Clean & Odor-free Car", count: 86, icon: Heart },
    { title: "Punctual & Quick Pickup", count: 64, icon: Award },
  ];

  const recentReviews = [
    { rider: "Dr. Sunita Rao", rating: 5, date: "Yesterday", text: "Exceptional driving! Very peaceful ride, reached hospital right on time." },
    { rider: "Aarav Sharma", rating: 5, date: "2 days ago", text: "Car was spotless and AC was perfect. Highly recommended captain!" },
    { rider: "Kunal Mehra", rating: 5, date: "3 days ago", text: "Great conversation and courteous behavior. 5 stars!" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Captain Ratings & Feedback
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Passenger ratings, badge compliments, and performance standings
        </p>
      </div>

      {/* Main Score Hero */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-500">
            <Star size={28} className="fill-amber-400" />
            <span className="text-2xl font-black text-slate-900 mt-0.5">{stats.rating}</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Top 5% Rated Captain
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Excellent Performance Score</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated across your last 500 completed rides (98% 5-Star reviews).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xl font-black text-slate-900">488</span>
            <span className="text-[11px] text-slate-500 block font-semibold">5-Star Rides</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xl font-black text-slate-900">12</span>
            <span className="text-[11px] text-slate-500 block font-semibold">4-Star Rides</span>
          </div>
        </div>
      </div>

      {/* Compliments Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <h3 className="text-base font-extrabold text-slate-900">Passenger Compliments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {compliments.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-lg font-black text-slate-900">{c.count}</span>
                  <p className="text-xs font-semibold text-slate-600 leading-tight">{c.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <h3 className="text-base font-extrabold text-slate-900">Recent Passenger Reviews</h3>
        <div className="divide-y divide-slate-100">
          {recentReviews.map((r, i) => (
            <div key={i} className="py-3.5 first:pt-1 last:pb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[14px] text-slate-800">{r.rider}</span>
                  <div className="flex items-center text-amber-400">
                    {[...Array(r.rating)].map((_, idx) => (
                      <Star key={idx} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">{r.date}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 italic">&ldquo;{r.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
