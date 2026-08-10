import React from "react";
import { MapPin, Navigation, CarFront, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UpcomingRideWidget() {
  return (
    <Card className="h-full border-none shadow-sm rounded-2xl">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-900">Upcoming Ride</h3>
          <Badge 
            variant="secondary" 
            className="text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-none px-3 py-1 rounded-full border-none"
          >
            In 45 mins
          </Badge>
        </div>

        {/* Route */}
        <div className="flex-1 relative flex flex-col justify-center">
          {/* Connection line */}
          <div
            className="absolute left-3.75 top-5 bottom-5 w-px"
            style={{ background: "linear-gradient(to bottom, #e2e8f0, #e2e8f0)" }}
          />

          {/* Pickup */}
          <div className="relative flex items-start gap-4 mb-7">
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "#f8fafc",
                border: "2px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
            <div className="pt-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Clock size={10} /> Pickup · 8:45 AM
              </p>
              <p className="text-sm font-semibold text-slate-900">123 Tech Park Avenue</p>
              <p className="text-xs text-slate-500">Block B, Main Gate</p>
            </div>
          </div>

          {/* Dropoff */}
          <div className="relative flex items-start gap-4">
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "rgba(13,148,136,0.08)",
                border: "2px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <MapPin size={14} className="text-teal-600" />
            </div>
            <div className="pt-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Drop-off · ~9:30 AM
              </p>
              <p className="text-sm font-semibold text-slate-900">Bhavo Headquarters</p>
              <p className="text-xs text-slate-500">Sector 44, Cyber City</p>
            </div>
          </div>
        </div>

        {/* Driver row */}
        <div
          className="mt-5 pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 bg-slate-100">
              <AvatarFallback className="bg-slate-100">
                <CarFront size={18} className="text-slate-600" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-slate-900">Premium Sedan</p>
              <p className="text-xs text-slate-500">Rajesh K. · <span className="text-amber-500">★ 4.9</span></p>
            </div>
          </div>
          <Button
            size="icon"
            className="w-9 h-9 rounded-full transition-all hover:scale-110 shadow-md bg-linear-to-br from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 border-none"
          >
            <Navigation size={15} className="text-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
