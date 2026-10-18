"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdminRealtime } from "@/components/admin/useAdminRealtime";
import { AdminRealtimeBadge } from "@/components/admin/AdminRealtimeBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface LiveRide {
  id: string;
  bookingType: "COMMUTE_OCCURRENCE" | "ON_DEMAND";
  autoBookingOccurrenceKey: string | null;
  commuteId: string | null;
  rider: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  driver: {
    id: string | null;
    name: string;
    phone: string;
    vehicleNumber: string;
    vehicleModel: string;
  } | null;
  pickup: {
    address: string;
    landmark?: string | null;
    coordinates?: [number, number] | null;
  };
  dropoff: {
    address: string;
    landmark?: string | null;
    coordinates?: [number, number] | null;
  };
  vehicleType: string;
  fareInPaise: number;
  fareInRupees: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  petFriendly: boolean;
  dispatch: {
    status: string;
    attempts: number;
    currentOfferExpiresAt: string | null;
  };
  telemetry: {
    coordinates: [number, number] | null;
    coordinatesUpdatedAt: string | null;
    freshness: "FRESH" | "STALE" | "UNAVAILABLE";
  };
  timeline: {
    createdAt: string;
    acceptedAt: string | null;
    arrivedAt: string | null;
    startedAt: string | null;
    scheduledFor: string | null;
  };
}

export interface LiveOperationsMetrics {
  totalActive: number;
  searchingCount: number;
  acceptedCount: number;
  arrivedCount: number;
  inProgressCount: number;
  petFriendlyActiveCount: number;
  onlineDriversCount: number;
}

