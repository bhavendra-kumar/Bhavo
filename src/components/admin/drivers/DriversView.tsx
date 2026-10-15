"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface DriverListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  isOnline: boolean;
  dutyState: string;
  rating: number;
  vehicle: {
    model: string;
    numberPlate: string;
    type: string;
    documentsVerified: boolean;
  };
  verification: {
    isVerified: boolean;
    totalDocs: number;
    verifiedCount: number;
    pendingCount: number;
    rejectedCount: number;
    reason: string | null;
  };
  createdAt: string;
}

export function DriversView() {
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [refreshTick, setRefreshTick] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadDrivers() {
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/drivers?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        if (ignore) return;
        if (json.status === "success") {
          setDrivers(json.data.drivers || []);
          setTotalPages(json.data.pagination?.pages || 1);
          setTotalCount(json.data.pagination?.total || 0);
          setError(null);
        } else {
          setError(json.message || "Failed to load drivers");
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Network error";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDrivers();
    return () => {
      ignore = true;
    };
  }, [page, statusFilter, search, refreshTick]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: triggerRefresh,
    pollingIntervalMs: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Drivers & Compliance Verification</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
              FLEET & REGULATORY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review driver onboarding evidence, canonical 8-document compliance, duty states, and account status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              triggerRefresh();
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search driver name, email, phone, license plate..."
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
              <option value="ALL">All Compliance States</option>
              <option value="VERIFIED">Fully Verified (8/8)</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Has Rejected Documents</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>Failed to load drivers: {error}</span>
          <button
            onClick={() => triggerRefresh()}
            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Registered Drivers ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading driver records...</div>
        ) : drivers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No drivers match this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Driver Identity</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Duty & Telemetry</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3">Document Compliance</th>
                  <th className="p-3">Dispatch Eligibility</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {drivers.map((driver) => {
                  const isEligible =
                    driver.status === "ACTIVE" &&
                    driver.isOnline &&
                    driver.dutyState !== "ON_TRIP" &&
                    driver.verification.isVerified;

                  return (
                    <tr key={driver.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-white">{driver.name}</div>
                        <div className="text-[11px] text-slate-400">{driver.phone}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{driver.email}</div>
                      </td>
                      <td className="p-3">
                        <AdminStatusBadge status={driver.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {driver.isOnline ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              ONLINE
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">OFFLINE</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {driver.dutyState}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200 font-medium">
                          {driver.vehicle.model || "Vehicle N/A"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {driver.vehicle.numberPlate || "Plate N/A"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {driver.vehicle.type}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          {driver.verification.isVerified ? (
                            <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                              Verified (8/8)
                            </span>
                          ) : driver.verification.rejectedCount > 0 ? (
                            <span className="inline-block text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50">
                              {driver.verification.rejectedCount} Rejected
                            </span>
                          ) : (
                            <span className="inline-block text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                              {driver.verification.pendingCount} Pending Review
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {driver.verification.verifiedCount} / {driver.verification.totalDocs} approved
                        </div>
                      </td>
                      <td className="p-3">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            ELIGIBLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded">
                            INELIGIBLE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/drivers/${driver.id}`}
                          className="inline-block px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                        >
                          Review & Verify
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {drivers.length} of {totalCount} records
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
    </div>
  );
}

export default DriversView;
