import React from "react";
import { Navigation, CarFront, Clock, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UpcomingRideWidget() {
  return (
    <div className="premium-card rounded-2xl h-full flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[16px] font-bold text-teal-950 tracking-tight">Upcoming Ride</h3>
          <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase">
            In 45 Mins
          </div>
        </div>

        {/* Timeline */}
        <div className="relative flex-1 flex flex-col justify-center ml-2">
          {/* Vertical Line */}
          <div className="absolute left-2.25 top-2 bottom-6 w-0.5 bg-slate-100" />

          {/* Pickup */}
          <div className="relative flex gap-5 mb-8">
            <div className="relative z-10 w-5 h-5 rounded-full bg-white border-[3px] border-teal-950 shadow-sm shrink-0" />
            <div className="-mt-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Clock size={12} /> 8:45 AM
              </p>
              <p className="text-[15px] font-bold text-teal-950">123 Tech Park Avenue</p>
              <p className="text-[13px] text-slate-500 mt-0.5">Block B, Main Gate</p>
            </div>
          </div>

          {/* Dropoff */}
          <div className="relative flex gap-5">
            <div className="relative z-10 w-5 h-5 rounded-full bg-teal-500 border-[3px] border-teal-100 shadow-sm shrink-0" />
            <div className="-mt-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                ~9:30 AM
              </p>
              <p className="text-[15px] font-bold text-teal-950">Bhavo Headquarters</p>
              <p className="text-[13px] text-slate-500 mt-0.5">Sector 44, Cyber City</p>
            </div>
          </div>
        </div>

        {/* Footer / Driver */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-slate-200">
              <AvatarFallback className="bg-slate-50 text-slate-400">
                <CarFront size={18} />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-teal-950">Premium Sedan</span>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                Rajesh K. <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5" /> <Star size={10} className="text-amber-400 fill-amber-400" /> 4.9
              </div>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full bg-teal-700 hover:bg-teal-600 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md">
            <Navigation size={14} className="ml-px" />
          </button>
        </div>
      </div>
    </div>
  );
}
