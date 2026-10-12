"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
} from "lucide-react";

interface DriverListItem {
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

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
      status: statusFilter,
      search,
    });

    fetch(`/api/admin/drivers?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.status === "success") {
          setDrivers(json.data.drivers);
          setTotalPages(json.data.pagination.pages || 1);
          setTotalCount(json.data.pagination.total || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch drivers:", err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, statusFilter, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driver Verification</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review submitted compliance documents, identity proofs, and vehicle certifications.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <span>{totalCount} Total Registered Drivers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Drivers" },
            { id: "PENDING", label: "Pending Review" },
            { id: "VERIFIED", label: "Fully Verified" },
            { id: "REJECTED", label: "Rejected Docs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, phone, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
          >
            Find
          </button>
        </form>
      </div>

      {/* Drivers Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading driver records...</div>
        ) : drivers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No drivers match this criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your status filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Driver Info</th>
                  <th className="px-5 py-3 font-semibold">Vehicle</th>
                  <th className="px-5 py-3 font-semibold">Duty Status</th>
                  <th className="px-5 py-3 font-semibold">Compliance Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((driver) => {
                  const { verification } = driver;
                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{driver.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {driver.email} • {driver.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{driver.vehicle.model}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {driver.vehicle.numberPlate}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              driver.isOnline ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          ></span>
                          <span className="font-medium text-slate-700">{driver.dutyState}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {verification.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Fully Verified
                          </span>
                        ) : verification.rejectedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            {verification.rejectedCount} Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            {verification.pendingCount} Pending Review
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/drivers/${driver.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 text-[11px] transition-colors"
                        >
                          <span>Review Documents</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
