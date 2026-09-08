"use client";

import React, { useState } from "react";
import { TrendingUp, Clock, Banknote, ShieldCheck, Zap, Leaf, Route, MapPin, Star, CarFront, Download } from "lucide-react";

const BAR_DATA = [65, 40, 80, 55, 90, 70, 45];
const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend, sub }: {
  title: string; value: string; icon: React.ElementType;
  iconBg: string; iconColor: string;
  trend?: { label: string; up: boolean }; sub?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={trend.up ? "pill-teal" : "pill-red"}>
              <TrendingUp size={10} className="inline mr-1" />
              {trend.label}
            </span>
          </div>
        )}
        {sub && !trend && <p className="text-[12px] font-medium mt-1.5 text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function MobilityInsightsPage() {
  const [period, setPeriod] = useState("This Month");

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">

        {/* Period selector & Export */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-lg bg-slate-100 border border-slate-200">
            {["This Month", "Last Month", "This Year"].map((label) => (
              <button
                key={label}
                onClick={() => setPeriod(label)}
                className="px-4 py-2 text-[12px] font-bold rounded-md transition-all whitespace-nowrap"
                style={{
                  background: period === label ? "#ffffff" : "transparent",
                  color: period === label ? "#0f172a" : "#64748b",
                  boxShadow: period === label ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="h-9 px-4 rounded-lg flex items-center gap-2 text-[13px] font-bold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Trips" value="42" icon={Route} iconBg="#ccfbf1" iconColor="#0d9488" trend={{ label: "+12%", up: true }} />
        <StatCard title="Time Saved" value="12h 45m" icon={Clock} iconBg="#ede9fe" iconColor="#7c3aed" trend={{ label: "+5%", up: true }} />
        <StatCard title="Money Spent" value="₹14,250" icon={Banknote} iconBg="#fef9c3" iconColor="#ca8a04" sub="Avg ₹340/trip" />
        <StatCard title="Money Saved" value="₹1,200" icon={TrendingUp} iconBg="#dcfce7" iconColor="#16a34a" sub="Via Smart Rules" />
        <StatCard title="Auto-Booked" value="88%" icon={ShieldCheck} iconBg="#ccfbf1" iconColor="#0d9488" trend={{ label: "+2%", up: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="card lg:col-span-2 p-6 flex flex-col min-h-80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-bold text-slate-900">Commute Trends</h3>
            <span className="pill-teal">Weekly Volume</span>
          </div>

          <div className="flex-1 flex items-end gap-3 pb-2">
            {BAR_DATA.map((pct, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="w-full flex-1 flex flex-col justify-end relative group">
                  <div
                    className="w-full rounded-t-xl transition-all duration-300 group-hover:opacity-80 relative"
                    style={{
                      height: `${pct}%`,
                      background: i === 4 ? "#14b8a6" : "#e2e8f0",
                      boxShadow: i === 4 ? "0 -4px 12px rgba(20,184,166,0.3)" : "none",
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-white px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none bg-slate-900">
                    {pct} trips
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{WEEK_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="card p-6 flex flex-col gap-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", borderColor: "#0f766e" }}>
          
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #ccfbf1, transparent)", transform: "translate(30%, -30%)" }} />

          <h3 className="text-[15px] font-bold text-white flex items-center gap-2 relative z-10">
            <Zap size={16} className="text-amber-400 fill-amber-400" /> AI Insights
          </h3>

          <div className="relative z-10 p-4 rounded-xl flex flex-col gap-2 bg-white/10 border border-white/20 backdrop-blur-sm mt-2">
            <h4 className="text-[12px] font-bold text-teal-200">Optimal Departure</h4>
            <p className="text-[12px] text-teal-50 leading-relaxed">
              Leaving 15 mins earlier for your Morning Commute saves ~₹1,200/month in peak surcharges.
            </p>
            <button className="mt-2 self-start text-[11px] font-bold px-3 py-1.5 rounded bg-white text-teal-800 hover:bg-teal-50 transition-colors">
              Adjust Schedule
            </button>
          </div>

          <div className="relative z-10 p-4 rounded-xl flex flex-col gap-2 bg-white/10 border border-white/20 backdrop-blur-sm mt-2">
            <h4 className="text-[12px] font-bold text-emerald-300 flex items-center gap-1.5">
              <Leaf size={12} /> Eco Hero
            </h4>
            <p className="text-[12px] text-teal-50 leading-relaxed">
              80% of your rides were Eco this month. Keep it up to unlock the Green Commuter badge!
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Favorite Routes */}
        <div className="card p-5">
          <p className="text-[14px] font-bold mb-4 text-slate-900">Favorite Routes</p>
          <div className="flex flex-col gap-4">
            {[
              { from: "Home", to: "Bhavo HQ", count: 22 },
              { from: "Bhavo HQ", to: "Home", count: 18 },
              { from: "Home", to: "Airport", count: 2 },
            ].map((route, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-teal-50 border border-teal-100">
                    <MapPin size={14} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{route.from} → {route.to}</p>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-slate-500">{route.count} trips</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Drivers */}
        <div className="card p-5">
          <p className="text-[14px] font-bold mb-4 text-slate-900">Preferred Drivers</p>
          <div className="flex flex-col gap-4">
            {[
              { name: "Rajesh K.", rating: 4.9, count: 12 },
              { name: "Suresh P.", rating: 4.8, count: 8 },
              { name: "Amit S.", rating: 4.7, count: 5 },
            ].map((driver, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] bg-purple-50 text-purple-700 border border-purple-100">
                    {driver.name[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{driver.name}</p>
                    <p className="text-[11px] font-medium flex items-center gap-1 text-slate-500">
                      <Star size={10} className="text-amber-400 fill-amber-400" /> {driver.rating}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-slate-500">{driver.count} trips</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Used Vehicle */}
        <div className="card p-5">
          <p className="text-[14px] font-bold mb-4 text-slate-900">Most Used Vehicle</p>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-teal-50 border-4 border-teal-100">
              <CarFront size={32} className="text-teal-600" />
            </div>
            <p className="text-[16px] font-bold text-slate-900">Premium Sedan</p>
            <p className="text-[13px] font-medium mt-1 text-slate-500">65% of your total trips</p>
            
            <div className="w-full mt-6 bg-slate-100 h-2 rounded-full overflow-hidden flex">
              <div className="h-full bg-teal-500" style={{ width: "65%" }} />
              <div className="h-full bg-blue-400" style={{ width: "25%" }} />
              <div className="h-full bg-amber-400" style={{ width: "10%" }} />
            </div>
            <div className="w-full flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
              <span className="text-teal-600">Premium</span>
              <span className="text-blue-500">Eco</span>
              <span className="text-amber-500">SUV</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
