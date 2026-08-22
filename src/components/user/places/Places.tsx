"use client";

import React, { useState } from "react";
import { MapPin, Home, Briefcase, Plus, Heart, Navigation, Edit2, Trash2, Clock, Check } from "lucide-react";

const SAVED_PLACES = [
  {
    id: 1,
    name: "Home",
    address: "Apt 4B, Serenity Heights, Sector 12",
    icon: Home,
    tag: "Primary",
  },
  {
    id: 2,
    name: "Office",
    address: "Bhavo Headquarters, Sector 44, Cyber City",
    icon: Briefcase,
    tag: "Work",
  },
  {
    id: 3,
    name: "Gym",
    address: "FitPro Center, Downtown",
    icon: Heart,
    tag: "Favourite",
  },
];

const RECENT_PLACES = [
  { id: 4, name: "Airport Terminal 2", address: "International Departures", time: "Yesterday" },
  { id: 5, name: "City Mall", address: "M.G. Road, Sector 25", time: "3 days ago" },
];

export default function PlacesPage() {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex md:justify-end">
        <button className="h-9 px-4 rounded-lg flex items-center gap-2 text-[13px] font-bold text-white transition-all hover:opacity-90"
          style={{ background: "#0d9488", boxShadow: "0 4px 12px rgba(13,148,136,0.2)" }}>
          <Plus size={16} /> Add Place
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Saved Places */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-[15px] font-bold text-[#042f2e] flex items-center gap-2">
            <Heart size={16} className="text-[#0d9488]" /> Saved Places
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAVED_PLACES.map((place) => {
              const isEditing = editingId === place.id;
              
              return (
                <div key={place.id} className="card p-5 transition-all hover:border-[#99f6e4] group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: "#ccfbf1" }}>
                      <place.icon size={20} style={{ color: "#0d9488" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isEditing ? (
                          <input type="text" defaultValue={place.name} className="w-full text-[14px] font-bold text-[#042f2e] bg-teal-50 px-2 py-0.5 rounded outline-none border border-teal-200" autoFocus />
                        ) : (
                          <h3 className="font-bold text-[14px] text-[#042f2e] truncate">{place.name}</h3>
                        )}
                        <span className="pill-teal shrink-0">{place.tag}</span>
                      </div>
                      
                      {isEditing ? (
                        <textarea defaultValue={place.address} className="w-full text-[12px] font-medium text-[#0f766e] bg-teal-50 px-2 py-1 rounded outline-none border border-teal-200 mt-1 resize-none h-12" />
                      ) : (
                        <p className="text-[12px] font-medium text-[#0f766e] leading-relaxed line-clamp-2">{place.address}</p>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-md bg-[#0d9488] text-white">
                              <Check size={12} /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-md bg-slate-100 text-slate-600">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors"
                              style={{ background: "#ccfbf1", color: "#0d9488" }}>
                              <Navigation size={12} /> Book Ride
                            </button>
                            <button onClick={() => setEditingId(place.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-[#5eead4] hover:bg-[#ccfbf1] hover:text-[#0d9488] transition-colors ml-auto">
                              <Edit2 size={13} />
                            </button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-md text-[#5eead4] hover:bg-rose-50 hover:text-rose-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new card */}
            <button className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-[#5eead4] transition-all hover:text-[#0d9488] group min-h-35"
              style={{ border: "2px dashed #ccfbf1", background: "#f0fdfa" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform"
                style={{ border: "1px solid #ccfbf1" }}>
                <Plus size={18} />
              </div>
              <span className="font-bold text-[13px]">Add New Destination</span>
            </button>
          </div>
        </div>

        {/* Recent Places & Map Preview */}
        <div className="flex flex-col gap-5">
          
          {/* Map Preview */}
          <div className="card h-48 relative overflow-hidden flex flex-col justify-end p-4 group">
            <div className="absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: "linear-gradient(#5eead4 1px, transparent 1px), linear-gradient(90deg, #5eead4 1px, transparent 1px)", backgroundSize: "30px 30px", backgroundColor: "#e6faf8" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#0d9488] rounded-full border-2 border-white shadow-md" />
            </div>
            <button className="relative z-10 w-full py-2 bg-white/90 backdrop-blur text-[#0d9488] text-[12px] font-bold rounded-lg border border-[#ccfbf1] shadow-sm hover:bg-white transition-colors flex items-center justify-center gap-2">
              <MapPin size={14} /> View on Map
            </button>
          </div>

          {/* Recent Places */}
          <div className="card p-5">
            <h2 className="text-[14px] font-bold text-[#042f2e] flex items-center gap-2 mb-4">
              <Clock size={16} className="text-[#0d9488]" /> Recent Places
            </h2>
            <div className="flex flex-col gap-4">
              {RECENT_PLACES.map((place) => (
                <div key={place.id} className="flex items-start gap-3 group cursor-pointer">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#f0fdfa] border border-[#ccfbf1] group-hover:bg-[#ccfbf1] transition-colors">
                    <MapPin size={12} className="text-[#0d9488]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[#042f2e] truncate">{place.name}</p>
                      <span className="text-[10px] font-medium text-[#0f766e]">{place.time}</span>
                    </div>
                    <p className="text-[11px] font-medium text-[#0f766e] truncate mt-0.5">{place.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
