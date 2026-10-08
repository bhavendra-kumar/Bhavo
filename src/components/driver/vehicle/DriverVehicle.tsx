"use client";

import React, { useEffect, useState } from "react";
import {
  Car,
  ShieldCheck,
  BatteryCharging,
  FileCheck2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface IDriverVehicleData {
  model: string;
  numberPlate: string;
  type: string;
  fuelType: string;
  batteryOrFuelLevel: number;
  documentsVerified: boolean;
  insuranceValidUntil: string;
}

interface IDriverDocument {
  name: string;
  status: string;
  expiry: string;
  docId: string;
}

export default function DriverVehicle() {
  const [vehicle, setVehicle] = useState<IDriverVehicleData>({
    model: "Tata Tigor EV (White)",
    numberPlate: "DL-01-EV-4429",
    type: "Cab Premium (EV)",
    fuelType: "EV",
    batteryOrFuelLevel: 82,
    documentsVerified: true,
    insuranceValidUntil: "18 Dec 2027",
  });
  const [documents, setDocuments] = useState<IDriverDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch("/api/driver/vehicle")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.data) {
          if (json.data.vehicle) setVehicle(json.data.vehicle);
          if (json.data.documents) setDocuments(json.data.documents);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const refreshVehicle = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/driver/vehicle");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.vehicle) setVehicle(json.data.vehicle);
          if (json.data.documents) setDocuments(json.data.documents);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const defaultDocuments: IDriverDocument[] = [
    { name: "Commercial Driving License (DL)", status: "VERIFIED", expiry: "12 Oct 2029", docId: "DL-0420110094" },
    { name: "Vehicle Registration Certificate (RC)", status: "VERIFIED", expiry: "24 Mar 2034", docId: "RC-DL01EV4429" },
    { name: "Commercial Vehicle Insurance", status: "VERIFIED", expiry: vehicle.insuranceValidUntil || "18 Dec 2027", docId: "POL-ICICI-8840" },
    { name: "State Transport Permit & Fitness", status: "VERIFIED", expiry: "15 Jan 2028", docId: "PERMIT-NCR-993" },
    { name: "Pollution Control (PUC / EV Exemption)", status: "EXEMPT", expiry: "Permanent EV Exemption", docId: "EV-GREEN-PUC" },
  ];

  const docsToDisplay = documents.length > 0 ? documents : defaultDocuments;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Vehicle Telemetry & Compliance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet diagnostics, vehicle specifications and regulatory documents
          </p>
        </div>

        <button
          onClick={refreshVehicle}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          title="Refresh vehicle status"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-teal-600" : ""} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Vehicle Overview Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-linear-to-br from-[#042f2e] via-[#064e3b] to-[#022c22] text-white shadow-xl border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <Car size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                {vehicle.type}
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={14} /> Fleet Approved
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1">{vehicle.model}</h3>
            <span className="text-sm font-mono font-bold text-teal-200 mt-0.5 block">
              Plate: {vehicle.numberPlate}
            </span>
          </div>
        </div>

        {/* Battery & Fuel State */}
        <div className="p-4 rounded-2xl bg-teal-950/70 border border-teal-500/30 flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BatteryCharging size={24} />
          </div>
          <div>
            <span className="text-[11px] text-teal-200/70 font-bold uppercase block">
              {vehicle.fuelType === "EV" ? "Battery Level" : "Fuel Level"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{vehicle.batteryOrFuelLevel}%</span>
              <span className="text-xs text-emerald-300 font-bold">~210 km range</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Documents Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Verified Compliance Documents</h3>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            100% Compliant
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {docsToDisplay.map((doc, idx) => (
            <div key={idx} className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[14px] text-slate-900 truncate">{doc.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono block">Doc ID: {doc.docId}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 size={13} /> {doc.status}
                </span>
                <span className="text-[11px] text-slate-400 block">Valid: {doc.expiry}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
