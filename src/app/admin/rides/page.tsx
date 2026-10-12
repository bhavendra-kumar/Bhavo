"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
  Zap,
  Calendar,
} from "lucide-react";

interface RideListItem {
  id: string;
  rider: { id: string; name: string; email: string; phone: string } | null;
  driver: { id: string; name: string; email: string; phone: string } | null;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  fareInPaise?: number;
  vehicleType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  scheduledFor: string | null;
  isAutoBooked: boolean;
  createdAt: string;
}

export default function AdminRidesPage() {
  const [rides, setRides] = useState<RideListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
      search,
    });

    fetch(`/api/admin/rides?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.status === "success") {
          setRides(json.data.rides);
          setTotalPages(json.data.pagination.pages || 1);
          setTotalCount(json.data.pagination.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load rides:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, statusFilter, paymentStatusFilter, search, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
      case "ARRIVED":
      case "ACCEPTED":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "SEARCHING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ride Operations Explorer</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Read-only platform ride log, dispatch matching, authoritative fares, and operational state transitions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
          <Car className="w-4 h-4 text-teal-600" />
          <span>{totalCount} Total Recorded Trips</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Payment States</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="COLLECTED">COLLECTED</option>
            <option value="PENDING_COLLECTION">PENDING_COLLECTION</option>
          </select>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by address or ID..."
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

      {/* Rides Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading ride operations...</div>
        ) : rides.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No rides match this criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your status or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ride Identifier</th>
                  <th className="px-5 py-3 font-semibold">Rider & Driver</th>
                  <th className="px-5 py-3 font-semibold">Route & Type</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Fare & Payment</th>
                  <th className="px-5 py-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-slate-900">#{ride.id.slice(-6)}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ride.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {ride.isAutoBooked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 mt-1">
                          <Zap className="w-3 h-3" /> Auto-Booked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">
                        Rider: {ride.rider?.name || "Anonymous"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ride.driver ? `Driver: ${ride.driver.name}` : "Unassigned"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="truncate font-medium text-slate-800">{ride.pickupAddress}</div>
                      <div className="truncate text-[11px] text-slate-500">→ {ride.dropoffAddress}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{ride.vehicleType}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadgeClass(
                          ride.status
                        )}`}
                      >
                        {ride.status}
                      </span>
                      {ride.scheduledFor && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(ride.scheduledFor).toLocaleDateString()}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">
                        ₹{ride.fare}
                        {ride.fareInPaise && (
                          <span className="text-[10px] text-slate-400 font-mono ml-1">
                            ({ride.fareInPaise}p)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ride.paymentMethod} • {ride.paymentStatus}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/rides/${ride.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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
    </div>
  );
}
