import React from "react";
import { Zap, CalendarClock, Power, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function AutoBookingWidget() {
  return (
    <Card className="h-full border-none shadow-sm rounded-2xl">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap size={16} className="text-amber-500 fill-amber-500" />
            Auto-Booking
          </h3>
          <Switch defaultChecked />
        </div>

        {/* Commute rows */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Morning */}
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl border bg-teal-50/50 border-teal-100/50"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100/50"
            >
              <CalendarClock size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Morning Commute</p>
              <p className="text-xs text-slate-500">Mon–Fri · 8:45 AM</p>
            </div>
            <Badge 
              variant="outline" 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 border-emerald-200 text-emerald-600 bg-emerald-50 shadow-none"
            >
              Active
            </Badge>
          </div>

          {/* Evening */}
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl border bg-slate-50 border-slate-100"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-100/50"
            >
              <Power size={16} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Evening Return</p>
              <p className="text-xs text-slate-500">Mon–Fri · 6:30 PM</p>
            </div>
            <Badge 
              variant="outline" 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 border-emerald-200 text-emerald-600 bg-emerald-50 shadow-none"
            >
              Active
            </Badge>
          </div>
        </div>

        {/* Footer action */}
        <div
          className="mt-5 pt-4 border-t border-slate-100"
        >
          <Button variant="ghost" className="w-full justify-between text-teal-600 hover:text-teal-700 hover:bg-teal-50 group font-bold px-2 h-9">
            Manage Smart Rules
            <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
