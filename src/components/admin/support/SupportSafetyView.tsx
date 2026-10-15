"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface TicketListItem {
  id: string;
  ticketId: string;
  user: { id: string; name: string; email: string; phone: string; role: string } | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMetrics {
  total: number;
  openCount: number;
  inProgressCount: number;
  highPriorityCount: number;
  resolvedCount: number;
  closedCount: number;
}

export function SupportSafetyView() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics>({
    total: 0,
    openCount: 0,
    inProgressCount: 0,
    highPriorityCount: 0,
    resolvedCount: 0,
    closedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketListItem | null>(null);
  const [targetStatus, setTargetStatus] = useState("IN_PROGRESS");
  const [targetPriority, setTargetPriority] = useState("MEDIUM");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/support?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setTickets(json.data.tickets || []);
        setMetrics(json.data.metrics || {});
        setTotalPages(json.data.pagination?.pages || 1);
        setTotalCount(json.data.pagination?.total || 0);
        setActionError(null);
      } else {
        throw new Error(json.message || "Failed to load support tickets");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setActionError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, categoryFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: () => {
      fetchTickets();
    },
    pollingIntervalMs: 15000,
  });

  const handleOpenUpdateModal = (ticket: TicketListItem) => {
    setSelectedTicket(ticket);
    setTargetStatus(ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status);
    setTargetPriority(ticket.priority);
    setResolutionNotes(ticket.resolutionNotes || "");
    setActionError(null);
    setUpdateModalOpen(true);
  };

  const handleConfirmTicketUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          priority: targetPriority,
          resolutionNotes: resolutionNotes.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        setActionSuccess(`Ticket ${selectedTicket.ticketId} updated successfully.`);
        setUpdateModalOpen(false);
        fetchTickets();
      } else {
        setActionError(json.message || "Failed to update ticket");
      }
    } catch {
      setActionError("Network error while communicating with support service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Support & Safety Operations</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-rose-950/60 text-rose-400 border border-rose-800/60">
              SAFETY & INCIDENT DESK
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted rider and driver support tickets, safety incident escalation, and verified resolution tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              fetchTickets();
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Standard Operations Workflow:
        </span>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">1. Create Ticket</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">2. Review Issue</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">3. Assign</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">4. Respond</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">5. Escalate if Needed</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">6. Close Ticket</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Open Tickets
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {metrics.openCount}
          </div>
          <div className="text-[10px] text-amber-500 mt-0.5">Awaiting first response</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            In Progress / Review
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {metrics.inProgressCount}
          </div>
          <div className="text-[10px] text-blue-500 mt-0.5">Under active investigation</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Safety & High Priority
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {metrics.highPriorityCount}
          </div>
          <div className="text-[10px] text-rose-500 mt-0.5">Escalated incident cases</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Resolved / Closed
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {metrics.resolvedCount + metrics.closedCount}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Authoritative resolution</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by ticket ID, subject, or description..."
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
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High (Safety Incident)</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="ride_issue">Ride Issue</option>
              <option value="payment">Payment & Billing</option>
              <option value="driver">Driver Behaviour</option>
              <option value="app_issue">App Technical Issue</option>
              <option value="other">General Inquiries</option>
            </select>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Support Queue ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading support cases...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No support tickets match this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Ticket ID & Created</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subject & Issue Summary</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-white font-medium">{ticket.ticketId}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">
                        {ticket.user ? ticket.user.name : "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ticket.user?.phone || "No phone"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">
                        {ticket.user?.role || "USER"}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[11px] uppercase text-slate-300">
                        {ticket.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 max-w-65">
                      <div className="font-semibold text-slate-200 truncate" title={ticket.subject}>
                        {ticket.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5" title={ticket.description}>
                        {ticket.description}
                      </div>
                      {ticket.resolutionNotes && (
                        <div className="text-[10px] text-emerald-400 truncate mt-1">
                          ✓ Note: {ticket.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {ticket.priority === "HIGH" ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-mono">
                          🚨 HIGH (SAFETY)
                        </span>
                      ) : ticket.priority === "MEDIUM" ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 font-mono">
                          MEDIUM
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 font-mono">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <AdminStatusBadge status={ticket.status} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(ticket)}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Respond & Update
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
              Showing {tickets.length} of {totalCount} tickets
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

      {updateModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                Ticket Action: {selectedTicket.ticketId}
              </h2>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1 text-xs">
              <div className="font-semibold text-slate-200">{selectedTicket.subject}</div>
              <div className="text-slate-400">{selectedTicket.description}</div>
              <div className="text-slate-500 pt-1">
                From: {selectedTicket.user ? selectedTicket.user.name : "N/A"} ({selectedTicket.user?.email})
              </div>
            </div>

            <form onSubmit={handleConfirmTicketUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 mt-1"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Under Review)</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Priority Level</label>
                  <select
                    value={targetPriority}
                    onChange={(e) => setTargetPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 mt-1"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH (Safety Escalation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Resolution Notes / Operational Response (Audit-Logged)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Summarize investigation outcome, contact with rider/driver, or safety disposition..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportSafetyView;
