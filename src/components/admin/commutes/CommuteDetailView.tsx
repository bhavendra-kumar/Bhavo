"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface CommuteDetail {
  _id: string;
  title: string;
  rider: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    walletBalanceInPaise?: number;
  };
  pickup: {
    address: string;
    coordinates?: [number, number];
  };
  dropoff: {
    address: string;
    coordinates?: [number, number];
  };
  time: string;
  days: string[];
  vehicleType: string;
  isActive: boolean;
  paymentMethod?: string;
  petFriendly?: boolean;
  lastMaterializedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OccurrenceItem {
  id: string;
  occurrenceKey: string;
  scheduledFor: string;
  status: string;
  ride: {
    id: string;
    status: string;
    fare: number;
    fareInPaise?: number;
    paymentStatus: string;
    driverName?: string | null;
  } | null;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  lastAttemptAt: string | null;
  leaseExpiresAt: string | null;
  createdAt: string;
}

export interface CommuteDetailViewProps {
  id?: string;
}

export function CommuteDetailView({ id: propId }: CommuteDetailViewProps) {
  const routeParams = useParams();
  const id = propId || (routeParams?.id as string);

  const [commute, setCommute] = useState<CommuteDetail | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/commutes/${id}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setCommute(json.data.commute);
        setOccurrences(json.data.occurrences || []);
        setError(null);
      } else {
        throw new Error(json.message || "Failed to load schedule");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleToggleActive = async () => {
    if (!commute) return;
    if (!reason.trim() || reason.trim().length < 5) {
      setActionError("Administrative reason must be at least 5 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch(`/api/admin/commutes/${commute._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !commute.isActive,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Failed to update commute status");
      }

      setShowStatusModal(false);
      setReason("");
      fetchDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute action";
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading commute schedule and occurrence lifecycle...
      </div>
    );
  }

  if (error || !commute) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-lg space-y-3">
        <div className="text-sm font-semibold text-red-200">Error Loading Commute Schedule</div>
        <div className="text-xs text-red-300">{error || "Schedule not found"}</div>
        <Link
          href="/admin/commutes"
          className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
        >
          ← Return to Commutes List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-200">Admin</Link>
        <span>/</span>
        <Link href="/admin/commutes" className="hover:text-slate-200">Daily Commutes</Link>
        <span>/</span>
        <span className="font-mono text-slate-300">{commute._id}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{commute.title}</h1>
            {commute.isActive ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950 text-amber-400 border border-amber-800">
                Paused
              </span>
            )}
            {commute.petFriendly && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                PET-FRIENDLY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recurring schedule ID: <span className="font-mono text-slate-300">{commute._id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowStatusModal(true);
              setReason("");
              setActionError(null);
            }}
            className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
              commute.isActive
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {commute.isActive ? "Pause Schedule" : "Resume Schedule"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rider Profile
          </div>
          <div className="text-sm font-semibold text-white">
            {commute.rider?.name || "Unknown Rider"}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Email: <span className="text-slate-300">{commute.rider?.email}</span></div>
            <div>Phone: <span className="text-slate-300">{commute.rider?.phone || "N/A"}</span></div>
            <div>
              Account Status:{" "}
              <span className="font-mono text-slate-200">{commute.rider?.status || "ACTIVE"}</span>
            </div>
            <div>
              Wallet Balance:{" "}
              <span className="font-mono text-slate-200">
                ₹{((commute.rider?.walletBalanceInPaise || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Schedule Timing & Vehicle
          </div>
          <div className="text-sm font-semibold text-white">
            {commute.time}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>
              Active Days:{" "}
              <span className="text-slate-200 font-mono">
                {commute.days?.join(", ") || "None"}
              </span>
            </div>
            <div>Vehicle: <span className="text-slate-200">{commute.vehicleType}</span></div>
            <div>Payment: <span className="text-slate-200 uppercase font-mono">{commute.paymentMethod || "CASH"}</span></div>
            <div>
              Pet Policy:{" "}
              <span className="text-slate-200">
                {commute.petFriendly ? "Compatible driver mandatory" : "Standard"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Materialization & Lookahead
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            <div>
              Lead Lookahead: <span className="font-mono text-cyan-400">T-180m (Materialization)</span>
            </div>
            <div>
              Dispatch Lead: <span className="font-mono text-blue-400">T-60m (Driver Dispatch)</span>
            </div>
            <div>
              Last Materialized:{" "}
              <span className="font-mono text-slate-300">
                {commute.lastMaterializedAt
                  ? new Date(commute.lastMaterializedAt).toLocaleString()
                  : "Never"}
              </span>
            </div>
            <div>
              Created:{" "}
              <span className="text-slate-300">
                {new Date(commute.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Route & Addresses
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <div>
            <span className="font-mono text-slate-500 mr-2">PICKUP:</span>
            <span>{commute.pickup?.address}</span>
          </div>
          <div>
            <span className="font-mono text-slate-500 mr-2">DROPOFF:</span>
            <span>{commute.dropoff?.address}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Generated Ride Occurrences ({occurrences.length})
          </div>
          <div className="text-[11px] text-slate-400">
            Idempotent occurrences created by auto-booking engine
          </div>
        </div>

        {occurrences.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No occurrences generated yet for this schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Occurrence Key</th>
                  <th className="p-3">Scheduled For (IST)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Materialized Ride</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Last Error / Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {occurrences.map((occ) => (
                  <tr key={occ.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono text-slate-300 text-[11px]">
                      {occ.occurrenceKey}
                    </td>
                    <td className="p-3 font-mono text-slate-200">
                      {new Date(occ.scheduledFor).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <AdminStatusBadge status={occ.status} />
                    </td>
                    <td className="p-3">
                      {occ.ride ? (
                        <div>
                          <Link
                            href={`/admin/rides/${occ.ride.id}`}
                            className="text-blue-400 hover:text-blue-300 font-mono text-xs underline"
                          >
                            Ride #{occ.ride.id.slice(-8)}
                          </Link>
                          <div className="text-[10px] text-slate-400">
                            Status: {occ.ride.status} | Fare: ₹{(occ.ride.fareInPaise ? occ.ride.fareInPaise / 100 : occ.ride.fare).toFixed(2)}
                          </div>
                          {occ.ride.driverName && (
                            <div className="text-[10px] text-slate-400">
                              Driver: {occ.ride.driverName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Not Materialized</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {occ.attemptCount} / {occ.maxAttempts}
                      {occ.lastAttemptAt && (
                        <div className="text-[10px] text-slate-500">
                          {new Date(occ.lastAttemptAt).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-62.5">
                      {occ.lastError ? (
                        <div className="text-red-400 text-[11px] truncate" title={occ.lastError}>
                          {occ.lastError}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              {commute.isActive ? "Pause Commute Schedule" : "Resume Commute Schedule"}
            </h2>
            <p className="text-xs text-slate-300">
              Please enter an administrative reason for changing schedule status. This action is permanently recorded in the audit log.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for pausing/resuming this schedule..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {actionError && (
              <div className="p-2.5 bg-red-950/50 border border-red-800 rounded text-xs text-red-300">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleActive}
                disabled={submitting}
                className={`px-4 py-1.5 rounded text-xs text-white font-medium disabled:opacity-50 ${
                  commute.isActive
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {submitting ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommuteDetailView;
