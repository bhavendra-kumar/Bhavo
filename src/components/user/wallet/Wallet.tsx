"use client";

import React, { useState } from "react";
import { Wallet, Plus, CreditCard, History, ChevronRight, ArrowUpRight, ArrowDownLeft, Smartphone } from "lucide-react";

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

const TRANSACTIONS = [
  { id: "TRP-8821A", label: "Ride Payment", sub: "Today · 9:45 AM", amount: "-₹380.00", type: "debit" },
  { id: "RCH-001", label: "Wallet Recharge", sub: "Oct 20, 2024", amount: "+₹2,000.00", type: "credit" },
  { id: "TRP-8820B", label: "Ride Payment", sub: "Oct 19, 2024 · 6:30 PM", amount: "-₹240.00", type: "debit" },
  { id: "RCH-000", label: "Wallet Recharge", sub: "Oct 15, 2024", amount: "+₹1,000.00", type: "credit" },
];

export default function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
          >
            <Wallet size={18} className="text-white" />
          </div>
          Bhavo Wallet
        </h1>
        <p className="text-slate-500 mt-1.5 text-sm">Manage your balance and payment history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Balance */}
        <div className="flex flex-col gap-4">

          {/* Balance card */}
          <div
            className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0f766e 0%, #059669 100%)",
              boxShadow: "0 12px 40px rgba(13,148,136,0.35)",
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20"
              style={{ background: "white" }}
            />
            <div
              className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
              style={{ background: "white", transform: "translate(-30%, 30%)" }}
            />
            <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</p>
            <h2 className="text-4xl font-black tracking-tight mb-6">₹1,250.00</h2>
            <button
              className="w-full bg-white text-teal-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-teal-50 hover:-translate-y-0.5 shadow-lg text-sm"
            >
              <Plus size={17} /> Add Money
            </button>
          </div>

          {/* Quick add */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Add</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className="py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: selectedAmount === amt ? "linear-gradient(135deg, #0d9488, #059669)" : "#f8fafc",
                    color: selectedAmount === amt ? "white" : "#64748b",
                    border: selectedAmount === amt ? "none" : "1px solid rgba(15,23,42,0.08)",
                    boxShadow: selectedAmount === amt ? "0 4px 12px rgba(13,148,136,0.25)" : "none",
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Methods</p>
            <div className="flex flex-col gap-2">
              {[
                { Icon: CreditCard, label: "HDFC Debit ····4523", color: "#2563eb" },
                { Icon: Smartphone, label: "Google Pay UPI", color: "#16a34a" },
              ].map(({ Icon, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ border: "1px solid rgba(15,23,42,0.07)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}15` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 flex-1">{label}</span>
                  <ChevronRight size={15} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Transactions */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl flex flex-col"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
        >
          <div
            className="p-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Recent Transactions
            </h3>
            <button className="text-xs font-bold text-teal-600 hover:text-teal-700">View All</button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {TRANSACTIONS.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: tx.type === "credit" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.07)",
                  }}
                >
                  {tx.type === "credit"
                    ? <ArrowDownLeft size={18} className="text-emerald-600" />
                    : <ArrowUpRight size={18} className="text-rose-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{tx.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tx.sub} · {tx.id}</p>
                </div>
                <div className="text-right">
                  <p
                    className="font-bold text-sm"
                    style={{ color: tx.type === "credit" ? "#059669" : "#0f172a" }}
                  >
                    {tx.amount}
                  </p>
                  <ChevronRight size={14} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity inline-block mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
