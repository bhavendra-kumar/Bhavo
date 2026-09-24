"use client";

import React, { useState, useEffect } from "react";
import { PhoneOff, Mic, MicOff, Volume2, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DriverCallModalProps {
  riderName?: string;
  riderPhone?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverCallModal(props: DriverCallModalProps) {
  if (!props.isOpen) return null;
  return <DriverCallModalContent {...props} />;
}

function DriverCallModalContent({
  riderName = "Aarav Sharma",
  riderPhone = "+91 98111 22334",
  onClose,
}: DriverCallModalProps) {
  const [callStatus, setCallStatus] = useState<"CONNECTING" | "CONNECTED" | "ENDED">("CONNECTING");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus("CONNECTED");
    }, 2500);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "CONNECTED") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    setCallStatus("ENDED");
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-linear-to-b from-slate-900 via-[#042f2e] to-[#022c22] rounded-3xl shadow-2xl p-7 text-white flex flex-col items-center border border-teal-500/30">
        {/* Masked Call Privacy Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold mb-6">
          <ShieldCheck size={13} />
          <span>Number Masked • Bhavo Secure Connect</span>
        </div>

        {/* Rider Avatar with pulsing ring */}
        <div className="relative mb-5">
          {callStatus === "CONNECTING" && (
            <div className="absolute inset-0 rounded-full bg-teal-400/30 animate-ping" />
          )}
          <Avatar className="w-24 h-24 rounded-full border-4 border-teal-500/60 shadow-xl relative z-10">
            <AvatarFallback className="bg-teal-700 text-white text-2xl font-black">
              {riderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Rider Name & Status */}
        <h3 className="text-xl font-extrabold text-white text-center">{riderName}</h3>
        <span className="text-xs text-teal-200/70 font-semibold mt-0.5">Passenger • {riderPhone}</span>

        {/* Call Status / Timer */}
        <div className="mt-4 mb-8">
          {callStatus === "CONNECTING" && (
            <span className="text-sm text-teal-300 animate-pulse font-medium">
              Connecting secure call...
            </span>
          )}
          {callStatus === "CONNECTED" && (
            <span className="text-xl font-mono font-black text-emerald-400">
              {formatDuration(callDuration)}
            </span>
          )}
          {callStatus === "ENDED" && (
            <span className="text-sm text-rose-400 font-bold">Call Ended</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-6">
          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted
              ? "bg-rose-500 text-white"
              : "bg-white/15 text-slate-200 hover:bg-white/25"
              }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>

          {/* Speaker toggle */}
          <button className="w-12 h-12 rounded-full bg-white/15 text-slate-200 hover:bg-white/25 flex items-center justify-center transition-colors">
            <Volume2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
