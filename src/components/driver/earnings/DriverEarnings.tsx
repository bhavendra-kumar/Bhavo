"use client";

import React, { useEffect, useState } from "react";
import { Wallet, ArrowUpRight } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface IEarningsData {
  walletBalance: number;
  todayEarnings: number;
  weeklyEarnings: number;
  tripsToday: number;
  tripsWeek: number;
  tipsToday: number;
  incentivesBonusWeek: number;
  averagePerTrip: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    holderName: string;
  };
  dailyTrend: Array<{
    day: string;
    amt: number;
    height: string;
    isToday?: boolean;
  }>;
}

export default function DriverEarnings() {
  const { driverProfile, fetchDriverData } = useDriverStore();
  const { alert, confirm } = useDialog();
  const [data, setData] = useState<IEarningsData | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/driver/earnings")
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

  const refreshEarnings = async () => {
    try {
      const res = await fetch("/api/driver/earnings");
      if (res.ok) {
        const json = await res.json();
        if (json.data) setData(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const balance = data?.walletBalance ?? driverProfile?.walletBalance ?? 0;
  const todayEarnings = data?.todayEarnings ?? 0;
  const weeklyEarnings = data?.weeklyEarnings ?? 0;
  const tripsToday = data?.tripsToday ?? 0;
  const tripsWeek = data?.tripsWeek ?? 0;
  const tipsToday = data?.tipsToday ?? 0;
  const bankAccount = data?.bankAccount || {
    bankName: "Linked Bank / UPI",
    accountNumber: "Registered Account",
  };

  const handleInstantCashout = async () => {
    if (balance <= 0) {
      alert({
        title: "No Balance Available",
        message: "Your withdrawable wallet balance is ₹0.",
        confirmText: "Close",
        variant: "info",
      });
      return;
    }

    const ok = await confirm({
      title: `Instant Transfer ₹${balance}?`,
      message: `Funds will be transferred to your verified account (${bankAccount.bankName} ${bankAccount.accountNumber}) via IMPS/UPI. Zero processing fee.`,
      confirmText: `Transfer ₹${balance} Now`,
      cancelText: "Cancel",
      variant: "success",
    });

    if (ok) {
      try {
        const res = await fetch("/api/driver/earnings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: balance }),
        });
        const json = await res.json();
        if (res.ok) {
          await refreshEarnings();
          await fetchDriverData();

          alert({
            title: "Payout Transferred Successfully! 🎉",
            message: `₹${balance} has been transferred to your ${bankAccount.bankName} account. Reference ID: ${json.data?.referenceId || "BHAVO-PAY-SUCCESS"}.`,
            confirmText: "Done",
            variant: "success",
          });
        } else {
          alert({
            title: "Payouts Disabled in Pilot",
            message:
              json.message ||
              "Instant cashout transfers are disabled during the cash-only pilot phase. All trip fares are collected directly in person.",
            confirmText: "Understood",
            variant: "info",
          });
        }
      } catch {
        alert({
          title: "Transfer Unavailable",
          message: "Unable to process payout right now. Please try again.",
          confirmText: "OK",
          variant: "warning",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">

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
              ₹{balance}
            </h3>
            <span className="text-[11px] text-teal-200/60 mt-1 block">
              Direct transfer to {bankAccount.bankName} ({bankAccount.accountNumber})
            </span>
          </div>

          <button
            onClick={handleInstantCashout}
            disabled={balance <= 0}
            className="mt-5 w-full py-3 px-4 rounded-xl bg-linear-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 disabled:opacity-50 text-slate-950 font-black text-[13px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
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
                ₹{todayEarnings}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {tripsToday} Rides
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Includes ₹{tipsToday} in passenger tips
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Average Per Ride</span>
            <span className="font-extrabold text-slate-800">
              ₹{Math.round(todayEarnings / (tripsToday || 1))}
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
                ₹{weeklyEarnings}
              </span>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {tripsWeek} Rides
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Target: ₹16,000 ({Math.min(100, Math.round((weeklyEarnings / 16000) * 100))}% achieved)
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Incentive Bonuses</span>
            <span className="font-extrabold text-amber-600">+₹{data?.incentivesBonusWeek ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Weekly Earnings Chart Visualization */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Daily Earnings Trend</h3>
            <p className="text-xs text-slate-500">Past 7 days shift revenue breakdown from database</p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            0% Commission Tier Active
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-6 pb-2 items-end h-48 border-b border-slate-100">
          {(data?.dailyTrend || []).map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
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
