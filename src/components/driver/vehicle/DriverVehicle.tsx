"use client";

import React, { useEffect, useState } from "react";
import {
  Car,
  ShieldCheck,
  ShieldAlert,
  BatteryCharging,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Upload,
  Lock,
  X,
  Save,
  Loader2,
  FileText,
  UserCheck,
  Smartphone,
  BadgeCheck,
  Info,
  Edit3,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { useDialog } from "@/components/ui/DialogProvider";
import { DEFAULT_DRIVER_DOCUMENTS } from "@/lib/driverCompliance";

interface IDriverVehicleData {
  model: string;
  numberPlate: string;
  type: string;
  fuelType: string;
  batteryOrFuelLevel: number;
  documentsVerified: boolean;
  insuranceValidUntil: string;
}

interface IDriverDocItem {
  name: string;
  category: "DRIVER" | "VEHICLE";
  description?: string;
  status: "VERIFIED" | "PENDING" | "REJECTED" | "EXEMPT";
  expiry: string;
  docId: string;
  fileUrl?: string | null;
  rejectionReason?: string | null;
}

export default function DriverVehicle() {
  const { alert } = useDialog();
  const { fetchDriverData, setVerification } = useDriverStore();

  const [vehicle, setVehicle] = useState<IDriverVehicleData>({
    model: "",
    numberPlate: "",
    type: "",
    fuelType: "EV",
    batteryOrFuelLevel: 100,
    documentsVerified: false,
    insuranceValidUntil: "",
  });
  const [documents, setDocuments] = useState<IDriverDocItem[]>(() => [...DEFAULT_DRIVER_DOCUMENTS]);
  const [loading, setLoading] = useState(true);

  // Edit Vehicle Modal State
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [editVehicleModel, setEditVehicleModel] = useState("");
  const [editVehicleNumberPlate, setEditVehicleNumberPlate] = useState("");
  const [editVehicleType, setEditVehicleType] = useState("Cab Economy");
  const [editVehicleFuelType, setEditVehicleFuelType] = useState("EV");
  const [editVehicleSaving, setEditVehicleSaving] = useState(false);

  // Edit/Upload Modal State
  const [editingDoc, setEditingDoc] = useState<IDriverDocItem | null>(null);
  const [editDocId, setEditDocId] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editFileUploaded, setEditFileUploaded] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const handleSyncLive = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/driver/vehicle");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.vehicle) setVehicle(json.data.vehicle);
          if (json.data.documents) setDocuments(json.data.documents);
          if (json.data.verification) {
            setVerification(json.data.verification);
          }
        }
      }
    } catch (e) {
      console.error("[Vehicle GET Error]:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    fetch("/api/driver/vehicle")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isCancelled && json?.data) {
          if (json.data.vehicle) setVehicle(json.data.vehicle);
          if (json.data.documents) setDocuments(json.data.documents);
          if (json.data.verification) {
            setVerification(json.data.verification);
          }
        }
      })
      .catch((e) => {
        console.error("[Vehicle GET Error]:", e);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setVerification]);

  // Filter documents by category strictly
  const driverDocs = documents.filter((d) => d.category === "DRIVER");
  const vehicleDocs = documents.filter((d) => d.category === "VEHICLE");

  const totalCount = documents.length;
  const verifiedCount = documents.filter(
    (d) => d.status === "VERIFIED" || d.status === "EXEMPT"
  ).length;
  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const rejectedCount = documents.filter((d) => d.status === "REJECTED").length;
  const isAllVerified = totalCount > 0 && verifiedCount === totalCount;

  const openVehicleEditModal = () => {
    setEditVehicleModel(vehicle.model || "");
    setEditVehicleNumberPlate(vehicle.numberPlate || "");
    setEditVehicleType(vehicle.type || "Cab Economy");
    setEditVehicleFuelType(vehicle.fuelType || "EV");
    setIsEditingVehicle(true);
  };

  const handleSaveVehicleDetails = async () => {
    if (!editVehicleModel.trim()) {
      alert({
        title: "Model Required",
        message: "Please enter your vehicle make and model (e.g. Maruti Swift or Tata Tigor EV).",
        confirmText: "OK",
        variant: "warning",
      });
      return;
    }
    if (!editVehicleNumberPlate.trim()) {
      alert({
        title: "Registration Number Required",
        message: "Please enter your vehicle registration number plate (e.g. DL-01-AB-1234).",
        confirmText: "OK",
        variant: "warning",
      });
      return;
    }

    setEditVehicleSaving(true);
    try {
      const res = await fetch("/api/driver/vehicle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: {
            model: editVehicleModel.trim(),
            numberPlate: editVehicleNumberPlate.trim().toUpperCase(),
            type: editVehicleType,
            fuelType: editVehicleFuelType,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.vehicle) setVehicle(json.data.vehicle);
        if (json.data.verification) setVerification(json.data.verification);
        await fetchDriverData();
        setIsEditingVehicle(false);
        alert({
          title: "Vehicle Updated Successfully",
          message: "Your vehicle details have been saved to your account.",
          confirmText: "Done",
          variant: "success",
        });
      } else {
        alert({
          title: "Update Failed",
          message: json.message || "Failed to update vehicle details.",
          confirmText: "OK",
          variant: "danger",
        });
      }
    } catch {
      alert({
        title: "Network Error",
        message: "Unable to save vehicle details. Please check connection and try again.",
        confirmText: "OK",
        variant: "danger",
      });
    } finally {
      setEditVehicleSaving(false);
    }
  };

  const openEditModal = (doc: IDriverDocItem) => {
    setEditingDoc(doc);
    setEditDocId(doc.docId || "");
    setEditExpiry(doc.expiry || "");
    setEditFileUploaded(Boolean(doc.fileUrl));
  };

  const handleSaveDocSubmission = async () => {
    if (!editingDoc) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/driver/vehicle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_DOC",
          docName: editingDoc.name,
          docData: {
            docId: editDocId.trim() || editingDoc.docId,
            expiry: editExpiry.trim() || editingDoc.expiry,
            status: "PENDING", // Submitting an update sets it to PENDING review
            fileUrl: editFileUploaded ? (editingDoc.fileUrl || "/documents/uploaded_proof.pdf") : null,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.vehicle) setVehicle(json.data.vehicle);
        if (json.data.documents) setDocuments(json.data.documents);
        if (json.data.verification) setVerification(json.data.verification);
        await fetchDriverData();

        setEditingDoc(null);
        alert({
          title: "Document Submitted for Verification",
          message: `Your updated details for "${editingDoc.name}" have been submitted. Bhavo compliance will review it. Note: You cannot go online until verification is approved.`,
          confirmText: "Understood",
          variant: "info",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>VERIFIED</span>
          </span>
        );
      case "EXEMPT":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <CheckCircle2 size={13} className="text-sky-600" />
            <span>EXEMPT</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={13} className="text-rose-600" />
            <span>REJECTED</span>
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
            <Clock size={13} className="text-amber-600 animate-spin" />
            <span>PENDING REVIEW</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-12">
      {/* ── Top Bar: Header & Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vehicle & Compliance Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fleet standards require 100% verified documents before going online or accepting rides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncLive}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh verification status from MongoDB"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-teal-600" : ""} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* ── Primary Compliance Status Hero Banner ── */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-lg transition-all ${
          isAllVerified
            ? "bg-linear-to-br from-[#042f2e] via-[#064e3b] to-[#022c22] border-teal-500/30 text-white"
            : "bg-linear-to-br from-[#1c1917] via-[#292524] to-[#1c1917] border-amber-500/40 text-white shadow-amber-950/20"
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isAllVerified
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                  : "bg-amber-500/20 border-amber-400/40 text-amber-300"
              }`}
            >
              {isAllVerified ? (
                <ShieldCheck size={30} className="text-emerald-400" />
              ) : (
                <ShieldAlert size={30} className="text-amber-400 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  suppressHydrationWarning
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                    isAllVerified
                      ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
                      : "bg-amber-400/20 text-amber-300 border-amber-400/30"
                  }`}
                >
                  {isAllVerified
                    ? "100% Verified & Compliant"
                    : rejectedCount > 0
                    ? `${rejectedCount} Rejected • Action Required`
                    : pendingCount > 0
                    ? `${pendingCount} Under Review • Action Required`
                    : "Verification Incomplete • Action Required"}
                </span>

                <span suppressHydrationWarning className="text-xs text-slate-300 font-semibold">
                  {verifiedCount} of {totalCount} Documents Approved
                </span>
              </div>

              <h3 suppressHydrationWarning className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
                {isAllVerified
                  ? "Authorized for Duty & Rider Dispatches"
                  : "Duty Locked: Pending Compliance Approval"}
              </h3>

              <p suppressHydrationWarning className="text-xs sm:text-[13px] text-slate-200/80 mt-1 max-w-xl leading-relaxed">
                {isAllVerified
                  ? "All 8 required driver and vehicle documents have passed compliance verification. Your account is clear to turn online and accept passenger trips."
                  : "Safety policy requires all 8 required documents (DL, Identity Proof, Bank Account, Profile Photo, RC, Insurance, PUC, Helmets) to be fully verified before coming online. Until all 8 are verified, you cannot go online or accept rides."}
              </p>
            </div>
          </div>

          {/* Admin Verification Status Box */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 w-full md:w-auto shrink-0 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-200/70 block">
              Admin Verification Status
            </span>
            <div className="flex items-center gap-2">
              {isAllVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Approved by Platform Admin</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                  <Clock size={14} className="text-amber-400" />
                  <span>Awaiting Admin Document Review</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
            <span>Compliance Progress</span>
            <span>{Math.round((verifiedCount / (totalCount || 1)) * 100)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isAllVerified ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${Math.round((verifiedCount / (totalCount || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Vehicle Hardware Telemetry Card ── */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Car size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {vehicle.type || "Cab Economy"}
              </span>
              <span
                className={`text-xs font-bold flex items-center gap-1 ${
                  isAllVerified ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {isAllVerified ? <ShieldCheck size={14} /> : <Lock size={14} />}
                {isAllVerified ? "Fleet Compliant" : "Verification Required"}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">{vehicle.model || "Vehicle Details Not Registered"}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-500">
                Registration Plate: <strong className="text-slate-800">{vehicle.numberPlate || "Pending Registration"}</strong>
              </span>
              <button
                onClick={openVehicleEditModal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Update vehicle model and registration details"
              >
                <Edit3 size={12} />
                <span>Edit Vehicle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Battery & Fuel State */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <BatteryCharging size={22} />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold uppercase block">
              {vehicle.fuelType === "EV" ? "Battery Level" : "Fuel Level"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">{vehicle.batteryOrFuelLevel}%</span>
              <span className="text-xs text-emerald-600 font-bold">~210 km range</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Driver Identity & Credential Documents ── */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Driver Personal & Identity Documents
              </h3>
              <p className="text-xs text-slate-500">
                Official commercial driver credentials required by regional transport authority.
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              driverDocs.every((d) => d.status === "VERIFIED" || d.status === "EXEMPT")
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}
          >
            {driverDocs.every((d) => d.status === "VERIFIED" || d.status === "EXEMPT")
              ? "All Driver Docs Verified"
              : "Driver Verification Pending"}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {driverDocs.map((doc, idx) => (
            <div
              key={idx}
              className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    doc.status === "VERIFIED" || doc.status === "EXEMPT"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-[14px] text-slate-900 truncate">{doc.name}</h4>
                    {renderStatusBadge(doc.status)}
                  </div>
                  {doc.description && (
                    <p className="text-[12px] text-slate-600 mt-0.5 leading-snug font-medium">
                      {doc.description}
                    </p>
                  )}
                  <span className="text-[12px] text-slate-500 font-mono mt-1 block">
                    ID / Number: <strong className="text-slate-800">{doc.docId}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Valid Until: <strong className="text-slate-600">{doc.expiry}</strong>
                  </span>
                  {doc.rejectionReason && (
                    <span className="text-[11px] font-medium text-rose-600 block mt-1">
                      ⚠️ Note: {doc.rejectionReason}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons for Document */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => openEditModal(doc)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Submit or update document proof for compliance review"
                >
                  <Upload size={13} />
                  <span>{doc.status === "VERIFIED" ? "Update Proof" : "Submit Proof"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Vehicle Compliance Documents ── */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Car size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Vehicle Compliance & Transport Permits
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory vehicular registration, insurance, state permits, and fitness.
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              vehicleDocs.every((d) => d.status === "VERIFIED" || d.status === "EXEMPT")
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}
          >
            {vehicleDocs.every((d) => d.status === "VERIFIED" || d.status === "EXEMPT")
              ? "All Vehicle Docs Verified"
              : "Vehicle Verification Pending"}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {vehicleDocs.map((doc, idx) => (
            <div
              key={idx}
              className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    doc.status === "VERIFIED" || doc.status === "EXEMPT"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-[14px] text-slate-900 truncate">{doc.name}</h4>
                    {renderStatusBadge(doc.status)}
                  </div>
                  {doc.description && (
                    <p className="text-[12px] text-slate-600 mt-0.5 leading-snug font-medium">
                      {doc.description}
                    </p>
                  )}
                  <span className="text-[12px] text-slate-500 font-mono mt-1 block">
                    Doc ID: <strong className="text-slate-800">{doc.docId}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Valid Until: <strong className="text-slate-600">{doc.expiry}</strong>
                  </span>
                  {doc.rejectionReason && (
                    <span className="text-[11px] font-medium text-rose-600 block mt-1">
                      ⚠️ Note: {doc.rejectionReason}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons for Document */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => openEditModal(doc)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Submit or update vehicle document proof for compliance review"
                >
                  <Upload size={13} />
                  <span>{doc.status === "VERIFIED" ? "Update Proof" : "Submit Proof"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Basic Requirements ── */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BadgeCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Basic Requirements
              </h3>
              <p className="text-xs text-slate-500">
                Core prerequisites for driver partner onboarding.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-[13px] text-slate-900">Minimum age of 18 years.</h4>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>Eligible</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mandatory minimum legal age required to hold a commercial driving license and operate passenger transport.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-[13px] text-slate-900">An Android smartphone with active internet.</h4>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Required for real-time ride alerts, GPS route navigation, customer communications, and live telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center gap-2.5 text-xs text-teal-950">
          <Info size={16} className="text-teal-700 shrink-0" />
          <span>
            Let us know your <strong>city or state</strong> and vehicle type (<strong>Bike</strong>, <strong>Auto</strong>, or <strong>Cab</strong>) for customized local transport authority onboarding rules and step-by-step app instructions.
          </span>
        </div>
      </div>

      {/* ── Document Edit / Upload Modal ── */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-teal-300" />
                <h3 className="font-extrabold text-[15px] truncate">Update Document Proof</h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block">
                  Document Title
                </span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{editingDoc.name}</p>
                <span className="text-xs text-amber-600 font-semibold mt-1 block">
                  ⚠️ Note: Submitting updated documents places them under Bhavo Compliance review.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Document ID / Reference Number
                </label>
                <input
                  type="text"
                  value={editDocId}
                  onChange={(e) => setEditDocId(e.target.value)}
                  placeholder="e.g. DL-0420110094 or RC-DL01EV4429"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  placeholder="e.g. 24 Mar 2034 or Permanent"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              {/* Upload Proof Simulator */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Upload Document Scan / Photo Proof
                </label>
                <div
                  onClick={() => setEditFileUploaded(true)}
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    editFileUploaded
                      ? "border-emerald-400 bg-emerald-50/50 text-emerald-800"
                      : "border-slate-300 hover:border-teal-400 bg-slate-50 text-slate-600"
                  }`}
                >
                  <Upload size={20} className={editFileUploaded ? "text-emerald-600" : "text-slate-400"} />
                  <span className="text-xs font-bold">
                    {editFileUploaded ? "Proof File Attached (compliance_doc.pdf)" : "Tap to upload image/PDF"}
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, or PDF up to 10MB</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocSubmission}
                  disabled={editSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Submit for Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Vehicle Edit Modal ── */}
      {isEditingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car size={18} className="text-teal-300" />
                <h3 className="font-extrabold text-[15px] truncate">Edit Vehicle Details</h3>
              </div>
              <button
                onClick={() => setIsEditingVehicle(false)}
                className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vehicle Make & Model
                </label>
                <input
                  type="text"
                  value={editVehicleModel}
                  onChange={(e) => setEditVehicleModel(e.target.value)}
                  placeholder="e.g. Tata Tigor EV (White) or Maruti Dzire"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Registration Number Plate
                </label>
                <input
                  type="text"
                  value={editVehicleNumberPlate}
                  onChange={(e) => setEditVehicleNumberPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. DL-01-EV-4429"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vehicle Category
                  </label>
                  <select
                    value={editVehicleType}
                    onChange={(e) => setEditVehicleType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="Bike Taxi">Bike Taxi</option>
                    <option value="Auto Rickshaw">Auto Rickshaw</option>
                    <option value="Cab Economy">Cab Economy</option>
                    <option value="Cab Premium (EV)">Cab Premium (EV)</option>
                    <option value="Cab XL">Cab XL</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fuel / Energy Type
                  </label>
                  <select
                    value={editVehicleFuelType}
                    onChange={(e) => setEditVehicleFuelType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="EV">EV (Electric)</option>
                    <option value="CNG">CNG</option>
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                  </select>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                ℹ️ Updated vehicle details are submitted to compliance. Documents must match the registered number plate.
              </span>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingVehicle(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVehicleDetails}
                  disabled={editVehicleSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editVehicleSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Vehicle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
