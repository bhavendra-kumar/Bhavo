"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  Banknote,
  ShieldCheck,
  Zap,
  Leaf,
  Route,
  MapPin,
  Star,
  CarFront,
  Download,
  ArrowRight,
} from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

interface CompletedRide {
  _id: string;
  pickup: { address: string; coordinates?: [number, number] };
  dropoff: { address: string; coordinates?: [number, number] };
  fare: number;
  vehicleType: string;
  driverDetails?: {
    name?: string;
    rating?: number;
    vehicleModel?: string;
    vehicleNumber?: string;
  };
  scheduledRideId?: string;
  createdAt: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { label: string; up: boolean };
  sub?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
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
        {sub && !trend && (
          <p className="text-[12px] font-medium mt-1.5 text-slate-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function MobilityInsightsPage() {
  const { alert } = useDialog();
  const [period, setPeriod] = useState("This Month");
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<CompletedRide[]>([]);
  const [weekBuckets, setWeekBuckets] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [barData, setBarData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    timeSavedHours: 0,
    moneySpent: 0,
    moneySaved: 0,
    autoBookedPct: 0,
    carbonOffsetKg: 0,
  });

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [dashRes, ridesRes] = await Promise.all([
          fetch("/api/user/dashboard"),
          fetch("/api/user/rides?status=completed"),
        ]);

        const dashJson = dashRes.ok ? await dashRes.json() : null;
        const ridesJson = ridesRes.ok ? await ridesRes.json() : null;

        if (ignore) return;

        const completedRides: CompletedRide[] = ridesJson?.rides || [];
        setRides(completedRides);

        const totalTrips = completedRides.length;
        const totalSpent = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        const autoBookedCount = completedRides.filter((r) => r.scheduledRideId).length;
        const autoBookedPct = totalTrips > 0 ? Math.round((autoBookedCount / totalTrips) * 100) : 0;
        const timeSavedHours = dashJson?.stats?.savedHours ?? Number((totalTrips * 0.35).toFixed(1));
        const carbonOffsetKg = dashJson?.stats?.carbonOffsetKg ?? Number((totalTrips * 0.6).toFixed(1));
        // Commuter savings estimate: approx 10% compared to surge pricing
        const moneySaved = Math.round(totalSpent * 0.1);

        const buckets = [0, 0, 0, 0, 0, 0, 0];
        const currentTime = Date.now();
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        for (const r of completedRides) {
          const rideTime = new Date(r.createdAt).getTime();
          const diffWeeks = Math.floor((currentTime - rideTime) / ONE_WEEK_MS);
          if (diffWeeks >= 0 && diffWeeks < 7) {
            const bucketIdx = 6 - diffWeeks;
            buckets[bucketIdx] += 1;
          }
        }
        const maxWeekly = Math.max(...buckets, 1);
        setWeekBuckets(buckets);
        setBarData(buckets.map((count) => Math.round((count / maxWeekly) * 100)));

        setStats({
          totalTrips,
          timeSavedHours,
          moneySpent: totalSpent,
          moneySaved,
          autoBookedPct,
          carbonOffsetKg,
        });
      } catch (err) {
        console.error("Failed to load mobility data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Compute Favorite Routes
  const routeCounts: { [key: string]: { from: string; to: string; count: number } } = {};
  for (const r of rides) {
    const from = r.pickup?.address?.split(",")[0] || "Origin";
    const to = r.dropoff?.address?.split(",")[0] || "Destination";
    const key = `${from} → ${to}`;
    if (!routeCounts[key]) {
      routeCounts[key] = { from, to, count: 0 };
    }
    routeCounts[key].count += 1;
  }
  const favoriteRoutes = Object.values(routeCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Compute Preferred Drivers
  const driverCounts: { [name: string]: { name: string; rating: number; count: number } } = {};
  for (const r of rides) {
    if (r.driverDetails?.name) {
      const name = r.driverDetails.name;
      if (!driverCounts[name]) {
        driverCounts[name] = {
          name,
          rating: r.driverDetails.rating || 4.9,
          count: 0,
        };
      }
      driverCounts[name].count += 1;
    }
  }
  const preferredDrivers = Object.values(driverCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Compute Vehicle Usage
  const vehicleCounts: { [type: string]: number } = {};
  for (const r of rides) {
    const v = r.vehicleType || "Standard";
    vehicleCounts[v] = (vehicleCounts[v] || 0) + 1;
  }
  const topVehicle =
    Object.entries(vehicleCounts).sort((a, b) => b[1] - a[1])[0] || ["Standard", 0];
  const topVehiclePct =
    stats.totalTrips > 0 ? Math.round((topVehicle[1] / stats.totalTrips) * 100) : 0;

  const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

  const handleExport = () => {
    alert({
      title: "Mobility Report Summary",
      message:
        stats.totalTrips > 0
          ? `Report for ${period}: ${stats.totalTrips} completed trips, ₹${stats.moneySpent.toLocaleString()} total fare, ${stats.timeSavedHours}h saved.`
          : "No completed trips recorded yet. Book or complete a trip to export mobility analytics.",
      variant: "info",
    });
  };

  const avgPerTrip =
    stats.totalTrips > 0 ? `Avg ₹${Math.round(stats.moneySpent / stats.totalTrips)}/trip` : "No rides yet";

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-10">
        <div className="card p-12 text-center text-slate-500 text-sm">
          Loading mobility insights...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Mobility & Commute Insights
          </h1>
          <p className="text-[13px] text-slate-500 font-medium">
            Live analytics derived from your verified completed trips and daily schedules.
          </p>
        </div>

        {/* Period selector & Export */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-lg bg-slate-100 border border-slate-200">
            {["This Month", "Last Month", "This Year"].map((label) => (
              <button
                key={label}
                onClick={() => setPeriod(label)}
                className="px-4 py-2 text-[12px] font-bold rounded-md transition-all whitespace-nowrap cursor-pointer"
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
          <button
            onClick={handleExport}
            className="h-9 px-4 rounded-lg flex items-center gap-2 text-[13px] font-bold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Trips"
          value={String(stats.totalTrips)}
          icon={Route}
          iconBg="#ccfbf1"
          iconColor="#0d9488"
          sub={stats.totalTrips > 0 ? "Completed rides" : "Ready for first ride"}
        />
        <StatCard
          title="Time Saved"
          value={stats.timeSavedHours > 0 ? `${stats.timeSavedHours}h` : "0h"}
          icon={Clock}
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          sub="Via direct dispatch"
        />
        <StatCard
          title="Money Spent"
          value={`₹${stats.moneySpent.toLocaleString()}`}
          icon={Banknote}
          iconBg="#fef9c3"
          iconColor="#ca8a04"
          sub={avgPerTrip}
        />
        <StatCard
          title="Money Saved"
          value={`₹${stats.moneySaved.toLocaleString()}`}
          icon={TrendingUp}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          sub="Zero surge commuter rate"
        />
        <StatCard
          title="Auto-Booked"
          value={`${stats.autoBookedPct}%`}
          icon={ShieldCheck}
          iconBg="#ccfbf1"
          iconColor="#0d9488"
          sub="Via Smart Commute"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="card lg:col-span-2 p-6 flex flex-col min-h-80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-bold text-slate-900">Commute Trends</h3>
            <span className="pill-teal">Weekly Volume</span>
          </div>

          {stats.totalTrips === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Route size={28} className="text-slate-300 mb-2" />
              <p className="text-[13px] font-bold text-slate-700">No Weekly Trends Yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                Take your first Bhavo ride or schedule daily commutes to view weekly ride distribution.
              </p>
              <Link
                href="/user/book-ride"
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs"
              >
                Book a Ride <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex items-end gap-3 pb-2">
              {barData.map((pct, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="w-full flex-1 flex flex-col justify-end relative group">
                    <div
                      className="w-full rounded-t-xl transition-all duration-300 group-hover:opacity-80 relative"
                      style={{
                        height: `${Math.max(pct, 6)}%`,
                        background: i === 6 ? "#14b8a6" : "#e2e8f0",
                        boxShadow: i === 6 ? "0 -4px 12px rgba(20,184,166,0.3)" : "none",
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-white px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none bg-slate-900">
                      {weekBuckets[i]} trips
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {WEEK_LABELS[i]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights Panel */}
        <div
          className="card p-6 flex flex-col gap-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
            borderColor: "#0f766e",
          }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #ccfbf1, transparent)",
              transform: "translate(30%, -30%)",
            }}
          />

          <h3 className="text-[15px] font-bold text-white flex items-center gap-2 relative z-10">
            <Zap size={16} className="text-amber-400 fill-amber-400" /> AI Insights
          </h3>

          <div className="relative z-10 p-4 rounded-xl flex flex-col gap-2 bg-white/10 border border-white/20 backdrop-blur-sm mt-2">
            <h4 className="text-[12px] font-bold text-teal-200">Optimal Departure</h4>
            <p className="text-[12px] text-teal-50 leading-relaxed">
              {stats.totalTrips > 0
                ? "Setting daily commute departure times 10–15 mins earlier reduces morning peak transit delays by up to 25%."
                : "Scheduling recurring weekday commutes locks in reliable pilot dispatches without peak waiting times."}
            </p>
            <Link
              href="/user/my-commute"
              className="mt-2 self-start text-[11px] font-bold px-3 py-1.5 rounded bg-white text-teal-800 hover:bg-teal-50 transition-colors"
            >
              Configure Schedule
            </Link>
          </div>

          <div className="relative z-10 p-4 rounded-xl flex flex-col gap-2 bg-white/10 border border-white/20 backdrop-blur-sm mt-2">
            <h4 className="text-[12px] font-bold text-emerald-300 flex items-center gap-1.5">
              <Leaf size={12} /> Carbon Footprint
            </h4>
            <p className="text-[12px] text-teal-50 leading-relaxed">
              {stats.carbonOffsetKg > 0
                ? `Your Bhavo journeys have contributed to ${stats.carbonOffsetKg} kg of estimated carbon reduction.`
                : "Choose EV fleet options on your daily commute to contribute to lower city emissions."}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Favorite Routes */}
        <div className="card p-5">
          <p className="text-[14px] font-bold mb-4 text-slate-900">Frequent Routes</p>
          {favoriteRoutes.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No completed trips recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {favoriteRoutes.map((route, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-teal-50 border border-teal-100">
                      <MapPin size={14} className="text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">
                        {route.from} → {route.to}
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 shrink-0">
                    {route.count} trips
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Drivers */}
        <div className="card p-5">
          <p className="text-[14px] font-bold mb-4 text-slate-900">Assigned Pilots</p>
          {preferredDrivers.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No pilot history recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {preferredDrivers.map((driver, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] bg-purple-50 text-purple-700 border border-purple-100">
                      {driver.name[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{driver.name}</p>
                      <p className="text-[11px] font-medium flex items-center gap-1 text-slate-500">
                        <Star size={10} className="text-amber-400 fill-amber-400" />{" "}
                        {driver.rating}
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-slate-500">
                    {driver.count} trips
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Used Vehicle */}
        <div className="card p-5">
          <p className="text-[14px] font-bold mb-4 text-slate-900">Vehicle Category</p>
          {stats.totalTrips === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No vehicle usage history yet.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-teal-50 border-4 border-teal-100">
                <CarFront size={32} className="text-teal-600" />
              </div>
              <p className="text-[16px] font-bold text-slate-900">{topVehicle[0]}</p>
              <p className="text-[13px] font-medium mt-1 text-slate-500">
                {topVehiclePct}% of your total trips
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
