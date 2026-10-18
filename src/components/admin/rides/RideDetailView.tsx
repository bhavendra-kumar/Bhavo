"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface RideDetailData {
  ride: {
    id: string;
    rider: {
      id: string;
      name: string;
      email: string;
      phone: string;
      rating?: number;
      status?: string;
    } | null;
    driver: {
      id: string;
      name: string;
      email: string;
      phone: string;
      rating?: number;
      status?: string;
      isOnline?: boolean;
      dutyState?: string;
      vehicleNumber?: string;
      vehicleModel?: string;
    } | null;
    pickup: { address: string; landmark?: string };
    dropoff: { address: string; landmark?: string };
    vehicleType: string;
    distance: string;
    duration: string;
    fare: number;
    fareInPaise?: number;
    fareInRupees: number;
    pricingSnapshot: {
      baseFarePaise?: number;
      distanceKm?: number;
      distanceFarePaise?: number;
      petFriendlySurchargePaise?: number;
      totalFarePaise?: number;
      currency?: string;
      rateRuleVersion?: string;
      calculatedAt?: string;
    } | null;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    cashCollectedAt?: string | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    paymentConfirmedAt?: string | null;
    petFriendly: boolean;
    bookingType: "COMMUTE" | "ON_DEMAND";
    commuteId?: string | null;
    autoBookingOccurrenceKey?: string | null;
    scheduledFor?: string | null;
    cancellation?: {
      reason: string | null;
      by: string | null;
      cancelledAt: string | null;
    };
    dispatch: {
      status: string;
      attempts: number;
    };
    timeline: {
      createdAt: string;
      acceptedAt: string | null;
      arrivedAt: string | null;
      startedAt: string | null;
      completedAt: string | null;
      cancelledAt: string | null;
    };
    updatedAt: string;
  };
  relatedTickets: Array<{
    _id: string;
    ticketId: string;
    category: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  relatedAuditLogs: Array<{
    _id: string;
    action: string;
    actorEmail: string;
    reason: string;
    createdAt: string;
  }>;
}

export interface RideDetailViewProps {
  id?: string;
}

