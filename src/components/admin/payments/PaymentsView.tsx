"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface TransactionItem {
  id: string;
  idempotencyKey: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null;
  userRole: string;
  type: string;
  direction: string;
  amountInPaise: number;
  amountInRupees: number;
  currency: string;
  entityType: string;
  entityId: string;
  eventType: string;
  sequence: number;
  status: string;
  description: string;
  isCashCollectionRecord: boolean;
  createdAt: string;
}

export interface PaymentMetrics {
  totalLedgerEntries: number;
  settledCount: number;
  pendingCount: number;
  failedCount: number;
  cashRecordsCount: number;
  pendingCashCollectionRides: number;
  settledVolumeRupees: number;
  settledVolumePaise: number;
}

export function PaymentsView() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalLedgerEntries: 0,
    settledCount: 0,
    pendingCount: 0,
    failedCount: 0,
    cashRecordsCount: 0,
    pendingCashCollectionRides: 0,
    settledVolumeRupees: 0,
    settledVolumePaise: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setTransactions(json.data.transactions || []);
        setMetrics(json.data.metrics || {});
        setTotalPages(json.data.pagination?.pages || 1);
        setTotalCount(json.data.pagination?.total || 0);
        setError(null);
      } else {
        throw new Error(json.message || "Failed to load payment transactions");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: () => {
      fetchPayments();
    },
    pollingIntervalMs: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Payments & Financial Audit</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              IMMUTABLE FINANCIAL LEDGER
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative double-entry ledger oversight, cash collection verification, and Razorpay reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/audit-logs"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            Open Administrative Audit Logs →
          </Link>
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              fetchPayments();
            }}
          />
        </div>
      </div>

      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-[11px] uppercase tracking-wider">
          <span>🛡️ Financial Invariants & Compliance Rules</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          1. <span className="text-white font-medium">Physical Cash Invariant:</span> Physical cash collected by drivers is tracked strictly as driver-held cash settlements and is <span className="text-amber-400 font-semibold">NEVER</span> credited to the platform wallet or treated as platform funds.
        </p>
        <p className="text-slate-300 leading-relaxed">
          2. <span className="text-white font-medium">Razorpay Settlement:</span> Online payments remain disabled by default in sandbox mode. Orders are authoritative only after server-side cryptographic signature verification.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Ledger Entries
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {metrics.totalLedgerEntries}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immutable records</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Settled Online Volume
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            ₹{metrics.settledVolumeRupees.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Authoritative capture</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Pending Settlements
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {metrics.pendingCount}
          </div>
          <div className="text-[10px] text-amber-500 mt-0.5">Awaiting provider capture</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Driver Cash Records
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {metrics.cashRecordsCount}
          </div>
          <div className="text-[10px] text-blue-500 mt-0.5">Driver collected directly</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Awaiting Collection
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">
            {metrics.pendingCashCollectionRides}
          </div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Active uncollected rides</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search idempotency key, ride ID, user ID, or description..."
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
              <option value="ALL">All Ledger States</option>
              <option value="SETTLED">SETTLED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REVERSED">REVERSED</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="CASH_COLLECTED_BY_DRIVER">Cash Collected by Driver</option>
              <option value="FARE_PAYMENT">Fare Payment</option>
              <option value="PLATFORM_COMMISSION">Platform Commission</option>
              <option value="WALLET_TOPUP">Wallet Top-up</option>
              <option value="WALLET_DEBIT">Wallet Debit</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>Failed to load ledger: {error}</span>
          <button
            onClick={() => fetchPayments()}
            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Financial Ledger Entries ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ledger transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transaction records match this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Idempotency Key & Date</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Entity / Ride Reference</th>
                  <th className="p-3">Type & Direction</th>
                  <th className="p-3">Amount (₹)</th>
                  <th className="p-3">Ledger Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-white font-medium text-[11px] truncate max-w-45" title={tx.idempotencyKey}>
                        {tx.idempotencyKey}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">
                        {tx.user ? tx.user.name : "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">
                        {tx.userRole}
                      </div>
                    </td>
                    <td className="p-3">
                      {tx.entityType === "RIDE" ? (
                        <Link
                          href={`/admin/rides/${tx.entityId}`}
                          className="font-mono text-blue-400 hover:text-blue-300 underline"
                        >
                          Ride #{tx.entityId.slice(-8)}
                        </Link>
                      ) : (
                        <span className="font-mono text-slate-400">
                          {tx.entityType}: #{tx.entityId.slice(-8)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-[11px] text-slate-200">
                        {tx.type}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Direction: {tx.direction}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-medium">
                      <span className={tx.direction === "CREDIT" ? "text-emerald-400" : "text-white"}>
                        {tx.direction === "CREDIT" ? "+" : tx.direction === "DEBIT" ? "-" : ""}
                        ₹{tx.amountInRupees.toFixed(2)}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {tx.amountInPaise} paise
                      </div>
                    </td>
                    <td className="p-3">
                      <AdminStatusBadge status={tx.status} />
                      {tx.isCashCollectionRecord && (
                        <div className="mt-1">
                          <span className="inline-block text-[9px] px-1 py-0.2 rounded font-mono bg-blue-950/60 text-blue-400 border border-blue-800/50">
                            CASH RECORD
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Inspect
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
              Showing {transactions.length} of {totalCount} ledger entries
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

      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white font-mono">
                  Ledger Entry: {selectedTx.idempotencyKey.slice(-12)}
                </h2>
                <div className="text-[11px] text-slate-400">
                  Recorded: {new Date(selectedTx.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Description</div>
                <div className="text-white">{selectedTx.description || "No description recorded"}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Financial Amount</div>
                  <div className="text-lg font-bold font-mono text-white">₹{selectedTx.amountInRupees.toFixed(2)}</div>
                  <div className="text-slate-400 font-mono text-[10px]">{selectedTx.amountInPaise} paise ({selectedTx.currency})</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Status & Direction</div>
                  <div><AdminStatusBadge status={selectedTx.status} /></div>
                  <div className="text-slate-300 font-mono text-[11px]">{selectedTx.direction}</div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Entity Linkage</div>
                <div>Entity Type: <span className="font-mono text-white">{selectedTx.entityType}</span></div>
                <div>
                  Entity ID:{" "}
                  {selectedTx.entityType === "RIDE" ? (
                    <Link
                      href={`/admin/rides/${selectedTx.entityId}`}
                      className="font-mono text-blue-400 hover:text-blue-300 underline"
                    >
                      {selectedTx.entityId} (View Ride →)
                    </Link>
                  ) : (
                    <span className="font-mono text-white">{selectedTx.entityId}</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Idempotency Protection</div>
                <div className="font-mono text-[11px] text-slate-300 break-all">{selectedTx.idempotencyKey}</div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTx(null)}
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

export default PaymentsView;
