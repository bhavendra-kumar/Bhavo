"use client";

import React from "react";
import { Wallet, ArrowUpRight } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DriverEarnings() {
  const { stats, driverProfile } = useDriverStore();
  const { alert, confirm } = useDialog();
  const cashoutAmount = driverProfile?.walletBalance || 4250;

  const handleInstantCashout = async () => {
    const ok = await confirm({
      title: `Instant Transfer ₹${cashoutAmount}?`,
      message:
        "Funds will be instantly transferred to your linked bank account (HDFC Bank •••• 4921) via IMPS/UPI. Zero processing fee.",
      confirmText: "Transfer Now",
      cancelText: "Cancel",
      variant: "success",
    });

    if (ok) {
      alert({
        title: "Payout Transferred Successfully! 🎉",
        message: `₹${cashoutAmount} has been sent to your bank account. Reference ID: BHAVO-PAY-${Date.now().toString().slice(-6)}.`,
        confirmText: "Done",
        variant: "success",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Earnings & Bank Transfers
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time income metrics, trip payouts, and instant withdrawals
        </p>
      </div>

      {/* Top Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Wallet Balance */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-[#042f2e] via-[#064e3b] to-[#022c22] text-white shadow-lg flex flex-col justify-between border border-teal-500/20">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">
                Available to Withdraw
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Wallet size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mt-2">
              ₹{driverProfile?.walletBalance || 4250}
            </h3>
            <span className="text-[11px] text-teal-200/60 mt-1 block">
              Direct transfer to HDFC Bank (••4921)
            </span>
          </div>

          <button
            onClick={handleInstantCashout}
            className="mt-5 w-full py-3 px-4 rounded-xl bg-linear-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-[13px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={16} />
            <span>Instant Cashout to Bank</span>
          </button>
        </div>

        {/* Today's Total */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Shift Earnings
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">
                ₹{stats.todayEarnings}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                7 Rides
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Includes ₹85 in passenger tips
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Per Ride</span>
            <span className="font-extrabold text-slate-800">
              ₹{Math.round(stats.todayEarnings / (stats.tripsCompleted || 1))}
            </span>
          </div>
        </div>

        {/* Weekly Total */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              This Week&apos;s Gross
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">
                ₹{stats.weeklyEarnings}
              </span>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                44 Rides
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Target: ₹16,000 (89% achieved)
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Incentive Bonuses</span>
            <span className="font-extrabold text-amber-600">+₹1,200</span>
          </div>
        </div>
      </div>

      {/* Weekly Earnings Chart Visualization */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Daily Earnings Trend</h3>
            <p className="text-xs text-slate-500">Past 7 days shift revenue breakdown</p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            0% Commission Tier Active
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-6 pb-2 items-end h-48 border-b border-slate-100">
          {[
            { day: "Mon", amt: 2150, height: "70%" },
            { day: "Tue", amt: 1840, height: "60%" },
            { day: "Wed", amt: 2420, height: "82%" },
            { day: "Thu", amt: 1980, height: "65%" },
            { day: "Fri", amt: 2890, height: "95%" },
            { day: "Sat", amt: 3100, height: "100%" },
            { day: "Today", amt: 1865, height: "62%", isToday: true },
          ].map((bar) => (
            <div key={bar.day} className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{bar.amt}
              </span>
              <div
                className={`w-full max-w-9 rounded-xl transition-all ${
                  bar.isToday
                    ? "bg-linear-to-t from-teal-700 to-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-teal-100 hover:bg-teal-200"
                }`}
                style={{ height: bar.height }}
              />
              <span className={`text-[11px] font-bold ${bar.isToday ? "text-teal-800" : "text-slate-400"}`}>
                {bar.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