export function LiveOperationsView() {
  const [rides, setRides] = useState<LiveRide[]>([]);
  const [metrics, setMetrics] = useState<LiveOperationsMetrics>({
    totalActive: 0,
    searchingCount: 0,
    acceptedCount: 0,
    arrivedCount: 0,
    inProgressCount: 0,
    petFriendlyActiveCount: 0,
    onlineDriversCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [petFilter, setPetFilter] = useState("ALL");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedRide, setSelectedRide] = useState<LiveRide | null>(null);

  const fetchLiveOps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (petFilter !== "ALL") params.set("petFriendly", petFilter);
      if (vehicleFilter !== "ALL") params.set("vehicleType", vehicleFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/live-operations?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const json = await res.json();
      if (json.status === "success") {
        setRides(json.data.rides || []);
        setMetrics(json.data.metrics || {});
        setTotalPages(json.data.pagination?.pages || 1);
        setTotalCount(json.data.pagination?.total || 0);
        setError(null);
      } else {
        throw new Error(json.message || "Failed to load live operations");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, petFilter, vehicleFilter, search]);

  useEffect(() => {
    fetchLiveOps();
  }, [fetchLiveOps]);

  const { status: connStatus, lastUpdated, refresh } = useAdminRealtime({
    streamUrl: "/api/admin/stream",
    onUpdate: () => {
      fetchLiveOps();
    },
    pollingIntervalMs: 12000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Live Operations</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
              REAL-TIME DISPATCH & FLEET
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time active ride tracking, telemetry freshness, and dispatch health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRealtimeBadge
            status={connStatus}
            lastUpdated={lastUpdated}
            onManualRefresh={() => {
              refresh();
              fetchLiveOps();
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            In-Progress Trips
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {metrics.inProgressCount}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Active passenger on board</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Searching / Dispatch
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {metrics.searchingCount}
          </div>
          <div className="text-[10px] text-amber-500 mt-0.5">Awaiting driver offer/match</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Accepted & Arrived
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {metrics.acceptedCount + metrics.arrivedCount}
          </div>
          <div className="text-[10px] text-blue-400/80 mt-0.5">Driver en route to pickup</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Pet Rides Active
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {metrics.petFriendlyActiveCount}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Pet-compatible fleet assigned</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Online Drivers
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">
            {metrics.onlineDriversCount}
          </div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Duty active in platform</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search ride ID, address, rider name/phone..."
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
              <option value="ALL">All Active Statuses</option>
              <option value="SEARCHING">Searching</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="ARRIVED">Arrived</option>
              <option value="IN_PROGRESS">In Progress</option>
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

            <select
              value={vehicleFilter}
              onChange={(e) => {
                setVehicleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="Cab Economy">Cab Economy</option>
              <option value="Cab Premium">Cab Premium</option>
              <option value="Cab XL">Cab XL</option>
              <option value="Auto">Auto</option>
              <option value="Bike">Bike</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>Failed to load live operations: {error}</span>
          <button
            onClick={() => fetchLiveOps()}
            className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Active Rides Queue ({totalCount})
          </div>
          <div className="text-[11px] text-slate-500">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading active ride queue...</div>
        ) : rides.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No live rides match your active filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Ride ID & Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Assigned Driver & Telemetry</th>
                  <th className="p-3">Pickup → Dropoff</th>
                  <th className="p-3">Vehicle & Pet</th>
                  <th className="p-3">Fare (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-white font-medium">
                        {ride.id.slice(-8)}
                      </div>
                      <div className="mt-1">
                        {ride.bookingType === "COMMUTE_OCCURRENCE" ? (
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-950/60 text-purple-400 border border-purple-800/50">
                            COMMUTE
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                            ON-DEMAND
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <AdminStatusBadge status={ride.status} />
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {ride.dispatch.status}
                        {ride.dispatch.attempts > 0 ? ` (Tries: ${ride.dispatch.attempts})` : ""}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">
                        {ride.rider ? ride.rider.name : "Unknown"}
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
                            {ride.driver.vehicleNumber}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {ride.telemetry.freshness === "FRESH" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 px-1 rounded border border-emerald-800/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                GPS Live
                              </span>
                            )}
                            {ride.telemetry.freshness === "STALE" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/50 px-1 rounded border border-amber-800/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                GPS Stale
                              </span>
                            )}
                            {ride.telemetry.freshness === "UNAVAILABLE" && (
                              <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1 rounded">
                                GPS Off
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">Unassigned</div>
                      )}
                    </td>
                    <td className="p-3 max-w-50">
                      <div className="truncate text-slate-300 font-medium" title={ride.pickup.address}>
                        {ride.pickup.address}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={ride.dropoff.address}>
                        → {ride.dropoff.address}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{ride.vehicleType}</div>
                      {ride.petFriendly && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                          PET-FRIENDLY
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-medium text-white">
                      ₹{ride.fareInRupees.toFixed(2)}
                      <div className="text-[10px] text-slate-400 uppercase font-sans">
                        {ride.paymentMethod}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedRide(ride)}
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

      {selectedRide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Ride Details: #{selectedRide.id}</span>
                  <AdminStatusBadge status={selectedRide.status} />
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Type: {selectedRide.bookingType} | Created:{" "}
                  {new Date(selectedRide.timeline.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedRide(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">
                  Rider Information
                </div>
                <div className="text-white font-medium">
                  {selectedRide.rider ? selectedRide.rider.name : "N/A"}
                </div>
                <div className="text-slate-400">
                  Phone: {selectedRide.rider ? selectedRide.rider.phone : "N/A"}
                </div>
                <div className="text-slate-400">
                  Email: {selectedRide.rider ? selectedRide.rider.email : "N/A"}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">
                  Driver Assignment
                </div>
                {selectedRide.driver ? (
                  <>
                    <div className="text-white font-medium">{selectedRide.driver.name}</div>
                    <div className="text-slate-400">Phone: {selectedRide.driver.phone}</div>
                    <div className="text-slate-400">
                      Vehicle: {selectedRide.driver.vehicleModel} ({selectedRide.driver.vehicleNumber})
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 italic">No driver assigned currently</div>
                )}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Location & Routing
              </div>
              <div>
                <span className="text-slate-500 font-mono mr-2">PICKUP:</span>
                <span className="text-slate-200">{selectedRide.pickup.address}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono mr-2">DROPOFF:</span>
                <span className="text-slate-200">{selectedRide.dropoff.address}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Dispatch & Telemetry
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Dispatch Status: <span className="font-mono text-white">{selectedRide.dispatch.status}</span></div>
                <div>Attempts: <span className="font-mono text-white">{selectedRide.dispatch.attempts}</span></div>
                <div>GPS Telemetry: <span className="font-mono text-white">{selectedRide.telemetry.freshness}</span></div>
                <div>Pet Requirement: <span className="font-mono text-white">{selectedRide.petFriendly ? "Yes (Mandatory)" : "Standard"}</span></div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Financial Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Total Fare: <span className="font-mono text-white font-bold">₹{selectedRide.fareInRupees.toFixed(2)}</span></div>
                <div>Amount in Paise: <span className="font-mono text-slate-400">{selectedRide.fareInPaise} paise</span></div>
                <div>Payment Method: <span className="font-mono text-white">{selectedRide.paymentMethod}</span></div>
                <div>Payment Status: <span className="font-mono text-white">{selectedRide.paymentStatus}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Link
                href={`/admin/rides/${selectedRide.id}`}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Open Full Historical Inspection →
              </Link>
              <button
                onClick={() => setSelectedRide(null)}
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

export default LiveOperationsView;
