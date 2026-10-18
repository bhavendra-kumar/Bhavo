"use client";

import React, { useEffect, useState } from "react";
import { Star, Award, Heart, ThumbsUp, ShieldCheck } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

interface IRatingData {
  rating: number;
  totalReviews: number;
  fiveStarRides: number;
  fourStarRides: number;
  badge: string;
  compliments: Array<{ title: string; count: number; iconKey: string }>;
  recentReviews: Array<{ rider: string; rating: number; date: string; text: string }>;
}

export default function DriverRatings() {
  const { stats } = useDriverStore();
  const [data, setData] = useState<IRatingData | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchRatings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/driver/ratings");
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.data) {
            setData(json.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchRatings();
    return () => {
      ignore = true;
    };
  }, []);

  const currentRating = data?.rating ?? stats.rating ?? 5.0;
  const fiveStarCount = data?.fiveStarRides ?? 0;
  const fourStarCount = data?.fourStarRides ?? 0;
  const totalReviews = data?.totalReviews ?? (fiveStarCount + fourStarCount);

  const iconMap: Record<string, typeof ShieldCheck> = {
    ShieldCheck,
    ThumbsUp,
    Heart,
    Award,
  };

  const compliments = data?.compliments
    ? data.compliments.map((c) => ({
        title: c.title,
        count: c.count,
        icon: iconMap[c.iconKey] || ShieldCheck,
      }))
    : [];

  const recentReviews = data?.recentReviews || [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-500">
            <Star size={28} className="fill-amber-400" />
            <span className="text-2xl font-black text-slate-900 mt-0.5">{currentRating}</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {data?.badge || "Verified Bhavo Captain"}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Captain Performance Score</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated across {totalReviews} rated trip{totalReviews !== 1 ? "s" : ""} in the Bhavo database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xl font-black text-slate-900">{fiveStarCount}</span>
            <span className="text-[11px] text-slate-500 block font-semibold">5-Star Rides</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xl font-black text-slate-900">{fourStarCount}</span>
            <span className="text-[11px] text-slate-500 block font-semibold">4-Star Rides</span>
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <h3 className="text-base font-extrabold text-slate-900">Recent Passenger Reviews</h3>
        <div className="divide-y divide-slate-100">
          {recentReviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No passenger reviews recorded yet. Ratings from completed trips will appear here automatically.
            </p>
          ) : (
            recentReviews.map((r, i) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
