"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Phone, Star, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DriverChatModalProps {
  rideId: string;
  driverName?: string;
  driverRating?: number;
  vehicleNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onCallDriver?: () => void;
}

interface Message {
  sender: "rider" | "driver";
  text: string;
  timestamp: string | Date;
}

const QUICK_PROMPTS = [
  "I'm at the pickup point",
  "Please turn on AC",
  "How long will you take?",
  "Waiting near main gate",
];

export default function DriverChatModal({
  rideId,
  driverName = "Rajesh Kumar",
  driverRating = 4.9,
  vehicleNumber = "DL-01-AB-1234",
  isOpen,
  onClose,
  onCallDriver,
}: DriverChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !rideId) return;

    let active = true;
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/user/rides/${rideId}/messages`);
        if (res.ok && active) {
          const json = await res.json();
          setMessages(json.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch messages:", e);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, rideId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !rideId) return;

    setInputText("");
    const optimisticMsg: Message = {
      sender: "rider",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      setLoading(true);
      const res = await fetch(`/api/user/rides/${rideId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/user/rides/${rideId}/messages`);
          if (res.ok) {
            const json = await res.json();
            setMessages(json.data || []);
          }
        } catch {}
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md h-140 shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-teal-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-teal-300">
                <AvatarFallback className="bg-teal-600 text-white font-bold">
                  {driverName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-teal-800" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[15px] leading-none">{driverName}</h3>
                <span className="flex items-center text-[11px] font-semibold text-amber-300 bg-white/10 px-1.5 py-0.5 rounded">
                  <Star size={10} className="fill-amber-300 mr-0.5" />
                  {driverRating}
                </span>
              </div>
              <p className="text-[12px] text-teal-200 mt-1 font-mono">
                {vehicleNumber} • Driver
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onCallDriver && (
              <button
                onClick={onCallDriver}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Call Driver"
              >
                <Phone size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Safety banner */}
        <div className="bg-teal-50 px-3.5 py-1.5 border-b border-teal-100 flex items-center justify-between text-[11px] text-teal-800 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-teal-600" /> End-to-end Bhavo Secure Chat
          </span>
          <span className="text-slate-400">Ride #{rideId.slice(-6).toUpperCase()}</span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-[13px] my-auto">
              Send a quick message to your driver...
            </div>
          ) : (
            messages.map((m, i) => {
              const isRider = m.sender === "rider";
              const timeFormatted = new Date(m.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={i}
                  className={`flex flex-col max-w-[80%] ${
                    isRider ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                      isRider
                        ? "bg-teal-600 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {timeFormatted}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-colors flex items-center gap-1"
            >
              <Sparkles size={9} className="text-teal-600" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a message to driver..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all border border-slate-200"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-teal-600/20"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
