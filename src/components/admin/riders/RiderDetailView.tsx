"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface RiderDetailData {
  rider: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    rating: number;
    walletBalanceInRupees: number;
    emergencyContacts: Array<{ name: string; phone: string; relation: string }>;
    pets: Array<{ name: string; breed: string; weight: string }>;
    createdAt: string;
    updatedAt: string;
  };
  recentRides: Array<{
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
    fareInRupees: number;
    vehicleType: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    petFriendly: boolean;
    createdAt: string;
  }>;
  commutes: Array<{
    id: string;
    title: string;
    pickupAddress: string;
    dropoffAddress: string;
    time: string;
    days: string[];
    vehicleType: string;
    isActive: boolean;
    petFriendly: boolean;
    lastMaterializedAt: string | null;
  }>;
  tickets: Array<{
    id: string;
    ticketId: string;
    category: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export interface RiderDetailViewProps {
  id?: string;
}

export function RiderDetailView({ id: propId }: RiderDetailViewProps) {
  const routeParams = useParams();
  const riderId = propId || (routeParams?.id as string);

  const [data, setData] = useState<RiderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadRider = useCallback(() => {
    if (!riderId) return;
    fetch(`/api/admin/riders/${riderId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setData(json.data);
          setError(null);
        } else {
          setError(json.message || "Failed to load rider profile");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error loading rider profile");
        setLoading(false);
      });
  }, [riderId]);

  useEffect(() => {
    loadRider();
  }, [loadRider]);

  const handleStatusChange = async (newStatus: "ACTIVE" | "SUSPENDED") => {
    if (!statusReason.trim() || statusReason.trim().length < 5) {
      setError("An administrative reason of at least 5 characters is required.");
      return;
    }

    setSubmittingAction(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/riders/${riderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setActionSuccess(`Rider status successfully updated to ${newStatus}.`);
        setStatusModalOpen(false);
        setStatusReason("");
        loadRider();
      } else {
        setError(json.message || "Failed to update rider status");
      }
    } catch {
      setError("Network error while updating rider status");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading rider profile and booking history...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-lg space-y-3">
        <div className="text-sm font-semibold text-red-200">Error Loading Rider</div>
        <div className="text-xs text-red-300">{error}</div>
        <Link
          href="/admin/riders"
          className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
        >
          ← Return to Riders Directory
        </Link>
      </div>
    );
  }

  const { rider, recentRides, commutes, tickets } = data!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-200">Admin</Link>
        <span>/</span>
        <Link href="/admin/riders" className="hover:text-slate-200">Riders</Link>
        <span>/</span>
        <span className="font-mono text-slate-300">{rider.id}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{rider.name}</h1>
            <AdminStatusBadge status={rider.status} />
            {rider.pets.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                🐾 {rider.pets.length} Pet(s) Registered
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Account ID: <span className="font-mono text-slate-300">{rider.id}</span> • Member since{" "}
            {new Date(rider.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {rider.status === "ACTIVE" ? (
            <button
              onClick={() => {
                setStatusReason("");
                setStatusModalOpen(true);
              }}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-medium"
            >
              Suspend Account
            </button>
          ) : (
            <button
              onClick={() => {
                setStatusReason("");
                setStatusModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-medium"
            >
              Reactivate Account
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Contact & Identity
          </div>
          <div className="text-sm font-semibold text-white">{rider.name}</div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Phone: <span className="text-slate-200">{rider.phone}</span></div>
            <div>Email: <span className="text-slate-200">{rider.email}</span></div>
            <div>Rating: <span className="text-amber-400 font-mono">★ {rider.rating}</span></div>
            <div>Wallet Balance: <span className="text-white font-mono font-semibold">₹{rider.walletBalanceInRupees.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pet Preferences
          </div>
          {rider.pets.length > 0 ? (
            <div className="space-y-2">
              {rider.pets.map((p, idx) => (
                <div key={idx} className="p-2 bg-slate-950/60 border border-slate-800/80 rounded text-xs">
                  <div className="font-semibold text-cyan-300">🐾 {p.name}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Breed: {p.breed} | Weight: {p.weight}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-2">No pet preferences registered.</div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Emergency Contacts
          </div>
          {rider.emergencyContacts.length > 0 ? (
            <div className="space-y-2 text-xs">
              {rider.emergencyContacts.map((c, idx) => (
                <div key={idx} className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="font-medium text-slate-200">{c.name} ({c.relation})</div>
                  <div className="text-slate-400 font-mono text-[11px]">{c.phone}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-2">None configured.</div>
          )}
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Recurring Commute Schedules ({commutes.length})
          </div>
          <Link href="/admin/commutes" className="text-xs text-blue-400 hover:text-blue-300">
            View All Schedules →
          </Link>
        </div>
        {commutes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No recurring commute schedules created.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Pickup → Dropoff</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {commutes.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-medium text-white">{c.title}</td>
                    <td className="p-3 max-w-50 truncate text-slate-300">{c.pickupAddress} → {c.dropoffAddress}</td>
                    <td className="p-3 font-mono">{c.time} ({c.days.join(", ")})</td>
                    <td className="p-3">
                      {c.vehicleType}
                      {c.petFriendly && <span className="ml-1 text-[10px] text-cyan-400 font-mono">(PET)</span>}
                    </td>
                    <td className="p-3">
                      {c.isActive ? (
                        <span className="text-emerald-400 font-medium">Active</span>
                      ) : (
                        <span className="text-amber-400 font-medium">Paused</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/commutes/${c.id}`} className="text-blue-400 hover:text-blue-300 underline">
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Recent Trips ({recentRides.length})
          </div>
          <Link href="/admin/rides" className="text-xs text-blue-400 hover:text-blue-300">
            View All Trips →
          </Link>
        </div>
        {recentRides.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No recorded trips found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Ride ID & Date</th>
                  <th className="p-3">Pickup → Dropoff</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Fare (₹)</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRides.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-mono text-white">#{r.id.slice(-8)}</td>
                    <td className="p-3 max-w-50 truncate text-slate-300">{r.pickupAddress} → {r.dropoffAddress}</td>
                    <td className="p-3"><AdminStatusBadge status={r.status} /></td>
                    <td className="p-3 font-mono text-white">₹{r.fareInRupees.toFixed(2)}</td>
                    <td className="p-3 uppercase text-[10px] font-mono text-slate-400">{r.paymentMethod} • {r.paymentStatus}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/rides/${r.id}`} className="text-blue-400 hover:text-blue-300 underline">
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tickets.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-200">
            Support Tickets ({tickets.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-mono text-white">{t.ticketId}</td>
                    <td className="p-3 uppercase text-[10px] font-mono text-slate-400">{t.category}</td>
                    <td className="p-3 text-slate-200">{t.subject}</td>
                    <td className="p-3 font-mono">{t.priority}</td>
                    <td className="p-3"><AdminStatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              {rider.status === "ACTIVE" ? "Suspend Rider Account" : "Reactivate Rider Account"}
            </h2>
            <p className="text-xs text-slate-300">
              {rider.status === "ACTIVE"
                ? "Suspending this rider account invalidates their active authentication session tokens and blocks booking. A reason is required for audit logging."
                : "Reactivating this rider account restores their booking privileges."}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Administrative Reason</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="State the reason for this account action..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || statusReason.trim().length < 5}
                onClick={() => handleStatusChange(rider.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                className={`px-4 py-1.5 rounded text-xs text-white font-medium disabled:opacity-50 ${
                  rider.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {submittingAction
                  ? "Processing..."
                  : rider.status === "ACTIVE"
                  ? "Confirm Suspension"
                  : "Confirm Reactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiderDetailView;
