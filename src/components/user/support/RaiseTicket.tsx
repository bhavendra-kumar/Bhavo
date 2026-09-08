"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy, AlertCircle, Send, Ticket, Clock, CheckCircle2,
  MessageSquare, ShieldCheck, Plus
} from "lucide-react";

interface TicketItem {
  _id: string;
  ticketId: string;
  category: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: string;
  resolutionNotes?: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: "app_issue", label: "App & Technical Issue" },
  { value: "ride_issue", label: "Ride Experience & Delay" },
  { value: "payment", label: "Payment, Billing & Wallet" },
  { value: "driver", label: "Driver Behavior or Route Concern" },
  { value: "other", label: "General Feedback & Inquiry" },
];

export default function RaiseTicket() {
  const [activeTab, setActiveTab] = useState<"raise" | "list">("raise");
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("app_issue");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<TicketItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTickets = () => {
    fetch("/api/user/tickets")
      .then((res) => res.json())
      .then((json) => {
        setTickets(json.data || []);
        setLoadingTickets(false);
      })
      .catch((e) => {
        console.error("Failed to fetch tickets:", e);
        setLoadingTickets(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/user/tickets")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          setTickets(json.data || []);
          setLoadingTickets(false);
        }
      })
      .catch((e) => {
        console.error("Failed to fetch tickets:", e);
        if (!ignore) setLoadingTickets(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await fetch("/api/user/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to submit ticket");
        setSubmitting(false);
        return;
      }

      setSubmittedTicket(data.data);
      setSubject("");
      setDescription("");
      setCategory("app_issue");
      fetchTickets();
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={10} /> Open
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> Reviewing
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-4xl">
      {/* Banner */}
      <div
        className="card p-6 flex flex-col gap-2 relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", borderColor: "#0f766e" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10">
              <LifeBuoy size={22} className="text-teal-200" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold">24x7 Priority Support</h2>
              <p className="text-[12px] text-teal-100">
                Direct ticketing pipeline to Bhavo Customer Safety & Operations team.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-teal-100">
            <ShieldCheck size={14} className="text-teal-300" /> Avg Response Time: &lt; 15 mins
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 w-full sm:w-max overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab("raise");
            setSubmittedTicket(null);
          }}
          className="px-4 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          style={{
            background: activeTab === "raise" ? "#ffffff" : "transparent",
            color: activeTab === "raise" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "raise" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <Plus size={14} /> Raise a Ticket
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className="px-4 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          style={{
            background: activeTab === "list" ? "#ffffff" : "transparent",
            color: activeTab === "list" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <Ticket size={14} /> My Tickets ({tickets.length})
        </button>
      </div>

      {/* Tab 1: Raise Ticket */}
      {activeTab === "raise" && (
        <div className="card p-6">
          <h3 className="text-[16px] font-bold tracking-tight mb-5 text-slate-900">
            Submit Support Inquiry
          </h3>

          {submittedTicket ? (
            <div className="p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-teal-50 border border-teal-200">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-teal-100 text-teal-700">
                <Ticket size={28} />
              </div>
              <p className="text-[18px] font-black text-teal-950">
                Ticket Created: #{submittedTicket.ticketId}
              </p>
              <p className="text-[13px] font-medium text-teal-800 max-w-md">
                We have registered your ticket regarding <strong>&quot;{submittedTicket.subject}&quot;</strong>. Our resolution team will review your account and notify you shortly.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-teal-300 text-teal-800 text-[13px] font-bold hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  Submit Another Ticket
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  View My Tickets
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold uppercase text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 outline-none focus:border-teal-500 transition-colors text-[13px] bg-white text-slate-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold uppercase text-slate-700">Urgency Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 outline-none focus:border-teal-500 transition-colors text-[13px] bg-white text-slate-900"
                  >
                    <option value="LOW">Low - General Question</option>
                    <option value="MEDIUM">Medium - Ride/Account Query</option>
                    <option value="HIGH">High - Urgent Issue</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase text-slate-700">Subject</label>
                <input
                  type="text"
                  placeholder="Summary of your concern"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="h-10 px-3.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500 transition-colors text-[14px] text-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold uppercase text-slate-700">Description</label>
                <textarea
                  placeholder="Explain what happened in detail so we can address your issue quickly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="p-3.5 rounded-xl border border-slate-200 outline-none focus:border-teal-500 transition-colors text-[13px] resize-none text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <p className="text-[12px] font-medium text-amber-900 leading-relaxed">
                  For active emergency or medical assistance during an ongoing ride, please trigger the SOS Safety button directly from the live tracking screen.
                </p>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!subject || !description || submitting}
                  className="h-11 px-6 rounded-xl text-[14px] font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer shadow-md shadow-teal-600/20"
                  style={{ background: "#0d9488" }}
                >
                  {submitting ? "Submitting Ticket..." : "Submit Ticket"}{" "}
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: My Tickets List */}
      {activeTab === "list" && (
        <div className="flex flex-col gap-3">
          {loadingTickets ? (
            <div className="card p-12 text-center text-slate-500 text-sm">
              Loading your tickets from database...
            </div>
          ) : tickets.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-sm">
              No tickets found. Need assistance? Switch to the &quot;Raise a Ticket&quot; tab.
            </div>
          ) : (
            tickets.map((t) => {
              const formattedDate = new Date(t.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={t._id} className="card p-5 flex flex-col gap-3 border border-slate-200 hover:border-teal-200 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          #{t.ticketId}
                        </span>
                        <h4 className="font-bold text-[15px] text-slate-900">{t.subject}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="capitalize">{t.category.replace("_", " ")}</span>
                      </p>
                    </div>

                    <div className="shrink-0">{getStatusBadge(t.status)}</div>
                  </div>

                  <p className="text-[13px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {t.description}
                  </p>

                  {t.resolutionNotes && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-[12px] text-teal-900">
                      <MessageSquare size={14} className="text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Bhavo Response: </span>
                        <span>{t.resolutionNotes}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
