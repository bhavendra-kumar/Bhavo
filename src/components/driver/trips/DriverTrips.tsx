"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Car, ShieldCheck, Clock, Loader2, ChevronLeft, ChevronRight, Search, X, CheckCircle2 } from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface IDriverTripRecord {
  id?: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  tip?: number;
  distance: string;
  duration?: string;
  time: string;
  date?: string;
  vehicleType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
}

export default function DriverTrips() {
  const { confirm, alert } = useDialog();
  const { confirmCashCollection } = useDriverStore();
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [trips, setTrips] = useState<IDriverTripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 5;

  const handleCollectCash = async (tripId: string, fare: number) => {
    const ok = await confirm({
      title: `Confirm Cash Collection of ₹${fare}?`,
      message: `Confirm that you received ₹${fare} in physical cash from the rider for this completed trip.`,
      confirmText: `Confirm ₹${fare} Collected`,
      cancelText: "Cancel",
      variant: "success",
    });
    if (ok) {
      setCollectingId(tripId);
      try {
        const success = await confirmCashCollection(tripId);
        if (success) {
          setTrips((prev) =>
            prev.map((t) => (t.id === tripId ? { ...t, paymentStatus: "COLLECTED" } : t))
          );
          alert({
            title: "Cash Collection Confirmed",
            message: `Recorded collection of ₹${fare} in platform ledger.`,
            confirmText: "Done",
            variant: "success",
          });
        } else {
          alert({
            title: "Collection Failed",
            message: "Unable to confirm cash collection. Please try again.",
            confirmText: "OK",
            variant: "danger",
          });
        }
      } finally {
        setCollectingId(null);
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const searchParam = debouncedSearch.trim() ? `&search=${encodeURIComponent(debouncedSearch.trim())}` : "";
        const res = await fetch(`/api/driver/trips?filter=${filter}&page=${page}&limit=${limit}${searchParam}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore) {
            if (json.data) {
              setTrips(json.data);
            }
            if (json.pagination) {
              setTotalPages(json.pagination.totalPages || 1);
              setTotalCount(json.pagination.total || 0);
            } else if (json.totalCount !== undefined) {
              setTotalCount(json.totalCount);
              setTotalPages(Math.max(1, Math.ceil(json.totalCount / limit)));
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchTrips();
    return () => {
      ignore = true;
    };
  }, [filter, page, limit, debouncedSearch]);

  const handleFilterChange = (tab: string) => {
    setFilter(tab);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", page, "...", totalPages];
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by rider, location, or vehicle..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "TODAY", "THIS WEEK", "COMPLETED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === tab
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin text-teal-600" />
            <span className="text-xs font-bold">Loading trip records...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">
              {debouncedSearch
                ? `No trips found matching "${debouncedSearch}"`
                : "No trips found for this filter period."}
            </p>
            <span className="text-xs text-slate-400 mt-0.5 block">
              {debouncedSearch
                ? "Try searching with a different rider name or location."
                : "Completed rides will appear here automatically."}
            </span>
            {(debouncedSearch || filter !== "ALL") && (
              <button
                onClick={() => {
                  handleClearSearch();
                  setFilter("ALL");
                }}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {trips.map((trip: IDriverTripRecord, idx: number) => (
                <div
                  key={trip.id || idx}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Car size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-[15px] text-slate-900">{trip.riderName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {trip.vehicleType || "Cab"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <span className="font-semibold text-slate-800">{trip.pickup}</span>
                        <ArrowRight size={12} className="text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{trip.dropoff}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{trip.distance}</span>
                        <span>•</span>
                        <span>{trip.time}</span>
                        {trip.date && (
                          <>
                            <span>•</span>
                            <span>{trip.date}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <ShieldCheck size={11} /> {trip.status || "Completed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-slate-900">₹{trip.fare}</span>
                      {Boolean(trip.tip && trip.tip > 0) && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +₹{trip.tip} tip
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {trip.paymentMethod || "CASH"}
                      </span>
                      {trip.paymentStatus === "COLLECTED" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Collected
                        </span>
                      )}
                      {trip.paymentStatus === "PENDING_COLLECTION" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Cash
                        </span>
                      )}
                    </div>
                    {trip.paymentStatus === "PENDING_COLLECTION" && trip.id && (
                      <button
                        onClick={() => handleCollectCash(trip.id!, trip.fare)}
                        disabled={collectingId === trip.id}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Confirm physical cash collected from passenger"
                      >
                        {collectingId === trip.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={11} />
                        )}
                        <span>Collect Cash</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalCount > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{Math.min((page - 1) * limit + 1, totalCount)}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(page * limit, totalCount)}</span> of{" "}
                  <span className="font-bold text-slate-800">{totalCount}</span> trips
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-teal-700 hover:bg-slate-50 hover:border-teal-200 font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shadow-2xs"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((p, i) =>
                        typeof p === "number" ? (
                          <button
                            key={i}
                            onClick={() => setPage(p)}
                            disabled={loading}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              page === p
                                ? "bg-teal-700 text-white shadow-xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-teal-700 hover:border-teal-200"
                            }`}
                          >
                            {p}
                          </button>
                        ) : (
                          <span key={i} className="px-1 text-slate-400 font-bold">
                            ...
                          </span>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || loading}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-teal-700 hover:bg-slate-50 hover:border-teal-200 font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shadow-2xs"
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
