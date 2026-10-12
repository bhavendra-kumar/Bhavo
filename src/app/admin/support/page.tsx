"use client";

import React, { useEffect, useState } from "react";
import {
  Headphones,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";

interface TicketListItem {
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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Ticket update modal state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketListItem | null>(null);
  const [targetStatus, setTargetStatus] = useState("IN_PROGRESS");
  const [targetPriority, setTargetPriority] = useState("MEDIUM");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
      status: statusFilter,
      priority: priorityFilter,
      search,
    });

    fetch(`/api/admin/support?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.status === "success") {
          setTickets(json.data.tickets);
          setTotalPages(json.data.pagination.pages || 1);
          setTotalCount(json.data.pagination.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load support tickets:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, statusFilter, priorityFilter, search, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

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
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
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
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setActionError(json.message || "Failed to update ticket");
      }
    } catch {
      setActionError("Network error while updating ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Ticket Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage passenger and driver support inquiries, investigate disputes, and record resolutions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
          <Headphones className="w-4 h-4 text-teal-600" />
          <span>{totalCount} Total Support Inquiries</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-900 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">HIGH Priority</option>
            <option value="MEDIUM">MEDIUM Priority</option>
            <option value="LOW">LOW Priority</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticket ID or text..."
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

      {/* Tickets Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading support queue...</div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No support tickets match this criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ticket</th>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Subject & Description</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 font-mono">{ticket.ticketId}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {ticket.user?.name || "Unknown User"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ticket.user?.role || "USER"} • {ticket.user?.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="font-semibold text-slate-900 truncate">{ticket.subject}</div>
                      <div className="text-[11px] text-slate-500 truncate">{ticket.description}</div>
                      {ticket.resolutionNotes && (
                        <div className="text-[10px] text-emerald-600 font-medium truncate mt-0.5">
                          Resolution: {ticket.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ticket.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : ticket.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${
                          ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ticket.status === "IN_PROGRESS"
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {ticket.status === "RESOLVED" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(ticket)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-colors"
                      >
                        Manage
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

      {/* Ticket Update Modal */}
      {updateModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Manage Ticket #{selectedTicket.ticketId}
              </h3>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            {/* Ticket Subject & Description Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-slate-900">{selectedTicket.subject}</p>
              <p className="text-slate-600 whitespace-pre-wrap">{selectedTicket.description}</p>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                Requester: {selectedTicket.user?.name} ({selectedTicket.user?.email})
              </div>
            </div>

            <form onSubmit={handleConfirmTicketUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={targetPriority}
                    onChange={(e) => setTargetPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes / Operator Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Record dispute resolution, action taken, or explanation for closing..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
