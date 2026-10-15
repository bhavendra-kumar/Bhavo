"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface RiderItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  walletBalanceInRupees: number;
  pets: Array<{ name: string; breed: string; weight: string }>;
  hasPets: boolean;
  rideCount: number;
  commuteCount: number;
  createdAt: string;
}

export interface RiderMetrics {
  totalRiders: number;
  activeRiders: number;
  suspendedRiders: number;
  ridersWithPets: number;
}

export function RidersView() {
  const [riders, setRiders] = useState<RiderItem[]>([]);
  const [metrics, setMetrics] = useState<RiderMetrics>({
    totalRiders: 0,
    activeRiders: 0,
    suspendedRiders: 0,
    ridersWithPets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [petFilter, setPetFilter] = useState("ALL");
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
    async function loadRiders() {
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (petFilter !== "ALL") params.set("hasPets", petFilter);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/riders?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        if (ignore) return;
        if (json.status === "success") {
          setRiders(json.data.riders || []);
          setMetrics(json.data.metrics || {});
          setTotalPages(json.data.pagination?.pages || 1);
          setTotalCount(json.data.pagination?.total || 0);
          setError(null);
        } else {
          setError(json.message || "Failed to load riders directory");
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

    loadRiders();
    return () => {
      ignore = true;
    };
  }, [page, statusFilter, petFilter, search, refreshTick]);

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
            <span>Riders Directory</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-950/60 text-blue-400 border border-blue-800/60">
              COMMUTERS & PASSENGERS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search individual rider accounts, commute schedules, trip history, and pet-ride preferences.
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Riders
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {metrics.totalRiders}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered accounts</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Active Accounts
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {metrics.activeRiders}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Booking enabled</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Suspended Riders
          </div>
          <div className="text-xl font-bold text-red-400 mt-1">
            {metrics.suspendedRiders}
          </div>
          <div className="text-[10px] text-red-500 mt-0.5">Access revoked</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Riders with Pets
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {metrics.ridersWithPets}
          </div>
          <div className="text-[10px] text-cyan-500 mt-0.5">Pet profile saved</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search rider name, email, phone, or account ID..."
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
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
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
              <option value="true">Has Registered Pets</option>
              <option value="false">No Pets</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>Failed to load riders: {error}</span>
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
            Rider Accounts ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading rider directory...</div>
        ) : riders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No riders match this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Rider Name & ID</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Pets Registered</th>
                  <th className="p-3">Trips Taken</th>
                  <th className="p-3">Daily Commutes</th>
                  <th className="p-3">Wallet (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{rider.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        #{rider.id.slice(-8)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-300">{rider.phone}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{rider.email}</div>
                    </td>
                    <td className="p-3">
                      <AdminStatusBadge status={rider.status} />
                    </td>
                    <td className="p-3">
                      {rider.pets && rider.pets.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rider.pets.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50"
                              title={`${p.breed} (${p.weight})`}
                            >
                              🐾 {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-200">
                      {rider.rideCount}
                    </td>
                    <td className="p-3 font-mono text-purple-400">
                      {rider.commuteCount}
                    </td>
                    <td className="p-3 font-mono text-white">
                      ₹{rider.walletBalanceInRupees.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/riders/${rider.id}`}
                        className="inline-block px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Inspect Profile
                      </Link>
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
              Showing {riders.length} of {totalCount} records
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

export default RidersView;
