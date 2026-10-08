"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Phone, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DriverChatModalProps {
  rideId?: string;
  riderName?: string;
  riderRating?: number;
  isOpen: boolean;
  onClose: () => void;
  onCallRider?: () => void;
}

interface Message {
  sender: "rider" | "driver";
  text: string;
  timestamp: string | Date;
}

const DRIVER_QUICK_RESPONSES = [
  "I have arrived at the pickup spot.",
  "Arriving in 2 minutes, hazards are ON.",
  "Stuck in brief traffic, taking fastest lane.",
  "Please come to the main security gate.",
];

export default function DriverChatModal({
  rideId,
  riderName = "Aarav Sharma",
  riderRating = 4.9,
  isOpen,
  onClose,
  onCallRider,
}: DriverChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "rider",
      text: "Hi! I am waiting near the main gate.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync messages from backend
  useEffect(() => {
    if (!isOpen || !rideId) return;

    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/driver/rides/${rideId}/messages`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setMessages(json.data);
          }
        }
      } catch {}
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2500);
    return () => clearInterval(interval);
  }, [isOpen, rideId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: Message = {
      sender: "driver",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    if (rideId) {
      try {
        const res = await fetch(`/api/driver/rides/${rideId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setMessages(json.data);
          }
        }
      } catch {}
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ zIndex: 9999 }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-teal-500/20 flex flex-col h-140">
        {/* Header */}
        <div className="px-5 py-4 bg-linear-to-r from-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 rounded-full border border-teal-400">
              <AvatarFallback className="bg-teal-700 text-white font-bold text-sm">
                {riderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-extrabold text-[15px] leading-tight text-white">
                {riderName}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-teal-200">
                <span className="flex items-center text-amber-300 font-bold">
                  <Star size={11} className="fill-amber-300 mr-0.5" />
                  {riderRating}
                </span>
                <span>• Passenger</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCallRider && (
              <button
                onClick={onCallRider}
                className="w-8 h-8 rounded-full bg-teal-500/30 hover:bg-teal-500/50 flex items-center justify-center text-teal-200 transition-colors"
                title="Call Passenger"
              >
                <Phone size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((m, idx) => {
            const isDriver = m.sender === "driver";
            return (
              <div
                key={idx}
                className={`flex flex-col ${isDriver ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                    isDriver
                      ? "bg-teal-700 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Driver Response Chips */}
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200/70 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {DRIVER_QUICK_RESPONSES.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSend(chip)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 text-teal-800 border border-teal-200/70 shrink-0 transition-colors active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Text Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type message to rider..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] focus:outline-hidden focus:border-teal-500 focus:bg-white text-slate-800"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-xs"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