export function RideDetailView({ id: propId }: RideDetailViewProps) {
  const routeParams = useParams();
  const rideId = propId || (routeParams?.id as string);

  const [data, setData] = useState<RideDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) return;
    let ignore = false;
    fetch(`/api/admin/rides/${rideId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.status === "success") {
            setData(json.data);
          } else {
            setError(json.message || "Failed to load ride details");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Network error while inspecting ride");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [rideId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading ride record #{rideId}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-lg space-y-3">
        <div className="text-sm font-semibold text-red-200">Error Loading Ride Record</div>
        <div className="text-xs text-red-300">{error || "Ride record not found"}</div>
        <Link
          href="/admin/rides"
          className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
        >
          ← Return to All Rides
        </Link>
      </div>
    );
  }

  const { ride, relatedTickets, relatedAuditLogs } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-200">Admin</Link>
        <span>/</span>
        <Link href="/admin/rides" className="hover:text-slate-200">All Rides</Link>
        <span>/</span>
        <span className="font-mono text-slate-300">{ride.id}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono">Ride #{ride.id.slice(-8)}</h1>
            <AdminStatusBadge status={ride.status} />
            {ride.bookingType === "COMMUTE" && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-purple-950 text-purple-400 border border-purple-800">
                COMMUTE OCCURRENCE
              </span>
            )}
            {ride.petFriendly && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                PET-FRIENDLY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Created on {new Date(ride.timeline.createdAt).toLocaleString("en-IN")} • Read-only operational inspection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ride.commuteId && (
            <Link
              href={`/admin/commutes/${ride.commuteId}`}
              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-300 rounded text-xs font-medium"
            >
              Inspect Parent Commute Schedule →
            </Link>
          )}
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Lifecycle Timeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-slate-500 uppercase">1. Created</div>
            <div className="text-slate-200 mt-1 font-mono text-[11px]">
              {new Date(ride.timeline.createdAt).toLocaleTimeString()}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-slate-500 uppercase">2. Accepted</div>
            <div className="text-slate-200 mt-1 font-mono text-[11px]">
              {ride.timeline.acceptedAt ? new Date(ride.timeline.acceptedAt).toLocaleTimeString() : "—"}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-slate-500 uppercase">3. Arrived</div>
            <div className="text-slate-200 mt-1 font-mono text-[11px]">
              {ride.timeline.arrivedAt ? new Date(ride.timeline.arrivedAt).toLocaleTimeString() : "—"}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-slate-500 uppercase">4. Started</div>
            <div className="text-slate-200 mt-1 font-mono text-[11px]">
              {ride.timeline.startedAt ? new Date(ride.timeline.startedAt).toLocaleTimeString() : "—"}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-slate-500 uppercase">5. Completed</div>
            <div className="text-slate-200 mt-1 font-mono text-[11px]">
              {ride.timeline.completedAt ? new Date(ride.timeline.completedAt).toLocaleTimeString() : "—"}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-slate-500 uppercase">Status Final</div>
            <div className="mt-1">
              <AdminStatusBadge status={ride.status} />
            </div>
          </div>
        </div>

        {ride.status === "CANCELLED" && ride.cancellation && (
          <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-xs space-y-1">
            <div className="text-red-300 font-semibold">Cancellation Details</div>
            <div className="text-slate-300">
              Cancelled by: <span className="font-mono text-white">{ride.cancellation.by || "Unknown"}</span> at{" "}
              {ride.cancellation.cancelledAt ? new Date(ride.cancellation.cancelledAt).toLocaleString() : "N/A"}
            </div>
            <div className="text-slate-400">
              Reason: <span className="text-white">{ride.cancellation.reason || "No explicit reason stated"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rider Information
          </div>
          <div className="text-sm font-semibold text-white">
            {ride.rider?.name || "Unknown"}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Phone: <span className="text-slate-200">{ride.rider?.phone || "N/A"}</span></div>
            <div>Email: <span className="text-slate-200">{ride.rider?.email || "N/A"}</span></div>
            <div>Rating: <span className="text-amber-400 font-mono">★ {ride.rider?.rating || 5.0}</span></div>
            <div>Status: <span className="font-mono text-slate-200">{ride.rider?.status || "ACTIVE"}</span></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Driver & Vehicle
          </div>
          {ride.driver ? (
            <>
              <div className="text-sm font-semibold text-white">{ride.driver.name}</div>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Phone: <span className="text-slate-200">{ride.driver.phone}</span></div>
                <div>Vehicle: <span className="text-slate-200">{ride.driver.vehicleModel} ({ride.driver.vehicleNumber})</span></div>
                <div>Rating: <span className="text-amber-400 font-mono">★ {ride.driver.rating || 5.0}</span></div>
                <div>Duty: <span className="font-mono text-slate-200">{ride.driver.dutyState || "OFFLINE"}</span></div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 italic py-4">No driver assigned to this ride.</div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Financial & Payment State
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ₹{ride.fareInRupees.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Paise Amount: <span className="font-mono text-slate-200">{ride.fareInPaise} paise</span></div>
            <div>Method: <span className="font-mono text-slate-200 uppercase">{ride.paymentMethod}</span></div>
            <div>Payment Status: <AdminStatusBadge status={ride.paymentStatus} /></div>
            {ride.cashCollectedAt && (
              <div className="text-emerald-400 text-[11px]">
                Physical cash collected at {new Date(ride.cashCollectedAt).toLocaleTimeString()}
              </div>
            )}
            {ride.razorpayPaymentId && (
              <div className="text-[11px] font-mono text-slate-400">
                Razorpay ID: {ride.razorpayPaymentId}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Route & Distance
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <div>
            <span className="font-mono text-slate-500 mr-2">PICKUP:</span>
            <span>{ride.pickup.address}</span>
            {ride.pickup.landmark && <span className="text-slate-500 ml-1">({ride.pickup.landmark})</span>}
          </div>
          <div>
            <span className="font-mono text-slate-500 mr-2">DROPOFF:</span>
            <span>{ride.dropoff.address}</span>
            {ride.dropoff.landmark && <span className="text-slate-500 ml-1">({ride.dropoff.landmark})</span>}
          </div>
          <div className="pt-2 border-t border-slate-800 flex gap-6 text-slate-400">
            <div>Distance: <span className="text-white font-mono">{ride.distance}</span></div>
            <div>Duration: <span className="text-white font-mono">{ride.duration}</span></div>
            <div>Vehicle Category: <span className="text-white font-mono">{ride.vehicleType}</span></div>
          </div>
        </div>
      </div>

      {relatedTickets.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-200">
            Related Support Tickets ({relatedTickets.length})
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
                {relatedTickets.map((t) => (
                  <tr key={t._id}>
                    <td className="p-3 font-mono text-white">{t.ticketId}</td>
                    <td className="p-3 uppercase text-[11px] font-mono text-slate-400">{t.category}</td>
                    <td className="p-3 text-slate-200">{t.subject}</td>
                    <td className="p-3 font-mono text-xs">{t.priority}</td>
                    <td className="p-3"><AdminStatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {relatedAuditLogs.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-200">
            Administrative Audit Trail ({relatedAuditLogs.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {relatedAuditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="p-3 font-mono text-white text-[11px]">{log.action}</td>
                    <td className="p-3 text-slate-300">{log.actorEmail}</td>
                    <td className="p-3 text-slate-300">{log.reason}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default RideDetailView;
