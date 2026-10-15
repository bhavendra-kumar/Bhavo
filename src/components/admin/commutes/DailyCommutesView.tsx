"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface CommuteItem {
  id: string;
  title: string;
  rider: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  pickup: {
    address: string;
  };
  dropoff: {
    address: string;
  };
  time: string;
  days: string[];
  vehicleType: string;
  isActive: boolean;
  paymentMethod: string;
  petFriendly: boolean;
  lastMaterializedAt: string | null;
  stats: {
    recentOccurrencesCount: number;
    materializedCount: number;
    failedCount: number;
    nextOccurrenceScheduledFor: string | null;
    nextOccurrenceStatus: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommuteMetrics {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  petFriendlySchedules: number;
  materializedToday: number;
  failedToday: number;
}

export function DailyCommutesView() {
  const [commutes, setCommutes] = useState<CommuteItem[]>([]);
  const [metrics, setMetrics] = useState<CommuteMetrics>({
    totalSchedules: 0,
    activeSchedules: 0,
    pausedSchedules: 0,
    petFriendlySchedules: 0,
    materializedToday: 0,
    failedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [weekdayFilter, setWeekdayFilter] = useState("ALL");
  const [petFilter, setPetFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [actionSchedule, setActionSchedule] = useState<CommuteItem | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCommutes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (weekdayFilter !== "ALL") params.set("weekday", weekdayFilter);
      if (petFilter !== "ALL") params.set("petFriendly", petFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/commutes?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setCommutes(json.data.commutes || []);
        setMetrics(json.data.metrics || {});
        setTotalPages(json.data.pagination?.pages || 1);
        setTotalCount(json.data.pagination?.total || 0);
        setError(null);
      } else {
        throw new Error(json.message || "Failed to load commutes");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, weekdayFilter, petFilter, search]);

  useEffect(() => {
    fetchCommutes();
  }, [fetchCommutes]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: () => {
      fetchCommutes();
    },
    pollingIntervalMs: 12000,
  });

  const handleToggleActive = async () => {
    if (!actionSchedule) return;
    if (!actionReason.trim() || actionReason.trim().length < 5) {
      setActionError("Please provide an administrative reason (at least 5 characters).");
      return;
    }

    try {
      setSubmittingAction(true);
      setActionError(null);
      const res = await fetch(`/api/admin/commutes/${actionSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !actionSchedule.isActive,
          reason: actionReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Failed to update commute status");
      }

      setActionSchedule(null);
      setActionReason("");
      fetchCommutes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute action";
      setActionError(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Daily Commutes</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-purple-950/60 text-purple-400 border border-purple-800/60">
              RECURRING SCHEDULES & OCCURRENCES
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage individual student and employee recurring commute schedules, occurrence generation, and materialization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              fetchCommutes();
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Schedules
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {metrics.totalSchedules}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recurring riders</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Active Schedules
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {metrics.activeSchedules}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Auto-generation active</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Paused Schedules
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {metrics.pausedSchedules}
          </div>
          <div className="text-[10px] text-amber-500 mt-0.5">Occurrences skipped</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Pet-Friendly
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {metrics.petFriendlySchedules}
          </div>
          <div className="text-[10px] text-cyan-500 mt-0.5">Pet compatibility required</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Materialized Today
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {metrics.materializedToday}
          </div>
          <div className="text-[10px] text-blue-500 mt-0.5">T-180m generated rides</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Failed Occurrences
          </div>
          <div className="text-xl font-bold text-red-400 mt-1">
            {metrics.failedToday}
          </div>
          <div className="text-[10px] text-red-500 mt-0.5">Retry or fatal errors</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search schedule ID, title, rider, or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </select>

            <select
              value={weekdayFilter}
              onChange={(e) => {
                setWeekdayFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Weekdays</option>
              <option value="Mon">Monday</option>
              <option value="Tue">Tuesday</option>
              <option value="Wed">Wednesday</option>
              <option value="Thu">Thursday</option>
              <option value="Fri">Friday</option>
              <option value="Sat">Saturday</option>
              <option value="Sun">Sunday</option>
            </select>

            <select
              value={petFilter}
              onChange={(e) => {
                setPetFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Pet Filters</option>
              <option value="true">Pet-Friendly Only</option>
              <option value="false">Standard Rides</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>Failed to load schedules: {error}</span>
          <button
            onClick={() => fetchCommutes()}
            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Commute Schedules ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading recurring commute schedules...</div>
        ) : commutes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No commute schedules match your search/filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Schedule ID & Title</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Pickup → Dropoff</th>
                  <th className="p-3">Schedule & Days</th>
                  <th className="p-3">Vehicle & Pet</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Next Occurrence</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {commutes.map((commute) => (
                  <tr key={commute.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-white font-medium">
                        {commute.id.slice(-8)}
                      </div>
                      <div className="text-slate-300 font-medium truncate max-w-40" title={commute.title}>
                        {commute.title}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">
                        {commute.rider ? commute.rider.name : "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {commute.rider?.phone || "No phone"}
                      </div>
                    </td>
                    <td className="p-3 max-w-50">
                      <div className="truncate text-slate-300 font-medium" title={commute.pickup.address}>
                        {commute.pickup.address}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={commute.dropoff.address}>
                        → {commute.dropoff.address}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-white">{commute.time}</div>
                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-1 mt-0.5">
                        {commute.days.map((d) => (
                          <span key={d} className="bg-slate-800 px-1 py-0.2 rounded text-[9px] font-mono">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{commute.vehicleType}</div>
                      {commute.petFriendly && (
                        <span className="inline-block mt-0.5 text-[10px] px-1 py-0.2 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                          PET-FRIENDLY
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {commute.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {commute.stats.nextOccurrenceScheduledFor ? (
                        <div>
                          <div className="font-mono text-slate-200 text-[11px]">
                            {new Date(commute.stats.nextOccurrenceScheduledFor).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="mt-0.5">
                            <AdminStatusBadge status={commute.stats.nextOccurrenceStatus || "PENDING"} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-[11px]">None pending</div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/commutes/${commute.id}`}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                        >
                          Inspect
                        </Link>
                        <button
                          onClick={() => {
                            setActionSchedule(commute);
                            setActionReason("");
                            setActionError(null);
                          }}
                          className={`px-2 py-1 text-[11px] rounded transition-colors ${
                            commute.isActive
                              ? "bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 border border-amber-800/50"
                              : "bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/50"
                          }`}
                        >
                          {commute.isActive ? "Pause" : "Resume"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {commutes.length} of {totalCount} schedules
            </div>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {actionSchedule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              {actionSchedule.isActive ? "Pause Commute Schedule" : "Resume Commute Schedule"}
            </h2>
            <p className="text-xs text-slate-300">
              You are about to {actionSchedule.isActive ? "pause" : "resume"} schedule{" "}
              <span className="font-mono text-white">#{actionSchedule.id}</span> ({actionSchedule.title}).
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Administrative Reason (Mandatory for Audit Trail)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="State the reason for pausing/resuming this commuter schedule..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {actionError && (
              <div className="p-2.5 bg-red-950/50 border border-red-800 rounded text-xs text-red-300">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActionSchedule(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleActive}
                disabled={submittingAction}
                className={`px-4 py-1.5 rounded text-xs text-white font-medium disabled:opacity-50 ${
                  actionSchedule.isActive
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {submittingAction
                  ? "Processing..."
                  : actionSchedule.isActive
                  ? "Confirm Pause"
                  : "Confirm Resume"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyCommutesView;
