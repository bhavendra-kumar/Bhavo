"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  X,
  Eye,
  Filter,
} from "lucide-react";

interface AuditLogItem {
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

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail inspection modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
      action: actionFilter,
      targetType: targetTypeFilter,
      search,
    });

    fetch(`/api/admin/audit-logs?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.status === "success") {
          setLogs(json.data.logs);
          setTotalPages(json.data.pagination.pages || 1);
          setTotalCount(json.data.pagination.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load audit logs:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, actionFilter, targetTypeFilter, search, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("APPROVE") || action.includes("REACTIVATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("REJECT") || action.includes("SUSPEND")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administrative Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable, append-only record of compliance decisions, account status modifications, and support interventions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{totalCount} Total Recorded Audit Events</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Actions</option>
            <option value="DOCUMENT_APPROVE">DOCUMENT_APPROVE</option>
            <option value="DOCUMENT_REJECT">DOCUMENT_REJECT</option>
            <option value="ACCOUNT_SUSPEND">ACCOUNT_SUSPEND</option>
            <option value="ACCOUNT_REACTIVATE">ACCOUNT_REACTIVATE</option>
            <option value="TICKET_UPDATE">TICKET_UPDATE</option>
            <option value="TICKET_RESOLVE">TICKET_RESOLVE</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Entities</option>
            <option value="DRIVER">DRIVER</option>
            <option value="USER">USER</option>
            <option value="RIDE">RIDE</option>
            <option value="TICKET">TICKET</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by actor, target, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No audit records match this criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Administrator</th>
                  <th className="px-5 py-3 font-semibold">Target Entity</th>
                  <th className="px-5 py-3 font-semibold">Stated Reason</th>
                  <th className="px-5 py-3 font-semibold text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-5">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{log.actorEmail}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {log.targetType}: #{log.targetId.slice(-6)}
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="truncate text-slate-700 font-medium">{log.reason}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Diff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Audit Event #{selectedLog.id.slice(-8)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedLog.action} by {selectedLog.actorEmail} on {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Target:</strong> {selectedLog.targetType} (ID: {selectedLog.targetId})
              </p>
              <p>
                <strong>Reason:</strong> {selectedLog.reason}
              </p>
              {selectedLog.ip && (
                <p className="text-[11px] text-slate-400">IP: {selectedLog.ip}</p>
              )}
            </div>

            {/* Before vs After Snapshots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  State Before
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-60">
                  {selectedLog.before
                    ? JSON.stringify(selectedLog.before, null, 2)
                    : "null (No prior state recorded)"}
                </pre>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  State After
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-60">
                  {selectedLog.after
                    ? JSON.stringify(selectedLog.after, null, 2)
                    : "null (No state change payload)"}
                </pre>
              </div>
            </div>

            {selectedLog.metadata && (
              <div>
                <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                  Metadata
                </span>
                <pre className="p-3 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-mono overflow-x-auto max-h-40">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
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
