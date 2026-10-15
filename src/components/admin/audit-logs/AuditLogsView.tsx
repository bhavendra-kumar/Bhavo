"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";

export interface AuditLogItem {
  id: string;
  actor: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState("ALL");
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (targetTypeFilter !== "ALL") params.set("targetType", targetTypeFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setLogs(json.data.logs || []);
        setTotalPages(json.data.pagination?.pages || 1);
        setTotalCount(json.data.pagination?.total || 0);
        setError(null);
      } else {
        throw new Error(json.message || "Failed to load audit trail");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetTypeFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: () => {
      fetchLogs();
    },
    pollingIntervalMs: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Administrative Audit Trail</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-purple-950/60 text-purple-400 border border-purple-800/60">
              IMMUTABLE & APPEND-ONLY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative, cryptographically sanitized record of compliance reviews, account suspensions, commute updates, and ticket closures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            ← Back to Payments
          </Link>
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              fetchLogs();
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by actor email, target ID, or reason..."
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
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="DOCUMENT_APPROVE">DOCUMENT_APPROVE</option>
              <option value="DOCUMENT_REJECT">DOCUMENT_REJECT</option>
              <option value="USER_SUSPENDED">USER_SUSPENDED</option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="COMMUTE_PAUSED">COMMUTE_PAUSED</option>
              <option value="COMMUTE_RESUMED">COMMUTE_RESUMED</option>
              <option value="TICKET_RESOLVE">TICKET_RESOLVE</option>
              <option value="TICKET_UPDATE">TICKET_UPDATE</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Target Types</option>
              <option value="DRIVER">DRIVER</option>
              <option value="USER">USER</option>
              <option value="RIDE">RIDE</option>
              <option value="TICKET">TICKET</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>Failed to load audit logs: {error}</span>
          <button
            onClick={() => fetchLogs()}
            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Recorded Audit Trail ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No audit records match this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp & ID</th>
                  <th className="p-3">Actor (Admin)</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Reference</th>
                  <th className="p-3">Mandatory Reason</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-slate-200 text-[11px]">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        #{log.id.slice(-6)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-white">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.actor.slice(-8)}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-950 text-slate-400 uppercase mr-1">
                        {log.targetType}
                      </span>
                      <span className="text-white text-[11px]">{log.targetId}</span>
                    </td>
                    <td className="p-3 max-w-70">
                      <div className="text-slate-300 truncate" title={log.reason}>
                        {log.reason}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Inspect Diff
                      </button>
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
              Showing {logs.length} of {totalCount} records
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

      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white font-mono">
                  Audit Inspection: #{selectedLog.id.slice(-8)}
                </h2>
                <div className="text-[11px] text-slate-400">
                  {new Date(selectedLog.createdAt).toLocaleString()} by {selectedLog.actorEmail}
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Action & Target</div>
                <div className="text-white font-mono">
                  {selectedLog.action} on [{selectedLog.targetType}] {selectedLog.targetId}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Mandatory Reason</div>
                <div className="text-slate-200">{selectedLog.reason}</div>
              </div>

              {selectedLog.before && (
                <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Before State</div>
                  <pre className="text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">After State</div>
                  <pre className="text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogsView;
