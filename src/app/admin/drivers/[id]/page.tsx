"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  ArrowLeft,
  Car,
  AlertTriangle,
  User,
  Info,
} from "lucide-react";

interface DriverDoc {
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

interface DriverDetailData {
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
}

export default function AdminDriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const driverId = resolvedParams.id;

  const [data, setData] = useState<DriverDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDocName, setSelectedDocName] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadDriver = () => {
    fetch(`/api/admin/drivers/${driverId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setData(json.data);
        } else {
          setError(json.message || "Failed to load driver details");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error loading driver details");
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    fetch(`/api/admin/drivers/${driverId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.status === "success") {
            setData(json.data);
          } else {
            setError(json.message || "Failed to load driver details");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Network error loading driver details");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [driverId]);

  const handleApproveDoc = async (docName: string) => {
    setSubmittingAction(true);
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
      setSubmittingAction(false);
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

    setSubmittingAction(true);
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
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading driver compliance record...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-800">{error}</p>
        <Link
          href="/admin/drivers"
          className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Driver List</span>
        </Link>
      </div>
    );
  }

  const { driver, activeRide } = data!;
  const { verification } = driver;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Feedback */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/drivers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Driver Directory</span>
        </Link>

        {verification.isVerified ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Active Fleet Eligible (All Docs Verified)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Duty Locked: Verification Required
          </span>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-900 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-900 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Driver Summary & Vehicle Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Driver Profile */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <User className="w-4 h-4 text-teal-600" />
            <h2>Driver Identity</h2>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-slate-900 text-base">{driver.name}</p>
            <p className="text-slate-500">{driver.email}</p>
            <p className="text-slate-500">{driver.phone}</p>
            <div className="pt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[10px] text-slate-700">
                Rating: {driver.rating} ★
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                  driver.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {driver.status}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Vehicle */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <Car className="w-4 h-4 text-teal-600" />
            <h2>Registered Vehicle</h2>
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-slate-900">{driver.vehicle.model || "Not specified"}</p>
            <p className="font-mono text-slate-600">{driver.vehicle.numberPlate || "Plate pending"}</p>
            <p className="text-slate-500">Category: {driver.vehicle.type || "Cab Premium"}</p>
            <p className="text-slate-500">Fuel: {driver.vehicle.fuelType || "EV"}</p>
            <div className="pt-2">
              <span
                className={`text-[11px] font-semibold ${
                  driver.vehicle.documentsVerified !== false
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                Vehicle Cert:{" "}
                {driver.vehicle.documentsVerified !== false ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Duty & Active Ride Invariant */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <Info className="w-4 h-4 text-teal-600" />
            <h2>Active Operations</h2>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Telemetry Duty State:</span>
              <span className="font-semibold text-slate-800">{driver.dutyState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Online Status:</span>
              <span
                className={`font-semibold ${
                  driver.isOnline ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {driver.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {activeRide ? (
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 mt-2">
                <p className="font-bold text-[11px]">Assigned to Ride #{activeRide.id.slice(-6)}</p>
                <p className="text-[10px]">Status: {activeRide.status}</p>
              </div>
            ) : (
              <p className="text-slate-400 text-[11px] pt-2">No active ride in progress.</p>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Documents Review Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Compliance & Safety Documents</h2>
            <p className="text-xs text-slate-500">
              Each document requires explicit administrative authorization.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            {verification.verifiedCount} / {verification.totalDocs} Documents Verified
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Document Name</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Identifier & Validity</th>
                <th className="px-5 py-3 font-semibold">Verification Status</th>
                <th className="px-5 py-3 font-semibold">Notes / Rejection Reason</th>
                <th className="px-5 py-3 font-semibold text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.documents.map((doc) => {
                const isVerified = doc.status === "VERIFIED" || doc.status === "EXEMPT";
                const isRejected = doc.status === "REJECTED";

                return (
                  <tr key={doc.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{doc.name}</div>
                      {doc.description && (
                        <div className="text-[11px] text-slate-400 max-w-xs">{doc.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          doc.category === "DRIVER"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-slate-800">{doc.docId}</div>
                      <div className="text-[11px] text-slate-400">Exp: {doc.expiry}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          VERIFIED
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="w-3 h-3 text-rose-600" />
                          REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          PENDING REVIEW
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs">
                      {doc.rejectionReason ? (
                        <span className="text-rose-600 font-medium">{doc.rejectionReason}</span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {!isVerified && (
                        <button
                          onClick={() => handleApproveDoc(doc.name)}
                          disabled={submittingAction}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                      {!isRejected && (
                        <button
                          onClick={() => handleOpenRejectModal(doc.name)}
                          disabled={submittingAction}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Reject Document</h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the precise operational reason for rejecting{" "}
              <strong className="text-slate-900">{selectedDocName}</strong>. This will be visible to
              compliance and audited.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason (Mandatory, min 3 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Expired on 12 Oct 2024, Blurry photograph, Vehicle registration plate mismatch"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || rejectReason.trim().length < 3}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  {submittingAction ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
