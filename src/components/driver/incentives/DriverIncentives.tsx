"use client";

import React, { useEffect, useState } from "react";
import { Award, Zap, CheckCircle2, Sparkles, Gift } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface IQuest {
  id: string;
  title: string;
  bonus: string;
  target: string;
  progress: string;
  percent: number;
  timeRemaining: string;
  active: boolean;
  completed?: boolean;
  canClaim?: boolean;
}

interface IIncentivesData {
  todayBonusEarned: number;
  weekBonusEarned: number;
  upcomingPotential: number;
  quests: IQuest[];
}

export default function DriverIncentives() {
  const { fetchDriverData } = useDriverStore();
  const { alert } = useDialog();
  const [data, setData] = useState<IIncentivesData | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/driver/incentives")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.data) {
          setData(json.data);
        }
      })
      .catch((e) => console.error(e));

    return () => {
      ignore = true;
    };
  }, []);

  const refreshIncentives = async () => {
    try {
      const res = await fetch("/api/driver/incentives");
      if (res.ok) {
        const json = await res.json();
        if (json.data) setData(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClaim = async (questId: string) => {
    setClaiming(questId);
    try {
      const res = await fetch("/api/driver/incentives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (res.ok) {
        const json = await res.json();
        await refreshIncentives();
        await fetchDriverData();
        alert({
          title: "Bonus Claimed! 🎉",
          message: json.message || "Bonus has been credited to your driver wallet.",
          confirmText: "Awesome",
          variant: "success",
        });
      }
    } catch {
      alert({
        title: "Claim Failed",
        message: "Unable to claim bonus right now. Please try again.",
        confirmText: "OK",
        variant: "danger",
      });
    } finally {
      setClaiming(null);
    }
  };

  const quests: IQuest[] = data?.quests || [
    {
      id: "quest-daily",
      title: "Daily Commute Rush Quest",
      bonus: "₹350",
      target: "Complete 10 rides today",
      progress: "7/10 Completed",
      percent: 70,
      timeRemaining: "Ends at 11:00 PM tonight",
      active: true,
    },
    {
      id: "quest-peak",
      title: "Peak Hour Surge Hunter",
      bonus: "₹200",
      target: "Complete 4 trips during morning rush (8:00 AM - 11:00 AM)",
      progress: "4/4 Completed 🎉",
      percent: 100,
      timeRemaining: "Unlocked and credited to wallet",
      active: false,
      completed: true,
    },
    {
      id: "quest-weekend",
      title: "Weekend Warrior Marathon",
      bonus: "₹1,500",
      target: "Complete 35 trips between Friday 6 PM and Sunday midnight",
      progress: "28/35 Completed",
      percent: 80,
      timeRemaining: "1 day 4 hours left",
      active: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Incentive Quests & Shift Bonuses
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Hit ride milestone targets and earn extra guaranteed cash bonuses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <span className="text-xs text-amber-800 font-bold uppercase">Today&apos;s Bonus Earned</span>
            <h3 className="text-2xl font-black text-amber-950 mt-0.5">
              ₹{data?.todayBonusEarned ?? 200}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-teal-50 border border-teal-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-xs text-teal-800 font-bold uppercase">This Week&apos;s Bonus</span>
            <h3 className="text-2xl font-black text-teal-950 mt-0.5">
              ₹{data?.weekBonusEarned ?? 1200}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <span className="text-xs text-emerald-800 font-bold uppercase">Upcoming Potential</span>
            <h3 className="text-2xl font-black text-emerald-950 mt-0.5">
              ₹{data?.upcomingPotential ?? 1850}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-5">
        <h3 className="text-base font-extrabold text-slate-900">Active Shift Quests</h3>
        <div className="space-y-4">
          {quests.map((q, i) => (
            <div
              key={q.id || i}
              className={`p-5 rounded-2xl border transition-all ${
                q.completed
                  ? "bg-emerald-50/60 border-emerald-300"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-[15px] text-slate-900">{q.title}</h4>
                    {q.completed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                        <CheckCircle2 size={11} /> Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{q.target}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-600">{q.bonus}</span>
                    <span className="text-[11px] text-slate-400 block">Cash Reward</span>
                  </div>

                  {q.canClaim && (
                    <button
                      onClick={() => handleClaim(q.id)}
                      disabled={claiming === q.id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1"
                    >
                      <Gift size={14} />
                      <span>{claiming === q.id ? "Claiming..." : "Claim Bonus"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    q.completed
                      ? "bg-emerald-500"
                      : "bg-linear-to-r from-amber-400 to-amber-500"
                  }`}
                  style={{ width: `${q.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2 text-slate-500 font-medium">
                <span>{q.progress}</span>
                <span>{q.timeRemaining}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
