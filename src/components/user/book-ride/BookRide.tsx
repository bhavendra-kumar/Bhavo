"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, CarFront, Users, Wallet, Check, ChevronRight,
  Star, Navigation, Home, Briefcase, CalendarClock, Heart, Tag,
  Package, Bike
} from "lucide-react";
import dynamic from "next/dynamic";
import LocationSearch from "./LocationSearch";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const VEHICLES = [
  { id: "parcel",  name: "Parcel",       desc: "Send packages instantly",          price: "₹80",  capacity: 1, eta: "2 min", rating: 4.8, type: "parcel" },
  { id: "bike",    name: "Bike",         desc: "Beat the traffic",                 price: "₹120", capacity: 1, eta: "1 min", rating: 4.7, type: "bike" },
  { id: "auto",    name: "Auto",         desc: "Everyday city rides",              price: "₹160", capacity: 3, eta: "3 min", rating: 4.5, type: "auto" },
  { id: "economy", name: "Cab Economy",  desc: "Affordable, fuel-efficient rides", price: "₹240", capacity: 4, eta: "3 min", rating: 4.6, type: "car" },
  { id: "premium", name: "Cab Premium",  desc: "Top-rated sedans, extra legroom",  price: "₹380", capacity: 4, eta: "5 min", rating: 4.9, type: "car" },
  { id: "large",   name: "Cab Large",    desc: "Spacious 6-seater for groups",     price: "₹520", capacity: 6, eta: "8 min", rating: 4.8, type: "suv" },
];

const getVehicleIcon = (type: string, props: { size?: number, style?: React.CSSProperties }) => {
  switch (type) {
    case "parcel": return <Package {...props} />;
    case "bike": return <Bike {...props} />;
    default: return <CarFront {...props} />;
  }
};

