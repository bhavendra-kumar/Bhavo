"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface RideListItem {
  id: string;
  rider: { id: string; name: string; email: string; phone: string } | null;
  driver: { id: string; name: string; email: string; phone: string; vehicleNumber?: string } | null;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  fareInPaise?: number;
  fareInRupees: number;
  vehicleType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  petFriendly: boolean;
  bookingType: "COMMUTE" | "ON_DEMAND";
  scheduledFor: string | null;
  isAutoBooked: boolean;
  createdAt: string;
}

export function AllRidesView() {
  const [rides, setRides] = useState<RideListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("ALL");
  const [petFilter, setPetFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRides = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (paymentStatusFilter !== "ALL") params.set("paymentStatus", paymentStatusFilter);
      if (bookingTypeFilter !== "ALL") params.set("bookingType", bookingTypeFilter);
      if (petFilter !== "ALL") params.set("petFriendly", petFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/rides?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setRides(json.data.rides || []);
        setTotalPages(json.data.pagination?.pages || 1);
        setTotalCount(json.data.pagination?.total || 0);
        setError(null);
      } else {
        throw new Error(json.message || "Failed to load rides");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentStatusFilter, bookingTypeFilter, petFilter, search]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: () => {
      fetchRides();
    },
    pollingIntervalMs: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>All Rides</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-950/60 text-blue-400 border border-blue-800/60">
              HISTORICAL & LIVE LEDGER
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and audit all on-demand and recurring commute trip records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              fetchRides();
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by ride ID, pickup, dropoff, or vehicle type..."
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
              <option value="ALL">All Ride States</option>
              <option value="SEARCHING">SEARCHING</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="ARRIVED">ARRIVED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Payment States</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="COLLECTED">COLLECTED</option>
              <option value="PENDING_COLLECTION">PENDING_COLLECTION</option>
              <option value="FAILED">FAILED</option>
            </select>

            <select
              value={bookingTypeFilter}
              onChange={(e) => {
                setBookingTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Booking Types</option>
              <option value="COMMUTE">Commute Occurrence</option>
              <option value="ON_DEMAND">On-Demand</option>
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
          <span>Failed to load rides: {error}</span>
          <button
            onClick={() => fetchRides()}
            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Recorded Rides ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ride records...</div>
        ) : rides.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No rides match this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Ride ID & Date</th>
                  <th className="p-3">Booking Type</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Pickup → Dropoff</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Fare & Payment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-white font-medium">
                        #{ride.id.slice(-8)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ride.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      {ride.bookingType === "COMMUTE" ? (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-950/60 text-purple-400 border border-purple-800/50">
                          COMMUTE
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                          ON-DEMAND
                        </span>
                      )}
                      {ride.petFriendly && (
                        <div className="mt-1">
                          <span className="inline-block text-[9px] px-1 py-0.2 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                            PET
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">
                        {ride.rider ? ride.rider.name : "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ride.rider?.phone || "No phone"}
                      </div>
                    </td>
                    <td className="p-3">
                      {ride.driver ? (
                        <div>
                          <div className="font-medium text-slate-200">{ride.driver.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {ride.driver.vehicleNumber || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 max-w-50">
                      <div className="truncate text-slate-300 font-medium" title={ride.pickupAddress}>
                        {ride.pickupAddress}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={ride.dropoffAddress}>
                        → {ride.dropoffAddress}
                      </div>
                    </td>
                    <td className="p-3">
                      <AdminStatusBadge status={ride.status} />
                    </td>
                    <td className="p-3 font-mono">
                      <div className="font-medium text-white">
                        ₹{ride.fareInRupees.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">
                        {ride.paymentMethod} • {ride.paymentStatus}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/rides/${ride.id}`}
                        className="inline-block px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        Inspect
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
              Showing {rides.length} of {totalCount} records
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

export default AllRidesView;
