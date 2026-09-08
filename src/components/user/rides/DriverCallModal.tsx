"use client";

import React, { useState, useEffect } from "react";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Star, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DriverCallModalProps {
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehicleModel?: string;
  vehicleNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverCallModal({
  driverName = "Rajesh Kumar",
  driverPhone = "+91 98765 43210",
  driverRating = 4.9,
  vehicleModel = "White Swift Dzire",
  vehicleNumber = "DL-01-AB-1234",
  isOpen,
  onClose,
}: DriverCallModalProps) {
  const [callState, setCallState] = useState<"calling" | "ringing" | "connected">("calling");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Progression: calling -> ringing (1.5s) -> connected (3.5s)
    const t1 = setTimeout(() => setCallState("ringing"), 1500);
    const t2 = setTimeout(() => setCallState("connected"), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  const handleEndCall = () => {
    setCallState("calling");
    setDuration(0);
    onClose();
  };

  useEffect(() => {
    if (callState !== "connected") return;

    const timer = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center p-6 text-center relative">
        {/* Top security badge */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-950/70 border border-teal-800/60 px-3 py-1 rounded-full mb-6">
          <ShieldCheck size={12} /> Bhavo Number Masking Active
        </div>

        {/* Driver Avatar & Wave Animation */}
        <div className="relative my-4 flex items-center justify-center">
          {callState === "connected" && (
            <div className="absolute -inset-4 rounded-full bg-teal-500/20 animate-ping opacity-75" />
          )}
          {callState === "ringing" && (
            <div className="absolute -inset-2 rounded-full bg-teal-500/10 animate-pulse" />
          )}
          <Avatar className="w-24 h-24 border-4 border-teal-500 shadow-xl relative z-10">
            <AvatarFallback className="bg-teal-700 text-white font-bold text-3xl">
              {driverName[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Driver Name & Info */}
        <h2 className="text-xl font-black tracking-tight mt-2 text-white">{driverName}</h2>
        <div className="flex items-center gap-2 mt-1 text-slate-400 text-[13px]">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Star size={12} className="fill-amber-400" /> {driverRating}
          </span>
          <span>•</span>
          <span>{vehicleModel}</span>
        </div>
        <span className="mt-1 text-[12px] font-mono text-slate-500">{vehicleNumber}</span>

        {/* Status / Duration */}
        <div className="my-6">
          {callState === "calling" && (
            <p className="text-teal-400 font-medium text-sm animate-pulse">
              Calling driver via secure VoIP...
            </p>
          )}
          {callState === "ringing" && (
            <p className="text-teal-300 font-medium text-sm animate-bounce">
              Ringing...
            </p>
          )}
          {callState === "connected" && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-mono font-bold tracking-widest text-white">
                {formatTimer(duration)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
                Connected · HD Voice
              </span>

              {/* Simulated Audio Bars */}
              <div className="flex items-center gap-1 mt-2 h-4">
                {[4, 12, 8, 16, 10, 6, 14, 8].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-teal-400 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-6 w-full mt-4 max-w-60">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all"
            title="End Call"
          >
            <PhoneOff size={22} />
          </button>

          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isSpeaker
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            {isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-6 font-mono">
          Dialing {driverPhone.slice(0, 7)} ••••
        </p>
      </div>
    </div>
  );
}
