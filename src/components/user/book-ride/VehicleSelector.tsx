"use client";

import React from "react";
import { Users, Check, Loader2 } from "lucide-react";
import { VehicleIcon } from "./VehicleIcons";
import type { DynamicVehicle } from "./types";

interface VehicleSelectorProps {
  dynamicVehicles: DynamicVehicle[];
  selected: string;
  onSelect: (id: string) => void;
  routeLoading: boolean;
  routeDistanceKm: number;
}

export default function VehicleSelector({
  dynamicVehicles,
  selected,
  onSelect,
  routeLoading,
  routeDistanceKm,
}: VehicleSelectorProps) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Select Ride Tier
        </p>
        <span className="text-[11px] text-teal-700 font-semibold">
          {routeLoading ? (
            <span className="flex items-center gap-1 text-slate-400">
              <Loader2 size={11} className="animate-spin text-teal-600" /> Calculating...
            </span>
          ) : (
            `Distance: ${routeDistanceKm} km`
          )}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {dynamicVehicles.map((v) => {
          const isSelected = selected === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border cursor-pointer"
              style={{
                background: isSelected ? "#f0fdfa" : "#ffffff",
                borderColor: isSelected ? "#14b8a6" : "#e2e8f0",
                boxShadow: isSelected ? "0 2px 8px rgba(20,184,166,0.15)" : "none",
              }}
            >
              <div
                className="w-14 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                style={{
                  background: isSelected ? "#ccfbf1" : "#f8fafc",
                  borderColor: isSelected ? "#99f6e4" : "#e2e8f0",
                }}
              >
                <VehicleIcon id={v.id} type={v.type} className="w-11 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-slate-900">{v.name}</p>
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
                    <Users size={10} /> {v.capacity}
                  </span>
                </div>
                <p className="text-[12px] font-medium mt-0.5 text-slate-500">{v.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[16px] font-black text-slate-900">
                  {routeLoading ? "..." : v.price}
                </p>
                <p className="text-[11px] font-medium mt-0.5 text-teal-600">{v.eta} away</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-teal-600">
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
