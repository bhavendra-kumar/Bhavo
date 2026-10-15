"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Plus,
  Coffee,
  Building2,
  Users2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { ICommuteData } from "@/hooks/user/useDashboardStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface WeeklyCommutePlannerProps {
  commutes: ICommuteData[];
  onToggleCommute?: (id: string, active: boolean) => void;
}

interface DaySchedule {
  dayName: string;
  dayLetter: string;
  fullDay: string;
  isToday: boolean;
  status: "office" | "wfh" | "off";
  morningTime?: string;
  eveningTime?: string;
  vehicle?: string;
  carpoolColleagues?: number;
}

const DAYS_OF_WEEK = [
  { short: "Mon", letter: "M", full: "Monday" },
  { short: "Tue", letter: "T", full: "Tuesday" },
  { short: "Wed", letter: "W", full: "Wednesday" },
  { short: "Thu", letter: "T", full: "Thursday" },
  { short: "Fri", letter: "F", full: "Friday" },
  { short: "Sat", letter: "S", full: "Saturday" },
  { short: "Sun", letter: "S", full: "Sunday" },
];

export default function WeeklyCommutePlanner({
  commutes,
  onToggleCommute,
}: WeeklyCommutePlannerProps) {
  const router = useRouter();
  const { confirm } = useDialog();

  const morningCommute =
    commutes.find((c) => c.title.toLowerCase().includes("morning")) ||
    commutes[0];
  const eveningCommute =
    commutes.find(
      (c) =>
        c.title.toLowerCase().includes("evening") ||
        c.title.toLowerCase().includes("return")
    ) || commutes[1];

  const currentDayIndex = new Date().getDay();
  const todayShort =
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][currentDayIndex];

  const [dayOverrides, setDayOverrides] = useState<
    Record<string, "office" | "wfh">
  >({});
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "wfh" | "office";
  } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(todayShort);

  const handleToggleDay = async (
    dayShort: string,
    currentStatus: "office" | "wfh" | "off"
  ) => {
    if (currentStatus === "off") {
      const addWeekend = await confirm({
        title: `Schedule Commute for ${dayShort}?`,
        message:
          "Would you like to configure automated rides for weekend office visits or client shifts?",
        confirmText: "Setup Commute",
        cancelText: "Cancel",
      });
      if (addWeekend) {
        router.push("/user/my-commute");
      }
      return;
    }

    const nextStatus = currentStatus === "office" ? "wfh" : "office";
    setDayOverrides((prev) => ({ ...prev, [dayShort]: nextStatus }));

    if (dayShort === todayShort && morningCommute && onToggleCommute) {
      onToggleCommute(morningCommute._id, nextStatus === "office");
    }

    setFeedbackMsg({
      text:
        nextStatus === "wfh"
          ? `${dayShort} → WFH — driver dispatch paused for that day.`
          : `${dayShort} → Office — driver will arrive on schedule.`,
      type: nextStatus,
    });

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const weeklySchedule: DaySchedule[] = DAYS_OF_WEEK.map((d) => {
    const isWeekend = d.short === "Sat" || d.short === "Sun";
    const defaultStatus: "office" | "wfh" | "off" = isWeekend
      ? "off"
      : "office";
    const status = dayOverrides[d.short] || defaultStatus;

    return {
      dayName: d.short,
      dayLetter: d.letter,
      fullDay: d.full,
      isToday: d.short === todayShort,
      status,
      morningTime: morningCommute?.time || "8:45 AM",
      eveningTime: eveningCommute?.time || "6:30 PM",
      vehicle: morningCommute?.vehicleType || "Cab Premium",
      carpoolColleagues: d.short === "Tue" || d.short === "Thu" ? 2 : 0,
    };
  });

  const selectedDayData = weeklySchedule.find(
    (d) => d.dayName === selectedDay
  );

  return (
    <div className="card p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 bg-white shadow-xs rounded-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <CalendarDays size={15} />
          </div>
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
            Weekly Schedule
          </h2>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
            Click to toggle
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/user/my-commute"
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New Commute</span>
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`px-4 py-2 rounded-xl text-[12px] font-semibold flex items-center justify-between transition-all ${
            feedbackMsg.type === "wfh"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-teal-50 text-teal-800 border border-teal-200"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] font-bold underline opacity-70 hover:opacity-100 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2">
        {weeklySchedule.map((day) => {
          const isSelected = day.dayName === selectedDay;
          const isOffice = day.status === "office";
          const isWfh = day.status === "wfh";
          const isOff = day.status === "off";

          return (
            <button
              key={day.dayName}
              onClick={() => {
                setSelectedDay(day.dayName);
              }}
              onDoubleClick={() =>
                handleToggleDay(day.dayName, day.status)
              }
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 sm:py-3 rounded-xl border transition-all cursor-pointer select-none group ${
                isSelected
                  ? day.isToday
                    ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "bg-slate-900 border-slate-900 text-white shadow-md"
                  : day.isToday
                  ? "bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100"
                  : isOff
                  ? "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-100"
                  : isWfh
                  ? "bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-100/60"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
              title={`${day.fullDay} — ${day.status === "office" ? "Office" : day.status === "wfh" ? "WFH" : "Off"} · Double-click to toggle`}
            >
              <span
                className={`text-[11px] font-bold ${
                  isSelected ? "text-white/70" : "text-inherit opacity-60"
                }`}
              >
                {day.dayName}
              </span>

              <div className="flex items-center justify-center">
                {isOffice && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-white" : "bg-teal-500"
                    }`}
                  />
                )}
                {isWfh && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-white" : "bg-amber-400"
                    }`}
                  />
                )}
                {isOff && (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>

              {day.isToday && !isSelected && (
                <span className="text-[8px] font-black uppercase tracking-widest text-teal-600">
                  Today
                </span>
              )}
              {day.isToday && isSelected && (
                <span className="text-[8px] font-black uppercase tracking-widest text-white/80">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDayData && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            selectedDayData.status === "office"
              ? "bg-slate-50 border-slate-200"
              : selectedDayData.status === "wfh"
              ? "bg-amber-50/40 border-amber-200"
              : "bg-slate-50/50 border-slate-100"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedDayData.status === "office"
                    ? "bg-teal-100 text-teal-700"
                    : selectedDayData.status === "wfh"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {selectedDayData.status === "office" ? (
                  <Building2 size={18} />
                ) : selectedDayData.status === "wfh" ? (
                  <Coffee size={18} />
                ) : (
                  <CalendarDays size={18} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-slate-900">
                    {selectedDayData.fullDay}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedDayData.status === "office"
                        ? "bg-teal-100 text-teal-700"
                        : selectedDayData.status === "wfh"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {selectedDayData.status === "office"
                      ? "Office"
                      : selectedDayData.status === "wfh"
                      ? "WFH"
                      : "Off"}
                  </span>
                  {selectedDayData.carpoolColleagues &&
                    selectedDayData.carpoolColleagues > 0 &&
                    selectedDayData.status === "office" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        <Users2 size={10} />{" "}
                        {selectedDayData.carpoolColleagues} colleagues
                      </span>
                    )}
                </div>

                {selectedDayData.status === "office" && (
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-teal-600" />
                      {selectedDayData.morningTime} → HQ
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      {selectedDayData.eveningTime} → Home
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400">
                      {selectedDayData.vehicle}
                    </span>
                  </div>
                )}

                {selectedDayData.status === "wfh" && (
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Driver dispatch paused — click to restore
                  </p>
                )}

                {selectedDayData.status === "off" && (
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    No commute scheduled
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                handleToggleDay(
                  selectedDayData.dayName,
                  selectedDayData.status
                )
              }
              className={`shrink-0 h-9 px-4 rounded-xl text-[12px] font-bold border transition-all active:scale-[0.97] ${
                selectedDayData.status === "office"
                  ? "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700"
                  : selectedDayData.status === "wfh"
                  ? "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                  : "bg-white text-slate-500 border-slate-200 hover:border-teal-300"
              }`}
            >
              {selectedDayData.status === "office"
                ? "Switch to WFH"
                : selectedDayData.status === "wfh"
                ? "Switch to Office"
                : "Add Commute"}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px]">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Zap size={13} className="text-teal-600 shrink-0" />
          <span>
            <strong className="text-slate-700">Pre-matched drivers</strong>{" "}
            — zero surge on recurring routes
          </span>
        </div>
        <Link
          href="/user/my-commute"
          className="text-teal-700 hover:text-teal-800 font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0"
        >
          Rules <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
