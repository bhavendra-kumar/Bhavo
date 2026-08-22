"use client";

import React, { useState } from "react";
import { LifeBuoy, AlertCircle, Send, Ticket } from "lucide-react";

export default function RaiseTicket() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("app_issue");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
      setSubject("");
      setDescription("");
      setCategory("app_issue");
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl">
      <div className="card p-6 flex flex-col gap-2" style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", borderColor: "#0f766e" }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
            <LifeBuoy size={20} className="text-teal-200" />
          </div>
          <h2 className="text-[20px] font-bold text-white">Support & Tickets</h2>
        </div>
        <p className="text-[13px] text-teal-50/80 font-medium max-w-xl">
          Having an issue with a ride, the app, or your account? Raise a ticket and our support team will get back to you within 24 hours.
        </p>
      </div>

      <div className="card p-6">
        <h3 className="text-[16px] font-bold tracking-tight mb-5" style={{ color: "#042f2e" }}>Raise a New Ticket</h3>
        
        {submitted ? (
          <div className="p-4 rounded-lg flex flex-col items-center justify-center py-10 gap-3" style={{ background: "#f0fdfa", border: "1px dashed #5eead4" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-100">
              <Ticket size={24} className="text-teal-600" />
            </div>
            <p className="text-[15px] font-bold text-teal-900">Ticket Submitted Successfully</p>
            <p className="text-[13px] font-medium text-teal-700 max-w-sm text-center">
              We have received your ticket and our team will review it shortly. You will be notified of any updates via email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" style={{ color: "#0f766e" }}>Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 px-3 rounded-lg border outline-none focus:border-teal-500 transition-colors text-[14px] bg-white"
                  style={{ borderColor: "#ccfbf1", color: "#042f2e" }}
                >
                  <option value="app_issue">App / Technical Issue</option>
                  <option value="ride_issue">Issue with a Ride</option>
                  <option value="payment">Billing & Payment</option>
                  <option value="driver">Driver Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" style={{ color: "#0f766e" }}>Subject</label>
                <input 
                  type="text"
                  placeholder="Briefly describe the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="h-10 px-3 rounded-lg border outline-none focus:border-teal-500 transition-colors text-[14px]"
                  style={{ borderColor: "#ccfbf1", color: "#042f2e" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "#0f766e" }}>Description</label>
              <textarea 
                placeholder="Provide more details so we can help you faster..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="p-3 rounded-lg border outline-none focus:border-teal-500 transition-colors text-[14px] resize-none"
                style={{ borderColor: "#ccfbf1", color: "#042f2e" }}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <p className="text-[12px] font-medium text-amber-800">
                For emergency or safety issues during a ride, please use the SOS button in the live tracking screen instead.
              </p>
            </div>

            <div className="flex justify-end mt-2">
              <button 
                type="submit"
                disabled={!subject || !description}
                className="h-10 px-6 rounded-lg text-[13px] font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: "#0d9488" }}
              >
                Submit Ticket <Send size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
