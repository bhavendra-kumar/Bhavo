import React from "react";
import { Zap, CalendarClock, Power, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AutoBookingWidget() {
  return (
    <div className="premium-card rounded-2xl h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-100 opacity-50" />
      
      <div className="p-6 flex-1 flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Zap size={16} className="text-teal-600 fill-teal-600/20" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Auto-Booking</h3>
          </div>
          <Switch defaultChecked className="data-[state=checked]:bg-teal-500" />
        </div>

        {/* Schedule Items */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Morning */}
          <div className="p-4 rounded-xl border border-slate-100 bg-white flex items-center gap-4 transition-all hover:border-teal-100 hover:bg-teal-50/30">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <CalendarClock size={16} className="text-slate-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[14px] font-bold text-slate-900">Morning Commute</p>
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              <p className="text-[12px] font-medium text-slate-500">Mon–Fri · 8:45 AM</p>
            </div>
          </div>

          {/* Evening */}
          <div className="p-4 rounded-xl border border-slate-100 bg-white flex items-center gap-4 transition-all hover:border-teal-100 hover:bg-teal-50/30">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
              <Power size={16} className="text-slate-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[14px] font-bold text-slate-900">Evening Return</p>
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              <p className="text-[12px] font-medium text-slate-500">Mon–Fri · 6:30 PM</p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <button className="mt-6 flex items-center justify-between w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors group/btn border border-slate-100">
          <span className="text-[13px] font-bold">Manage Smart Rules</span>
          <ChevronRight size={16} className="text-slate-400 group-hover/btn:text-teal-950 transition-colors" />
        </button>
      </div>
    </div>
  );
}
