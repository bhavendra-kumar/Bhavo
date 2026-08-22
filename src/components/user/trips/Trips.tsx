"use client";

import React, { useState } from "react";
import { Clock, MapPin, Star, Receipt, RotateCcw, FileText, TrendingUp, Phone, MessageSquare, ShieldAlert, Navigation, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TABS = ["Upcoming", "Active", "Completed", "Cancelled"];

const TRIPS = [
  { id: "TRP-8821A", date: "Oct 24, 2024", time: "8:45 AM", vehicle: "Premium Sedan", driver: "Rajesh K.", driverInitial: "R", driverRating: 4.9, amount: "₹380", pickup: "123 Tech Park Avenue, Block B", dropoff: "Bhavo Headquarters, Sector 44", duration: "45 mins", distance: "12.4 km", status: "Completed" },
  { id: "TRP-8820B", date: "Oct 23, 2024", time: "6:30 PM", vehicle: "Eco Hatch", driver: "Amit S.", driverInitial: "A", driverRating: 4.7, amount: "₹240", pickup: "Bhavo Headquarters, Sector 44", dropoff: "123 Tech Park Avenue, Block B", duration: "55 mins", distance: "12.4 km", status: "Completed" },
  { id: "TRP-8819C", date: "Oct 22, 2024", time: "8:45 AM", vehicle: "Premium Sedan", driver: "Suresh P.", driverInitial: "S", driverRating: 4.8, amount: "₹380", pickup: "123 Tech Park Avenue, Block B", dropoff: "Bhavo Headquarters, Sector 44", duration: "42 mins", distance: "12.4 km", status: "Completed" },
];

const ACTIVE_TRIP = {
  id: "TRP-8822D", date: "Today", time: "10:15 AM", vehicle: "Premium Sedan (MH-01-AB-1234)", driver: "Vijay M.", driverInitial: "V", driverRating: 4.9, amount: "₹350 est.", pickup: "Home", dropoff: "Airport Terminal 2", duration: "30 mins", distance: "8.2 km", status: "Active"
};

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState("Active");
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTrip(expandedTrip === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-start justify-between">
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ background: "#ccfbf1", border: "1px solid #5eead4" }}>
          <TrendingUp size={16} style={{ color: "#0d9488" }} />
          <div>
            <p className="text-[14px] font-bold leading-none" style={{ color: "#042f2e" }}>34 rides</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: "#14b8a6" }}>This month</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-max" style={{ background: "#ccfbf1" }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-md text-[13px] font-semibold transition-all"
            style={{
              background: activeTab === tab ? "#ffffff" : "transparent",
              color: activeTab === tab ? "#042f2e" : "#0f766e",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(20,184,166,0.1)" : "none",
              border: activeTab === tab ? "1px solid #99f6e4" : "1px solid transparent",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Active" ? (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Active Trip Details */}
          <div className="lg:w-112.5 shrink-0 card p-5 flex flex-col gap-5 h-max">
            <div className="flex items-center justify-between">
              <span className="pill-teal bg-teal-500 text-white border-transparent shadow-sm px-3 py-1">On Trip</span>
              <p className="text-[12px] font-semibold text-teal-700">ETA: 10:45 AM (12 mins away)</p>
            </div>

            <div className="flex items-center gap-4 py-3 border-b border-teal-100">
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarFallback className="text-[15px] font-bold bg-teal-100 text-teal-800">
                  {ACTIVE_TRIP.driverInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[15px] font-semibold" style={{ color: "#042f2e" }}>{ACTIVE_TRIP.driver}</p>
                <div className="flex items-center gap-1 text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>
                  <Star size={12} className="text-amber-400 fill-amber-400" /> {ACTIVE_TRIP.driverRating}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold" style={{ color: "#042f2e" }}>MH-01-AB-1234</p>
                <p className="text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>White Sedan</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors">
                <Phone size={14} /> Call
              </button>
              <button className="flex-1 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors">
                <MessageSquare size={14} /> Chat
              </button>
              <button className="flex-1 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors font-semibold">
                <ShieldAlert size={14} /> Safety
              </button>
            </div>

            <div className="relative pl-5 flex flex-col gap-4 mt-2">
              <div className="absolute left-1.75 top-2 bottom-6 w-px" style={{ background: "#99f6e4" }} />
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-5 w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: "#5eead4" }} />
                <p className="text-[13px] font-semibold" style={{ color: "#0f766e" }}>{ACTIVE_TRIP.pickup}</p>
              </div>
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-5 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "#14b8a6" }}>
                  <MapPin size={6} className="text-white" />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>{ACTIVE_TRIP.dropoff}</p>
              </div>
            </div>
          </div>

          {/* Live Map */}
          <div className="flex-1 rounded-xl overflow-hidden relative" style={{ minHeight: "500px", background: "#e6faf8", border: "1px solid #99f6e4" }}>
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "linear-gradient(#5eead4 1px, transparent 1px), linear-gradient(90deg, #5eead4 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 20 80 C 40 70, 60 40, 80 20" stroke="#0d9488" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" strokeDasharray="3 3" />
            </svg>

            {/* Current Car Position */}
            <div className="absolute top-[45%] left-[55%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-teal-500">
                <Navigation size={14} className="text-teal-600 -rotate-45" />
              </div>
              <div className="mt-1 px-2 py-0.5 bg-teal-700 text-white text-[10px] rounded shadow-md font-bold">12 mins</div>
            </div>

            {/* Destination Pin */}
            <div className="absolute top-[20%] right-[20%] flex flex-col items-center -translate-x-1/2 -translate-y-full pointer-events-none z-10">
              <div className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-white shadow-sm mb-1.5" style={{ background: "#0d9488" }}>
                Airport
              </div>
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-md" style={{ background: "#14b8a6" }} />
            </div>
          </div>
        </div>
      ) : activeTab === "Completed" ? (
        <div className="flex flex-col gap-3">
          {TRIPS.map((trip) => {
            const isExpanded = expandedTrip === trip.id;
            return (
              <div key={trip.id} className="card p-5 transition-all">
                {/* Header (Always Visible) */}
                <div className="flex flex-col lg:flex-row gap-5 cursor-pointer" onClick={() => toggleExpand(trip.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div>
                        <p className="text-[15px] font-semibold" style={{ color: "#042f2e" }}>{trip.date}</p>
                        <p className="text-[12px] font-medium mt-0.5 flex items-center gap-1" style={{ color: "#0f766e" }}>
                          <Clock size={11} /> {trip.time} · ID: {trip.id}
                        </p>
                      </div>
                      <span className="pill-teal ml-auto lg:ml-0">Completed</span>
                    </div>
                    
                    {!isExpanded && (
                      <div className="flex items-center gap-3 mt-4 text-[13px] font-semibold text-slate-700">
                        <span>{trip.pickup.split(',')[0]}</span>
                        <ArrowRight size={12} className="text-teal-400" />
                        <span>{trip.dropoff.split(',')[0]}</span>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="relative pl-5 flex flex-col gap-3">
                        <div className="absolute left-1.75 top-2 bottom-5 w-px" style={{ background: "#99f6e4" }} />
                        <div className="relative flex items-center gap-3">
                          <div className="absolute -left-5 w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: "#5eead4" }} />
                          <p className="text-[13px] font-medium" style={{ color: "#0f766e" }}>{trip.pickup}</p>
                        </div>
                        <div className="relative flex items-center gap-3">
                          <div className="absolute -left-5 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "#14b8a6" }}>
                            <MapPin size={6} className="text-white" />
                          </div>
                          <p className="text-[13px] font-medium" style={{ color: "#0f766e" }}>{trip.dropoff}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block w-px" style={{ background: "#ccfbf1" }} />

                  <div className="lg:w-56 shrink-0 flex flex-col justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-[13px] font-bold" style={{ background: "#ccfbf1", color: "#0d9488" }}>
                          {trip.driverInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>{trip.driver}</p>
                        <div className="flex items-center gap-1 text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>
                          <Star size={11} className="text-amber-400 fill-amber-400" /> {trip.driverRating}
                        </div>
                      </div>
                      <p className="ml-auto text-[18px] font-bold" style={{ color: "#042f2e" }}>{trip.amount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 shrink-0 self-center">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-teal-100 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex gap-4 text-[12px] font-medium text-teal-800">
                      <div className="bg-teal-50 px-3 py-2 rounded border border-teal-100">
                        <span className="block text-teal-600 text-[10px] uppercase mb-1">Distance</span>
                        <span className="font-bold text-teal-900 text-[14px]">{trip.distance}</span>
                      </div>
                      <div className="bg-teal-50 px-3 py-2 rounded border border-teal-100">
                        <span className="block text-teal-600 text-[10px] uppercase mb-1">Duration</span>
                        <span className="font-bold text-teal-900 text-[14px]">{trip.duration}</span>
                      </div>
                      <div className="bg-teal-50 px-3 py-2 rounded border border-teal-100">
                        <span className="block text-teal-600 text-[10px] uppercase mb-1">Vehicle</span>
                        <span className="font-bold text-teal-900 text-[14px]">{trip.vehicle}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 lg:w-56">
                      {[{ icon: Receipt, label: "Receipt" }, { icon: RotateCcw, label: "Rebook" }].map(({ icon: Icon, label }) => (
                        <button key={label}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-[13px] font-semibold transition-colors"
                          style={{ background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ccfbf1")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")}>
                          <Icon size={14} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 rounded-xl" style={{ background: "#f0fdfa", border: "1px dashed #5eead4" }}>
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4" style={{ border: "1px solid #ccfbf1" }}>
            <FileText size={22} style={{ color: "#99f6e4" }} />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: "#042f2e" }}>No {activeTab.toLowerCase()} trips</p>
          <p className="text-[13px] max-w-xs leading-relaxed" style={{ color: "#0f766e" }}>
            You don&apos;t have any {activeTab.toLowerCase()} trips right now.
          </p>
        </div>
      )}
    </div>
  );
}
