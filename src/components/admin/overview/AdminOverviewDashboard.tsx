"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Car,
  ShieldCheck,
  ShieldAlert,
  Repeat,
  Headphones,
  CreditCard,
  Radio,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ScrollText,
} from "lucide-react";
import AdminRealtimeBadge from "@/components/admin/AdminRealtimeBadge";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";

export interface OverviewData {
  metrics: {
    rides: {
      active: number;
      searching: number;
      completedToday: number;
      cancelledToday: number;
    };
    drivers: {
      total: number;
      online: number;
      eligible: number;
      pendingVerification: number;
    };
    users: {
      totalRiders: number;
      activeUsers: number;
      suspendedUsers: number;
    };
    commutes: {
      activeSchedules: number;
      upcomingDepartures24h: number;
    };
    support: {
      unresolvedTotal: number;
      safetyOrUrgent: number;
    };
    financial: {
      failedTransactions: number;
      pendingCashReconciliation: number;
      totalExceptions: number;
    };
  };
  queues: {
    dispatchAttention: Array<{
      id: string;
      riderName: string;
      pickupAddress: string;
      dropoffAddress: string;
      vehicleType: string;
      petFriendly: boolean;
      scheduledFor: string | null;
      createdAt: string;
      dispatchOfferCount: number;
    }>;
    upcomingScheduled: Array<{
      id: string;
      riderName: string;
      pickupAddress: string;
      scheduledFor: string;
      status: string;
      vehicleType: string;
    }>;
    pendingDrivers: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      pendingDocsCount: number;
      createdAt: string;
    }>;
    stuckOccurrences: Array<{
      id: string;
      occurrenceKey: string;
      commuteTitle: string;
      riderName: string;
      scheduledFor: string;
      status: string;
      attemptCount: number;
      lastError: string;
    }>;
    priorityTickets: Array<{
      id: string;
      ticketId: string;
      userName: string;
      userRole: string;
      subject: string;
      category: string;
      priority: string;
      status: string;
      createdAt: string;
    }>;
    paymentExceptions: Array<{
      id: string;
      idempotencyKey: string;
      userName: string;
      amountInPaise: number;
      type: string;
      status: string;
      entityId: string;
      createdAt: string;
    }>;
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

export function AdminOverviewDashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setData(json.data);
          setError(null);
        } else {
          setError(json.message || "Failed to load operational overview");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error connecting to administrative services");
        setLoading(false);
      });
  }, []);

  const { connectionState, lastUpdated } = useAdminRealtime({
    onUpdate: loadData,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Control Room</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time fleet telemetry, active dispatch queues, and compliance status.
          </p>
        </div>

        <AdminRealtimeBadge
          connectionState={connectionState}
          lastUpdated={lastUpdated}
          onRefresh={loadData}
          isLoading={loading}
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="text-rose-900 font-semibold underline text-xs">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Link
          href="/admin/live-operations"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Rides
            </span>
            <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.rides.active ?? 0}
            </span>
            <p className="text-[11px] text-teal-700 font-medium mt-0.5">In progress & arrived</p>
          </div>
        </Link>

        <Link
          href="/admin/live-operations"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Searching Fleet
            </span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.rides.searching ?? 0}
            </span>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">Awaiting driver match</p>
          </div>
        </Link>

        <Link
          href="/admin/rides"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Completed Today
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.rides.completedToday ?? 0}
            </span>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Since 00:00:00</p>
          </div>
        </Link>

        <Link
          href="/admin/rides"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-rose-400 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cancelled Today
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.rides.cancelledToday ?? 0}
            </span>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Rider or timeout</p>
          </div>
        </Link>

        <Link
          href="/admin/drivers"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Online Drivers
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.drivers.online ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              of {data?.metrics.drivers.total ?? 0} registered
            </p>
          </div>
        </Link>

        <Link
          href="/admin/drivers"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Eligible Drivers
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-emerald-700">
              {loading ? "..." : data?.metrics.drivers.eligible ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Verified & unreserved</p>
          </div>
        </Link>

        <Link
          href="/admin/drivers"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-amber-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Reviews
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-amber-700">
              {loading ? "..." : data?.metrics.drivers.pendingVerification ?? 0}
            </span>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Mandatory docs queue</p>
          </div>
        </Link>

        <Link
          href="/admin/commutes"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-teal-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Daily Commutes
            </span>
            <Repeat className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.commutes.activeSchedules ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {data?.metrics.commutes.upcomingDepartures24h ?? 0} upcoming in 24h
            </p>
          </div>
        </Link>

        <Link
          href="/admin/support"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-rose-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Open Support
            </span>
            <Headphones className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : data?.metrics.support.unresolvedTotal ?? 0}
            </span>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">
              {data?.metrics.support.safetyOrUrgent ?? 0} safety / high priority
            </p>
          </div>
        </Link>

        <Link
          href="/admin/payments"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-amber-500 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Payment Exceptions
            </span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-amber-700">
              {loading ? "..." : data?.metrics.financial.totalExceptions ?? 0}
            </span>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              {data?.metrics.financial.failedTransactions ?? 0} failed / unconfirmed
            </p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Rides Requiring Dispatch Attention</h2>
              </div>
              <Link href="/admin/live-operations" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.queues.dispatchAttention && data.queues.dispatchAttention.length > 0 ? (
                data.queues.dispatchAttention.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{r.riderName}</span>
                        <AdminStatusBadge status="SEARCHING" size="sm" />
                        {r.petFriendly && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            PET
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {r.pickupAddress} &rarr; {r.dropoffAddress}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-400 text-[11px]">
                        Offers: <strong className="text-slate-700">{r.dispatchOfferCount}</strong>
                      </span>
                      <Link
                        href={`/admin/rides/${r.id}`}
                        className="block text-teal-600 hover:underline font-semibold text-[11px] mt-0.5"
                      >
                        Inspect &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active rides currently stuck in dispatch.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">Driver Compliance Review Queue</h2>
              </div>
              <Link href="/admin/drivers" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Verification Panel <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.queues.pendingDrivers && data.queues.pendingDrivers.length > 0 ? (
                data.queues.pendingDrivers.map((d) => (
                  <div key={d.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{d.name}</p>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {d.email} | {d.phone}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                        {d.pendingDocsCount} Docs Pending
                      </span>
                      <Link
                        href={`/admin/drivers/${d.id}`}
                        className="block text-teal-600 hover:underline font-semibold text-[11px] mt-1"
                      >
                        Review Docs &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Verification queue is completely clear.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Stuck Commute Occurrences</h2>
              </div>
              <Link href="/admin/commutes" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Manage Commutes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.queues.stuckOccurrences && data.queues.stuckOccurrences.length > 0 ? (
                data.queues.stuckOccurrences.map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{o.commuteTitle}</span>
                        <AdminStatusBadge status={o.status} size="sm" />
                      </div>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {o.riderName} | Attempts: {o.attemptCount} | Error: {o.lastError}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400">
                        {new Date(o.scheduledFor).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No failed or stuck recurrence occurrences.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-900">High-Priority & Safety Issues</h2>
              </div>
              <Link href="/admin/support" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Support Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.queues.priorityTickets && data.queues.priorityTickets.length > 0 ? (
                data.queues.priorityTickets.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[10px]">{t.ticketId}</span>
                        <span className="font-semibold text-slate-900 truncate">{t.subject}</span>
                        <AdminStatusBadge status={t.priority} size="sm" />
                      </div>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {t.userName} ({t.userRole}) &bull; {t.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <AdminStatusBadge status={t.status} size="sm" />
                      <Link
                        href={`/admin/support?search=${encodeURIComponent(t.ticketId)}`}
                        className="block text-teal-600 hover:underline font-semibold text-[11px] mt-1"
                      >
                        Respond &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active high-priority support tickets.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Recent Administrative Audit Events</h2>
          </div>
          <Link href="/admin/payments" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Complete Audit Log <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">Administrator</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Target</th>
                <th className="py-2">Justification / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800 whitespace-nowrap">
                      {log.actorEmail}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 font-mono text-[11px]">
                      {log.targetType}:{log.targetId.slice(-6)}
                    </td>
                    <td className="py-2.5 text-slate-500 truncate max-w-xs">{log.reason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No recent audit log entries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminOverviewDashboard;
