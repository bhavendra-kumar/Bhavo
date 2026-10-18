"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  rating: number;
  walletBalance: number;
  tokenVersion: number;
  isOnline: boolean;
  dutyState: string;
  createdAt: string;
}

export function UsersView() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"ACTIVE" | "SUSPENDED" | "DISABLED">("SUSPENDED");
  const [statusReason, setStatusReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
      role: roleFilter,
      status: statusFilter,
      search,
    });

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.status === "success") {
          setUsers(json.data.users);
          setTotalPages(json.data.pagination.pages || 1);
          setTotalCount(json.data.pagination.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load users:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, roleFilter, statusFilter, search, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenStatusModal = (user: UserListItem) => {
    setSelectedUser(user);
    setTargetStatus(user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
    setStatusReason("");
    setActionError(null);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || statusReason.trim().length < 5) return;

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        setActionSuccess(
          `User ${selectedUser.name} successfully updated to status ${targetStatus}.`
        );
        setStatusModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setActionError(json.message || "Failed to update account status");
      }
    } catch {
      setActionError("Network error while updating user account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Account Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect customer and driver accounts, enforce account suspensions, and manage operational access.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
          <Users className="w-4 h-4 text-teal-600" />
          <span>{totalCount} Total Registered Accounts</span>
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

      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Roles</option>
            <option value="RIDER">Riders</option>
            <option value="DRIVER">Drivers</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
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

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading account records...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No accounts found matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">User Identity</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Session Version</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                  <th className="px-5 py-3 font-semibold text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isActive = user.status === "ACTIVE";

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {user.email} • {user.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            user.role === "ADMIN"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : user.role === "DRIVER"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">v{user.tokenVersion}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handleOpenStatusModal(user)}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-[11px] transition-colors ${
                              isActive
                                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {isActive ? "Suspend Account" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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

      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Modify Account Status: {selectedUser.name}
              </h3>
              <button
                onClick={() => setStatusModalOpen(false)}
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

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                <strong>Account:</strong> {selectedUser.email} ({selectedUser.role})
              </p>
              <p>
                <strong>Current Status:</strong> {selectedUser.status}
              </p>
              <p className="text-[11px] text-amber-700 pt-1">
                Notice: Suspending an account increments tokenVersion to immediately revoke all active
                sessions across mobile and web clients.
              </p>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) =>
                    setTargetStatus(e.target.value as "ACTIVE" | "SUSPENDED" | "DISABLED")
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to access platform)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily locked out)</option>
                  <option value="DISABLED">DISABLED (Permanently deactivated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Substantive Reason (Mandatory, min 5 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Compliance document fraud investigation, Policy violation, Resolved support dispute"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || statusReason.trim().length < 5}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 ${
                    targetStatus === "ACTIVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "Updating..." : `Confirm ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersView;
