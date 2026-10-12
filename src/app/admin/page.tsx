"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  Car,
  Headphones,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Zap,
  Radio,
} from "lucide-react";

interface OverviewData {
  metrics: {
    users: {
      totalRiders: number;
      totalDrivers: number;
      activeUsers: number;
      suspendedUsers: number;
      driversPendingVerification: number;
    };
    rides: {
      searching: number;
      active: number;
      completed: number;
      cancelled: number;
    };
    support: {
      open: number;
      inProgress: number;
      resolved: number;
      totalActive: number;
    };
    autoBooking: {
      materialized: number;
      failed: number;
      skipped: number;
    };
  };
  recentAuditLogs: Array<{
    id: string;
    actorEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    reason: string;
    createdAt: string;
  }>;
  timestamp: string;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setData(json.data);
        } else {
          setError(json.message || "Failed to load operational overview");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error while connecting to administrative services");
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.status === "success") {
            setData(json.data);
          } else {
            setError(json.message || "Failed to load operational overview");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Network error while connecting to administrative services");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time platform operations, verification backlogs, and fleet telemetry.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="text-rose-900 font-semibold underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Driver Verification */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verification Queue
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.users.driversPendingVerification ?? 0}
            </span>
            <p className="text-xs text-amber-600 font-medium mt-1">
              Drivers awaiting document compliance
            </p>
          </div>
          <Link
            href="/admin/drivers"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <span>Review Drivers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 2: Active Rides */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Rides
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
              <Radio className="w-5 h-5 animate-pulse text-teal-600" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.rides.active ?? 0}
            </span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Accepted, Arrived or In Progress
            </p>
          </div>
          <Link
            href="/admin/rides"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <span>Explore Rides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 3: Rides Searching */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Searching Fleet
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.rides.searching ?? 0}
            </span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Currently awaiting driver dispatch match
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Completed Today: {data?.metrics.rides.completed ?? 0}</span>
          </div>
        </div>

        {/* Metric 4: Open Support Tickets */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Tickets
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <Headphones className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.support.totalActive ?? 0}
            </span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Active customer or driver issues
            </p>
          </div>
          <Link
            href="/admin/support"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <span>Resolve Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Fleet & Users */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">Accounts & Demographics</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Registered Riders</span>
              <span className="font-semibold text-slate-800">{data?.metrics.users.totalRiders ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Registered Drivers</span>
              <span className="font-semibold text-slate-800">{data?.metrics.users.totalDrivers ?? 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Active Accounts</span>
              <span className="font-semibold text-emerald-600">{data?.metrics.users.activeUsers ?? 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Suspended / Disabled Accounts</span>
              <span className="font-semibold text-rose-600">{data?.metrics.users.suspendedUsers ?? 0}</span>
            </div>
          </div>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <span>Manage User Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Auto Booking Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Auto-Booking Scheduler</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Materialized Rides</span>
              <span className="font-semibold text-emerald-600">
                {data?.metrics.autoBooking.materialized ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Skipped (Past or Paused)</span>
              <span className="font-semibold text-slate-700">
                {data?.metrics.autoBooking.skipped ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Failed / Retry Occurrences</span>
              <span className="font-semibold text-rose-600">
                {data?.metrics.autoBooking.failed ?? 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-2 text-[11px] text-slate-400">
            Autonomous background lookahead window: 180 min
          </div>
        </div>

        {/* Operational Security Invariants */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Operational Integrity</h2>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></span>
              <span>Driver self-verification disabled and blocked server-side.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></span>
              <span>All admin actions recorded in append-only audit trail.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></span>
              <span>Account suspension safety protects passengers on active trips.</span>
            </li>
          </ul>
          <Link
            href="/admin/audit-logs"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Audit Activities Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Administrative Actions</h2>
            <p className="text-xs text-slate-500">Immutable log of latest sensitive modifications</p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            View All Logs →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : !data?.recentAuditLogs || data.recentAuditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No administrative events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Action</th>
                  <th className="px-4 py-2.5 font-semibold">Actor</th>
                  <th className="px-4 py-2.5 font-semibold">Target</th>
                  <th className="px-4 py-2.5 font-semibold">Reason</th>
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{log.actorEmail}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.targetType}: {log.targetId.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{log.reason}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