export default function BookRidePage() {
  const [selected, setSelected] = useState("premium");
  const [rideMode, setRideMode] = useState<"instant" | "schedule">("instant");
  
  // Options
  const [petFriendly, setPetFriendly] = useState(false);
  const [prefDriver, setPrefDriver] = useState(false);

  // Map Coordinates
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

  const selectedVehicle = VEHICLES.find((v) => v.id === selected)!;

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">
        {/* Left Panel */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:pr-2 no-scrollbar pb-2">
          
          {/* Ride Mode Toggle */}
          <div className="flex p-1 rounded-lg" style={{ background: "#ccfbf1" }}>
            <button
              onClick={() => setRideMode("instant")}
              className="flex-1 py-2 text-[13px] font-bold rounded-md transition-all flex items-center justify-center gap-2"
              style={{
                background: rideMode === "instant" ? "#ffffff" : "transparent",
                color: rideMode === "instant" ? "#042f2e" : "#0f766e",
                boxShadow: rideMode === "instant" ? "0 1px 4px rgba(20,184,166,0.1)" : "none",
              }}
            >
              <CarFront size={14} /> Instant Ride
            </button>
            <button
              onClick={() => setRideMode("schedule")}
              className="flex-1 py-2 text-[13px] font-bold rounded-md transition-all flex items-center justify-center gap-2"
              style={{
                background: rideMode === "schedule" ? "#ffffff" : "transparent",
                color: rideMode === "schedule" ? "#042f2e" : "#0f766e",
                boxShadow: rideMode === "schedule" ? "0 1px 4px rgba(20,184,166,0.1)" : "none",
              }}
            >
              <CalendarClock size={14} /> Schedule Ride
            </button>
          </div>

          {/* Locations */}
          <div className="card p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#0f766e" }}>Locations</p>
              {rideMode === "schedule" && (
                <div className="flex gap-2">
                  <input type="date" className="text-[11px] font-semibold px-2 py-1 rounded bg-teal-50 border border-teal-100 text-teal-900 outline-none" />
                  <input type="time" className="text-[11px] font-semibold px-2 py-1 rounded bg-teal-50 border border-teal-100 text-teal-900 outline-none" defaultValue="08:45" />
                </div>
              )}
            </div>
            
            <div className="relative flex flex-col gap-4">
              <div className="absolute left-3.5 top-8 bottom-8 w-px" style={{ background: "#99f6e4" }} />
              <LocationSearch 
                label="Pickup" 
                placeholder="Search pickup location..." 
                defaultValue="123 Tech Park Avenue"
                iconBg="#134e4a" 
                icon={<div className="w-2 h-2 bg-white rounded-full" />}
                onSelect={(lat, lon) => setPickupCoords([lat, lon])}
              />
              <LocationSearch 
                label="Drop-off" 
                placeholder="Where to?" 
                iconBg="#14b8a6" 
                icon={<MapPin size={13} className="text-white" />}
                onSelect={(lat, lon) => setDropoffCoords([lat, lon])}
              />
            </div>

            {/* Saved Places */}
            <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
              <button className="pill-teal shrink-0">
                <Home size={10} /> Home
              </button>
              <button className="pill-teal shrink-0">
                <Briefcase size={10} /> Office
              </button>
              <button className="pill-slate shrink-0 text-[#0f766e] bg-[#f0fdfa] border-[#ccfbf1]">
                <Heart size={10} /> Gym
              </button>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#0f766e" }}>Select Ride</p>
            <div className="flex flex-col gap-2">
              {VEHICLES.map((v) => {
                const isSelected = selected === v.id;
                return (
                  <button key={v.id} onClick={() => setSelected(v.id)}
                    className="flex items-center gap-3 p-3.5 rounded-lg text-left transition-all"
                    style={{
                      background: isSelected ? "#f0fdfa" : "#fafcfc",
                      border: isSelected ? "1px solid #14b8a6" : "1px solid #ccfbf1",
                    }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: isSelected ? "#ccfbf1" : "#f0fdfa" }}>
                      {getVehicleIcon(v.type, { size: 20, style: { color: isSelected ? "#0d9488" : "#5eead4" } })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>{v.name}</p>
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#ccfbf1", color: "#0d9488" }}>
                          <Users size={10} /> {v.capacity}
                        </span>
                      </div>
                      <p className="text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>{v.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[16px] font-bold" style={{ color: "#042f2e" }}>{v.price}</p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: "#14b8a6" }}>{v.eta} away</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#14b8a6" }}>
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="card p-4 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#0f766e" }}>Options</p>
            
            <button onClick={() => setPetFriendly(!petFriendly)}
              className="flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
              <span className="text-xl">🐶</span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>Pet-Friendly</p>
                <p className="text-[11px] font-medium" style={{ color: "#0f766e" }}>Bring your furry friend along</p>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"
                style={{ background: petFriendly ? "#14b8a6" : "white", border: petFriendly ? "1px solid #14b8a6" : "1px solid #99f6e4" }}>
                {petFriendly && <Check size={12} className="text-white" />}
              </div>
            </button>

            <button onClick={() => setPrefDriver(!prefDriver)}
              className="flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ccfbf1" }}>
                <Star size={15} style={{ color: "#0d9488" }} className={prefDriver ? "fill-[#0d9488]" : ""} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>Preferred Driver</p>
                <p className="text-[11px] font-medium" style={{ color: "#0f766e" }}>Match with highly-rated drivers you know</p>
              </div>
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"
                style={{ background: prefDriver ? "#14b8a6" : "white", border: prefDriver ? "1px solid #14b8a6" : "1px solid #99f6e4" }}>
                {prefDriver && <Check size={12} className="text-white" />}
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ccfbf1" }}>
                <Wallet size={15} style={{ color: "#0d9488" }} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>Payment</p>
                <p className="text-[11px] font-medium" style={{ color: "#0f766e" }}>Bhavo Wallet · ₹1,250 available</p>
              </div>
              <ChevronRight size={15} style={{ color: "#5eead4" }} />
            </button>
          </div>

          {/* Promo / Coupon */}
          <div className="card p-3 flex items-center gap-3">
            <Tag size={16} style={{ color: "#14b8a6" }} />
            <input 
              type="text" 
              placeholder="Enter Promo Code" 
              className="flex-1 text-[13px] font-semibold focus:outline-none bg-transparent placeholder:text-[#99f6e4]"
              style={{ color: "#042f2e" }}
            />
            <button className="text-[12px] font-bold px-3 py-1.5 rounded-md" style={{ background: "#ccfbf1", color: "#0d9488" }}>
              Apply
            </button>
          </div>

          {/* CTA */}
          <button className="w-full h-12 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] mt-2"
            style={{ background: "#0d9488", boxShadow: "0 4px 16px rgba(13,148,136,0.3)" }}>
            {rideMode === "schedule" ? `Schedule ${selectedVehicle.name}` : `Confirm ${selectedVehicle.name}`} <Navigation size={16} />
          </button>
          <div className="flex items-center justify-between px-1 text-[12px]">
            <span className="font-medium" style={{ color: "#0f766e" }}>Estimated fare</span>
            <span className="font-bold" style={{ color: "#042f2e" }}>{selectedVehicle.price}</span>
          </div>
        </div>

        {/* Map Panel */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden relative min-h-100 lg:h-[calc(100vh-128px)] lg:sticky lg:top-8 self-start" style={{ background: "#e6faf8", border: "1px solid #99f6e4" }}>
          <LeafletMap pickupCoords={pickupCoords} dropoffCoords={dropoffCoords} />


          {/* ETA chip */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg z-10"
            style={{ background: "#ffffff", border: "1px solid #ccfbf1", boxShadow: "0 2px 8px rgba(20,184,166,0.12)" }}>
            <Clock size={14} style={{ color: "#0d9488" }} />
            <span className="text-[13px] font-semibold" style={{ color: "#042f2e" }}>{selectedVehicle.name} · {selectedVehicle.eta}</span>
          </div>

          <button className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center transition-colors z-10"
            style={{ background: "#ffffff", border: "1px solid #ccfbf1", color: "#0d9488" }}>
            <Navigation size={15} />
          </button>



          {/* Bottom vehicle card */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 p-3.5 rounded-xl z-10"
            style={{ background: "#ffffff", border: "1px solid #ccfbf1", boxShadow: "0 4px 16px rgba(20,184,166,0.12)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#ccfbf1" }}>
              {getVehicleIcon(selectedVehicle.type, { size: 20, style: { color: "#0d9488" } })}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold" style={{ color: "#042f2e" }}>{selectedVehicle.name}</p>
              <div className="flex items-center gap-1.5 text-[12px] font-medium mt-0.5" style={{ color: "#0f766e" }}>
                <Star size={11} className="text-amber-400 fill-amber-400" /> {selectedVehicle.rating}
                <span className="w-1 h-1 rounded-full mx-0.5" style={{ background: "#99f6e4" }} />
                {selectedVehicle.eta} away
              </div>
            </div>
            <div className="text-right">
              <p className="text-[16px] font-bold" style={{ color: "#042f2e" }}>{selectedVehicle.price}</p>
              <p className="text-[11px] font-medium" style={{ color: "#0f766e" }}>Estimated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
