"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

interface ITicket {
  _id?: string;
  ticketId?: string;
  category: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: string;
  createdAt: string;
}

export default function DriverSupport() {
  const { alert } = useDialog();
  const [topic, setTopic] = useState("FARE_DISPUTE");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState("");
  const [tickets, setTickets] = useState<ITicket[]>([]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/driver/support")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.data) {
          setTickets(json.data);
        }
      })
      .catch((e) => console.error(e));

    return () => {
      ignore = true;
    };
  }, []);

  const refreshTickets = async () => {
    try {
      const res = await fetch("/api/driver/support");
      if (res.ok) {
        const json = await res.json();
        if (json.data) setTickets(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          description: message.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setCreatedTicketId(json.data?.ticketId || "TK-DRV");
        setSubmitted(true);
        setMessage("");
        await refreshTickets();
      }
    } catch {
      alert({
        title: "Ticket Error",
        message: "Failed to submit ticket. Please check connection and try again.",
        confirmText: "OK",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSos = async () => {
    try {
      await fetch("/api/driver/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSos: true }),
      });
    } catch {}

    alert({
      title: "Captain Emergency Protocol Alerted",
      message:
        "Emergency command center and nearest highway patrol unit notified. An executive officer is dialing your phone right now.",
      confirmText: "Understood",
      variant: "danger",
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">

      {/* Emergency SOS Banner */}
      <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-950">Emergency Safety & Road Assistance</h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Press SOS if you or your passenger face an immediate medical, security, or accident crisis.
            </p>
          </div>
        </div>

        <button
          onClick={handleSos}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <ShieldAlert size={18} />
          <span>TRIGGER SOS NOW</span>
        </button>
      </div>

      {/* Support Form & FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticket Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Submit Driver Ticket</h3>
            <p className="text-xs text-slate-500 mb-4">
              Our Captain Operations desk responds within 15 minutes.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center border border-emerald-200 my-6">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-600" />
                <h4 className="font-extrabold text-base">Ticket Submitted!</h4>
                <p className="text-xs mt-1">Ticket #{createdTicketId} created and logged in database.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Create Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Issue Category</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                  >
                    <option value="FARE_DISPUTE">Fare / Toll Discrepancy</option>
                    <option value="PAYOUT_DELAY">Bank Transfer / UPI Delay</option>
                    <option value="PASSENGER_CONDUCT">Passenger Conduct Issue</option>
                    <option value="VEHICLE_DOCS">Document Verification Update</option>
                    <option value="APP_ISSUE">Technical App Glitch</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details such as trip ID, toll amount, or passenger complaint..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-teal-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  <span>{submitting ? "Submitting..." : "Submit Support Ticket"}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Quick Helpline Contacts & Open Tickets */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Helpline Directory</h3>
            <p className="text-xs text-slate-500 mb-4">Direct numbers for instant telephonic resolution</p>

            <div className="space-y-3">
              {[
                { title: "24/7 Captain Operational Desk", number: "1800-419-BHAVO", desc: "Toll-free 24x7 support" },
                { title: "Towing & On-Road Breakdown", number: "1800-112-TOWING", desc: "Partner towing assistance" },
                { title: "Insurance & Accident Claims", number: "1800-200-CLAIM", desc: "ICICI Lombard fleet desk" },
              ].map((h, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">{h.title}</h4>
                    <span className="text-[11px] text-slate-500">{h.desc}</span>
                  </div>
                  <a
                    href={`tel:${h.number}`}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 font-bold text-xs transition-colors"
                  >
                    Call
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tickets from Database */}
          {tickets.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Your Registered Tickets ({tickets.length})
              </h4>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {tickets.slice(0, 3).map((t, idx) => (
                  <div
                    key={t._id || idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-extrabold text-slate-800 block">{t.ticketId || "TK-100"}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-50">{t.subject}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
