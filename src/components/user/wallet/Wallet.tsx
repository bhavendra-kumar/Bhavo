"use client";

import React, { useState, useEffect } from "react";
import { Plus, CreditCard, History, Banknote, Clock, CheckCircle2, Download, AlertCircle, Tag, Gift } from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";
import { IRideData } from "@/hooks/user/useDashboardStore";

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

export default function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Transactions");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [recentRides, setRecentRides] = useState<IRideData[]>([]);
  const [loading, setLoading] = useState(true);
  const { alert } = useDialog();

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch("/api/user/profile").then((r) => r.json()),
      fetch("/api/user/rides?status=completed").then((r) => r.json()),
    ])
      .then(([profileRes, ridesRes]) => {
        if (!ignore) {
          if (profileRes?.data?.walletBalance !== undefined) {
            setWalletBalance(profileRes.data.walletBalance);
          }
          if (Array.isArray(ridesRes?.data)) {
            setRecentRides(ridesRes.data.slice(0, 10));
          }
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Wallet data load error:", e);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRechargeNotice = () => {
    alert({
      title: "Cash-Only Pilot Phase",
      message: "Online wallet recharge is disabled during the controlled pilot phase. All rides operate on direct cash payment collected by your driver upon arrival.",
      variant: "info",
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-10">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Bhavo Wallet & Payment Ledger</h2>
          <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-0.5">
            Transparent view of completed rides, cash payment dues, and platform credits.
          </p>
        </div>
        <button
          onClick={() => {
            alert({
              title: "Payment Statement",
              message: "Statements are aggregated at the end of each monthly pilot period.",
              variant: "info",
            });
          }}
          className="self-start sm:self-auto h-9 px-4 rounded-full flex items-center justify-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 hover:bg-teal-100 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
        >
          <Download size={13} /> Statement
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-[12.5px] text-amber-800 leading-relaxed">
          <strong className="font-bold">Controlled Pilot Financial Model:</strong> Online card processing and direct digital top-ups are paused. All ride fares are payable in cash directly to your assigned driver upon trip completion.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        <div className="flex flex-col gap-4 sm:gap-5">

          <div className="card p-5 sm:p-6 text-white relative overflow-hidden rounded-2xl shadow-sm"
            style={{ background: "linear-gradient(135deg, #064e3b 0%, #042f2e 100%)", borderColor: "#0f766e" }}>
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 bg-white" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-5 bg-white" style={{ transform: "translate(-30%, 30%)" }} />

            <p className="text-teal-200 text-[10.5px] font-bold uppercase tracking-widest mb-1">Available Platform Balance</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 text-white">
              ₹{walletBalance.toFixed(2)}
            </h2>

            <button
              onClick={handleRechargeNotice}
              className="w-full bg-teal-400 hover:bg-teal-300 text-teal-950 font-black py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all text-[13.5px] shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Add Money (Disabled in Pilot)
            </button>
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recharge Amounts</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className="py-2.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer"
                  style={{
                    background: selectedAmount === amt ? "#0d9488" : "#f8fafc",
                    color: selectedAmount === amt ? "white" : "#334155",
                    border: selectedAmount === amt ? "1px solid #0d9488" : "1px solid #e2e8f0",
                    boxShadow: selectedAmount === amt ? "0 4px 12px rgba(13,148,136,0.25)" : "none",
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            {selectedAmount !== null && (
              <button
                type="button"
                onClick={handleRechargeNotice}
                className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-sm cursor-pointer"
              >
                Proceed to Pay ₹{selectedAmount}
              </button>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Payment Mode</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-teal-200 bg-teal-50/50">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal-600 text-white">
                  <Banknote size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-[13px] font-bold text-slate-900">Physical Cash to Driver</span>
                  <p className="text-[11px] font-medium text-teal-700">Active · Pilot Policy Standard</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 opacity-60">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-200 text-slate-500">
                  <CreditCard size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-[13px] font-bold text-slate-600">Online Gateway / Card</span>
                  <p className="text-[11px] font-medium text-slate-400">Disabled during Pilot</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-5">

          <div className="flex gap-1 p-1 rounded-xl w-full sm:w-max overflow-x-auto no-scrollbar bg-slate-100 border border-slate-200">
            {["Transactions", "Coupons", "Rewards"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all shrink-0 cursor-pointer whitespace-nowrap"
                style={{
                  background: activeTab === tab ? "#ffffff" : "transparent",
                  color: activeTab === tab ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="card flex-1 min-h-100 overflow-hidden flex flex-col">

            {activeTab === "Transactions" && (
              <div className="flex flex-col">
                <div className="p-5 flex items-center justify-between border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
                    <History size={16} className="text-teal-600" /> Completed Ride Payments
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                      Loading ride payment records...
                    </div>
                  ) : recentRides.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                      No ride payment transactions recorded yet. Completed trips and cash receipts will appear here.
                    </div>
                  ) : (
                    recentRides.map((ride) => {
                      const dateStr = new Date(ride.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const isCollected = ride.paymentStatus === "COLLECTED" || ride.paymentStatus === "PAID";

                      return (
                        <div key={ride._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isCollected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isCollected ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 truncate">
                              Trip #{ride._id.slice(-6).toUpperCase()} · {ride.vehicleType}
                            </p>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                              {dateStr} · {isCollected ? "Cash Collected by Pilot" : "Cash Payment Due"}
                            </p>
                          </div>
                          <span
                            className={`text-[15px] font-black shrink-0 ${
                              isCollected ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            ₹{ride.fare.toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === "Coupons" && (
              <div className="p-5 flex flex-col gap-4">
                {[
                  { code: "BHAVO20", desc: "20% off on your next 3 scheduled rides.", expiry: "Expires in 2 days" },
                  { code: "FESTIVE50", desc: "Flat ₹50 off on Premium rides.", expiry: "Expires in 1 week" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-teal-100 bg-teal-50">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Tag size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-teal-900">{c.code}</p>
                      <p className="text-[13px] font-medium text-slate-600 mt-1">{c.desc}</p>
                      <p className="text-[11px] font-semibold text-rose-500 mt-2">{c.expiry}</p>
                    </div>
                    <button className="px-4 py-2 bg-teal-600 text-white font-bold text-[12px] rounded-lg shadow-sm hover:bg-teal-700 transition-colors">
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Rewards" && (
              <div className="p-5 flex flex-col gap-4">
                <div className="bg-linear-to-r from-amber-100 to-yellow-50 p-6 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-[18px] font-bold text-amber-900 flex items-center gap-2">
                      <Gift size={20} className="text-amber-600" /> Green Commuter Badge
                    </h4>
                    <p className="text-[13px] font-medium text-amber-800 mt-2 max-w-md">
                      You&apos;ve consistently chosen Eco rides! You&apos;re 2 rides away from unlocking a ₹200 wallet cashback.
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-amber-600 text-[20px] shadow-sm border border-amber-100">
                    8/10
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
