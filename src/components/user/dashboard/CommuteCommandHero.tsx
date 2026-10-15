"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  CarFront,
  ArrowRight,
  Home,
  Building2,
  Coffee,
  Navigation,
  Zap,
} from "lucide-react";
import { ICommuteData } from "@/hooks/user/useDashboardStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface CommuteCommandHeroProps {
  userName?: string;
  primaryCommute?: ICommuteData;
  returnCommute?: ICommuteData;
  onToggleActive?: (id: string, active: boolean) => void;
}

export default function CommuteCommandHero({
  userName = "Commuter",
  primaryCommute,
  returnCommute,
  onToggleActive,
}: CommuteCommandHeroProps) {
  const router = useRouter();
  const { confirm } = useDialog();

  const [isWfhToday, setIsWfhToday] = useState(false);
  const [timeShift, setTimeShift] = useState<number>(0);

  const hour = new Date().getHours();
  const isEvening = hour >= 16;
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeLeg =
    isEvening && returnCommute ? returnCommute : primaryCommute;
  const legLabel = isEvening ? "Return Home" : "To Office";

  const handleToggleWfh = async () => {
    if (!isWfhToday) {
      const confirmed = await confirm({
        title: "Work From Home Today?",
        message:
          "We will pause automated driver dispatch for today's scheduled commutes. Tomorrow's commute will resume automatically.",
        confirmText: "Yes, WFH Today",
        cancelText: "Keep Schedule",
        variant: "warning",
      });
      if (confirmed) {
        setIsWfhToday(true);
        if (activeLeg && onToggleActive) {
          onToggleActive(activeLeg._id, false);
        }
      }
    } else {
      setIsWfhToday(false);
      if (activeLeg && onToggleActive) {
        onToggleActive(activeLeg._id, true);
      }
    }
  };

  const handleAdjustTime = (deltaMinutes: number) => {
    setTimeShift((prev) => prev + deltaMinutes);
  };

  const displayTime = activeLeg?.time || "8:45 AM";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm">
      <div
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
        style={{
          background:
            "linear-gradient(90deg, #14b8a6, #06b6d4, #14b8a6)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-cyan-50/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:gap-10 lg:items-center">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {greeting}, {userName?.split(" ")[0] || "Commuter"}
            </h1>
            {isWfhToday ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <Coffee size={11} /> WFH Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Zap size={11} /> Auto-scheduled
              </span>
            )}
          </div>

          <p className="text-[14px] text-slate-500 mt-1 leading-relaxed">
            {isWfhToday ? (
              <span>
                You&apos;re working from home today. Rides are paused until
                tomorrow.
              </span>
            ) : activeLeg ? (
              <span>
                Your next ride departs at{" "}
                <span className="text-teal-700 font-bold text-[15px]">
                  {displayTime}
                  {timeShift !== 0 &&
                    ` (${timeShift > 0 ? `+${timeShift}m` : `${timeShift}m`})`}
                </span>{" "}
                — driver will be matched 10 mins prior.
              </span>
            ) : (
              <span>
                No active commute scheduled. Set up your recurring route to enable automated dispatches.
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={() => router.push("/user/book-ride")}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 active:scale-[0.97] transition-all"
            >
              <CarFront size={15} />
              <span>Book a Ride</span>
            </button>

            <button
              onClick={handleToggleWfh}
              type="button"
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold border transition-all active:scale-[0.97] ${
                isWfhToday
                  ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Coffee size={14} />
              <span>
                {isWfhToday ? "Resume Commute" : "WFH Today"}
              </span>
            </button>

            {!isWfhToday && (
              <div className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => handleAdjustTime(-15)}
                  className="px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-teal-700 hover:bg-white rounded-lg transition-colors"
                  title="15 mins earlier"
                >
                  −15m
                </button>
                <span className="w-px h-4 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => handleAdjustTime(15)}
                  className="px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-teal-700 hover:bg-white rounded-lg transition-colors"
                  title="15 mins later"
                >
                  +15m
                </button>
              </div>
            )}

            <Link
              href="/user/my-commute"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-teal-700 transition-colors ml-auto sm:ml-0 px-2 py-1.5"
            >
              <span>Manage Schedules</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {!isWfhToday && (
          activeLeg ? (
            <div className="w-full lg:w-72 shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Navigation size={11} className="text-teal-600" />
                  Your Next Ride
                </span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {legLabel}
                </span>
              </div>

              <div className="relative pl-5 flex flex-col gap-3.5">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-linear-to-b from-teal-400 to-teal-200" />

                <div className="relative flex items-start gap-2.5">
                  <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-teal-500 bg-white" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Home size={9} /> Pickup ·{" "}
                      <span className="text-teal-600">
                        {displayTime}
                      </span>
                    </p>
                    <p className="text-[13px] font-bold text-slate-800 truncate max-w-52">
                      {activeLeg.pickup.address}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-2.5">
                  <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center">
                    <MapPin size={8} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Building2 size={9} /> Drop-off
                    </p>
                    <p className="text-[13px] font-bold text-slate-800 truncate max-w-52">
                      {activeLeg.dropoff.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Clock size={10} /> {activeLeg.vehicleType || "Cab Premium"}
                </span>
                <Link
                  href="/user/my-commute"
                  className="text-teal-700 hover:text-teal-800 font-bold transition-colors"
                >
                  View Route →
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-72 shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <Navigation size={18} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">No Commute Configured</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Schedule your home & office route for automatic daily dispatch.
                </p>
              </div>
              <Link
                href="/user/my-commute"
                className="mt-1 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-xs transition-colors"
              >
                Set Up Commute →
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
