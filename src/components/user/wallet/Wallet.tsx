"use client";

import React, { useState } from "react";
import { Plus, CreditCard, History, ChevronRight, ArrowUpRight, ArrowDownLeft, Smartphone, Gift, Tag, Download } from "lucide-react";

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

const TRANSACTIONS = [
  { id: "TRP-8821A", label: "Ride Payment", sub: "Today · 9:45 AM", amount: "-₹380.00", type: "debit" },
  { id: "RCH-001", label: "Wallet Recharge", sub: "Oct 20, 2024", amount: "+₹2,000.00", type: "credit" },
  { id: "TRP-8820B", label: "Ride Payment", sub: "Oct 19, 2024 · 6:30 PM", amount: "-₹240.00", type: "debit" },
  { id: "RCH-000", label: "Wallet Recharge", sub: "Oct 15, 2024", amount: "+₹1,000.00", type: "credit" },
];

export default function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Transactions");

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button className="h-9 px-4 rounded-lg flex items-center gap-2 text-[13px] font-bold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors">
          <Download size={14} /> Download Statement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Balance & Quick Add */}
        <div className="flex flex-col gap-5">

          {/* Balance card */}
          <div className="card p-6 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", borderColor: "#0f766e" }}>
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 bg-white" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-5 bg-white" style={{ transform: "translate(-30%, 30%)" }} />
            
            <p className="text-teal-100 text-[11px] font-bold uppercase tracking-widest mb-1">Available Balance</p>
            <h2 className="text-4xl font-black tracking-tight mb-6">₹1,250.00</h2>
            
            <button className="w-full bg-white text-teal-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-teal-50 hover:-translate-y-0.5 text-sm shadow-sm">
              <Plus size={17} /> Add Money
            </button>
          </div>

          {/* Quick add */}
          <div className="card p-5">
            <p className="text-[11px] font-semibold text-[#0f766e] uppercase tracking-widest mb-3">Quick Add</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className="py-2.5 rounded-lg text-[13px] font-bold transition-all"
                  style={{
                    background: selectedAmount === amt ? "#0d9488" : "#f0fdfa",
                    color: selectedAmount === amt ? "white" : "#0f766e",
                    border: selectedAmount === amt ? "1px solid #0d9488" : "1px solid #ccfbf1",
                    boxShadow: selectedAmount === amt ? "0 4px 12px rgba(13,148,136,0.25)" : "none",
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            {selectedAmount !== null && (
              <button className="w-full mt-3 py-2 rounded-lg text-[13px] font-bold bg-[#042f2e] text-white hover:bg-[#021c1b] transition-colors">
                Proceed to Pay ₹{selectedAmount}
              </button>
            )}
          </div>

          {/* Payment methods */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-[#0f766e] uppercase tracking-widest">Payment Methods</p>
              <button className="text-[11px] font-bold text-teal-600 hover:text-teal-700">Add New</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { Icon: CreditCard, label: "HDFC Debit ····4523", type: "Primary" },
                { Icon: Smartphone, label: "Google Pay UPI", type: "" },
              ].map(({ Icon, label, type }, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#f0fdfa] transition-colors border border-transparent hover:border-[#ccfbf1]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#f0fdfa] border border-[#ccfbf1]">
                    <Icon size={16} className="text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-semibold text-[#042f2e]">{label}</span>
                    {type && <p className="text-[11px] font-medium text-[#0f766e]">{type}</p>}
                  </div>
                  <ChevronRight size={15} className="text-[#99f6e4]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Transactions, Rewards, Coupons */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          <div className="flex gap-1 p-1 rounded-lg w-max" style={{ background: "#ccfbf1" }}>
            {["Transactions", "Coupons", "Rewards"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-5 py-2 rounded-md text-[13px] font-semibold transition-all"
                style={{
                  background: activeTab === tab ? "#ffffff" : "transparent",
                  color: activeTab === tab ? "#042f2e" : "#0f766e",
                  boxShadow: activeTab === tab ? "0 1px 4px rgba(20,184,166,0.1)" : "none",
                  border: activeTab === tab ? "1px solid #99f6e4" : "1px solid transparent",
                }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="card flex-1 min-h-100 overflow-hidden flex flex-col">
            
            {activeTab === "Transactions" && (
              <div className="flex flex-col">
                <div className="p-5 flex items-center justify-between border-b border-[#ccfbf1]">
                  <h3 className="font-semibold text-[#042f2e] text-[15px] flex items-center gap-2">
                    <History size={16} className="text-[#0d9488]" /> Recent Transactions
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#f0fdfa]">
                  {TRANSACTIONS.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f0fdfa] transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: tx.type === "credit" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)" }}>
                        {tx.type === "credit"
                          ? <ArrowDownLeft size={16} className="text-emerald-600" />
                          : <ArrowUpRight size={16} className="text-rose-500" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#042f2e]">{tx.label}</p>
                        <p className="text-[12px] font-medium text-[#0f766e] mt-0.5">{tx.sub} · {tx.id}</p>
                      </div>
                      <span className="text-[15px] font-bold" style={{ color: tx.type === "credit" ? "#10b981" : "#042f2e" }}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
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
