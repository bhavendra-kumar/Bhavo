"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export interface DriverDoc {
  name: string;
  category: "DRIVER" | "VEHICLE";
  description?: string;
  status: "VERIFIED" | "PENDING" | "REJECTED" | "EXEMPT";
  expiry: string;
  docId: string;
  fileUrl?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string;
}

export interface DriverDetailData {
  driver: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    isOnline: boolean;
    dutyState: string;
    rating: number;
    vehicle: {
      model?: string;
      numberPlate?: string;
      type?: string;
      fuelType?: string;
      batteryOrFuelLevel?: number;
      documentsVerified?: boolean;
      insuranceValidUntil?: string;
    };
    documents: DriverDoc[];
    verification: {
      isVerified: boolean;
      totalDocs: number;
      verifiedCount: number;
      pendingDocs: DriverDoc[];
      rejectedDocs: DriverDoc[];
      reason?: string;
    };
    createdAt: string;
  };
  activeRide: {
    id: string;
    status: string;
    pickup?: string;
    dropoff?: string;
    fare: number;
    createdAt: string;
  } | null;
  recentRides?: Array<{
    id: string;
    status: string;
    pickup?: string;
    dropoff?: string;
    fare: number;
    createdAt: string;
  }>;
}

export interface DriverDetailViewProps {
  id?: string;
}

export function DriverDetailView({ id: propId }: DriverDetailViewProps) {
  const routeParams = useParams();
  const driverId = propId || (routeParams?.id as string);

  const [data, setData] = useState<DriverDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDocName, setSelectedDocName] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingDocAction, setSubmittingDocAction] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [submittingStatusAction, setSubmittingStatusAction] = useState(false);

  const loadDriver = useCallback(() => {
    if (!driverId) return;
    fetch(`/api/admin/drivers/${driverId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setData(json.data);
          setError(null);
        } else {
          setError(json.message || "Failed to load driver details");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error loading driver details");
        setLoading(false);
      });
  }, [driverId]);

  useEffect(() => {
    loadDriver();
  }, [loadDriver]);

  const handleApproveDoc = async (docName: string) => {
    setSubmittingDocAction(true);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docName,
          action: "APPROVE",
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setActionSuccess(`Document '${docName}' was approved successfully.`);
        loadDriver();
      } else {
        setError(json.message || "Failed to approve document");
      }
    } catch {
      setError("Error communicating with document review service");
    } finally {
      setSubmittingDocAction(false);
    }
  };

  const handleOpenRejectModal = (docName: string) => {
    setSelectedDocName(docName);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocName || rejectReason.trim().length < 3) return;

    setSubmittingDocAction(true);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docName: selectedDocName,
          action: "REJECT",
          reason: rejectReason.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setActionSuccess(`Document '${selectedDocName}' was rejected.`);
        setRejectModalOpen(false);
        loadDriver();
      } else {
        setError(json.message || "Failed to reject document");
      }
    } catch {
      setError("Error communicating with document review service");
    } finally {
      setSubmittingDocAction(false);
    }
  };

  const handleConfirmStatusChange = async (newStatus: "ACTIVE" | "SUSPENDED") => {
    if (!statusReason.trim() || statusReason.trim().length < 5) {
      setError("A substantive reason (minimum 5 characters) is required.");
      return;
    }

    setSubmittingStatusAction(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${driverId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setActionSuccess(`Driver account status set to ${newStatus}.`);
        setStatusModalOpen(false);
        setStatusReason("");
        loadDriver();
      } else {
        setError(json.message || "Failed to alter account status");
      }
    } catch {
      setError("Failed to communicate with account status service");
    } finally {
      setSubmittingStatusAction(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading driver compliance and document verification record...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-lg space-y-3">
        <div className="text-sm font-semibold text-red-200">Error Loading Driver</div>
        <div className="text-xs text-red-300">{error}</div>
        <Link
          href="/admin/drivers"
          className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
        >
          ← Return to Driver Directory
        </Link>
      </div>
    );
  }

  const { driver, activeRide } = data!;
  const { verification } = driver;
  const isDriverEligible =
    driver.status === "ACTIVE" &&
    driver.isOnline &&
    driver.dutyState !== "ON_TRIP" &&
    verification.isVerified;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-200">Admin</Link>
        <span>/</span>
        <Link href="/admin/drivers" className="hover:text-slate-200">Drivers & Verification</Link>
        <span>/</span>
        <span className="font-mono text-slate-300">{driver.id}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{driver.name}</h1>
            <AdminStatusBadge status={driver.status} />
            {verification.isVerified ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                8/8 Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950 text-amber-400 border border-amber-800">
                {verification.pendingDocs.length} Docs Pending
              </span>
            )}
            {isDriverEligible && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                DISPATCH ELIGIBLE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registered driver profile: <span className="font-mono text-slate-300">{driver.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {driver.status === "ACTIVE" ? (
            <button
              onClick={() => {
                setStatusReason("");
                setStatusModalOpen(true);
              }}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-medium"
            >
              Suspend Driver Account
            </button>
          ) : (
            <button
              onClick={() => {
                setStatusReason("");
                setStatusModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-medium"
            >
              Reactivate Driver Account
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
            Driver Profile
          </div>
          <div className="text-sm font-semibold text-white">{driver.name}</div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Phone: <span className="text-slate-200">{driver.phone}</span></div>
            <div>Email: <span className="text-slate-200">{driver.email}</span></div>
            <div>Rating: <span className="text-amber-400 font-mono">★ {driver.rating}</span></div>
            <div>Created: <span className="text-slate-300">{new Date(driver.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Vehicle & Compliance
          </div>
          <div className="text-sm font-semibold text-white">{driver.vehicle.model || "N/A"}</div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Plate: <span className="text-slate-200 font-mono">{driver.vehicle.numberPlate || "N/A"}</span></div>
            <div>Type: <span className="text-slate-200">{driver.vehicle.type || "Cab Economy"}</span></div>
            <div>Fuel: <span className="text-slate-200 font-mono">{driver.vehicle.fuelType || "EV"}</span></div>
            <div>
              Vehicle Verification:{" "}
              <span className={driver.vehicle.documentsVerified !== false ? "text-emerald-400" : "text-red-400"}>
                {driver.vehicle.documentsVerified !== false ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Operational Duty State
          </div>
          <div className="text-xs text-slate-400 space-y-1.5">
            <div>
              Online Status:{" "}
              {driver.isOnline ? (
                <span className="text-emerald-400 font-mono font-semibold">ONLINE</span>
              ) : (
                <span className="text-slate-500 font-mono">OFFLINE</span>
              )}
            </div>
            <div>Duty State: <span className="font-mono text-slate-200">{driver.dutyState}</span></div>
            {activeRide ? (
              <div className="p-2.5 bg-blue-950/50 border border-blue-800/80 rounded mt-2">
                <div className="text-[11px] font-semibold text-blue-300">
                  Active Ride: #{activeRide.id.slice(-8)}
                </div>
                <div className="text-[10px] text-slate-300">Status: {activeRide.status}</div>
                <Link
                  href={`/admin/rides/${activeRide.id}`}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline mt-1 inline-block"
                >
                  View Active Ride →
                </Link>
              </div>
            ) : (
              <div className="text-slate-500 italic text-[11px] pt-1">No active trip in progress.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            Mandatory Driver Compliance Documents (8 Categories)
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {verification.verifiedCount} / {verification.totalDocs} Verified
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Document Category & Name</th>
                <th className="p-3">Doc Identifier</th>
                <th className="p-3">Validity / Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3">Rejection / Reason</th>
                <th className="p-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {driver.documents.map((doc) => (
                <tr key={doc.name} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-white">{doc.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">{doc.category}</div>
                    {doc.description && (
                      <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs">{doc.description}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {doc.docId}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {doc.expiry}
                  </td>
                  <td className="p-3">
                    <AdminStatusBadge status={doc.status} />
                  </td>
                  <td className="p-3 max-w-50">
                    {doc.rejectionReason ? (
                      <div className="text-red-400 text-[11px]" title={doc.rejectionReason}>
                        {doc.rejectionReason}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {doc.status !== "VERIFIED" && (
                        <button
                          onClick={() => handleApproveDoc(doc.name)}
                          disabled={submittingDocAction}
                          className="px-2.5 py-1 text-xs bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {doc.status !== "REJECTED" && (
                        <button
                          onClick={() => handleOpenRejectModal(doc.name)}
                          disabled={submittingDocAction}
                          className="px-2.5 py-1 text-xs bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 rounded transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectModalOpen && selectedDocName && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              Reject Document: {selectedDocName}
            </h2>
            <p className="text-xs text-slate-300">
              Provide a clear, specific rejection reason for the driver and compliance audit log.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Expired validity date, unreadable photo, or missing seal..."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDocAction || rejectReason.trim().length < 3}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  {submittingDocAction ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-white">
              {driver.status === "ACTIVE" ? "Suspend Driver Account" : "Reactivate Driver Account"}
            </h2>
            <p className="text-xs text-slate-300">
              {driver.status === "ACTIVE"
                ? "Suspending this driver revokes active authentication tokens, locks duty, and blocks dispatch eligibility. An active ride in progress will prevent suspension."
                : "Reactivating this driver allows them to resume operations subject to document compliance."}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Administrative Reason (Mandatory)
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="State the administrative justification..."
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
                disabled={submittingStatusAction || statusReason.trim().length < 5}
                onClick={() => handleConfirmStatusChange(driver.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                className={`px-4 py-1.5 rounded text-xs text-white font-medium disabled:opacity-50 ${
                  driver.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {submittingStatusAction
                  ? "Processing..."
                  : driver.status === "ACTIVE"
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

export default DriverDetailView;
