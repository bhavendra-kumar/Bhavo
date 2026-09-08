"use client";

import React, { useState } from "react";
import { Settings, Bell, Shield, Moon, Globe, LogOut, ChevronRight, HelpCircle, Trash2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/DialogProvider";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Moon },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
  { id: "support", label: "Help & Support", icon: HelpCircle },
];

const Toggle = ({ on = true }: { on?: boolean }) => (
  <div
    className="relative cursor-pointer transition-colors duration-200 shrink-0"
    style={{
      width: "36px",
      height: "20px",
      background: on ? "#14b8a6" : "#e2e8f0",
      borderRadius: "999px",
    }}
  >
    <div
      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
      style={{ left: on ? "calc(100% - 18px)" : "2px" }}
    />
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const router = useRouter();
  const { confirm } = useDialog();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "You'll need to log back in to access your account.",
      confirmText: "Sign out",
      cancelText: "Stay",
      variant: "warning",
    });
    if (!ok) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: "Delete account?",
      message: "All your rides, wallet balance and data will be permanently erased. No going back.",
      confirmText: "Delete",
      cancelText: "Keep account",
      variant: "danger",
    });
    if (!ok) return;
    // TODO: call delete account API
  };

  return (
    <div className="flex flex-col gap-6 pb-10">

      <div className="flex flex-col md:flex-row gap-5">

        {/* Side nav: horizontal scrollable on mobile, vertical sidebar on desktop */}
        <div className="w-full md:w-56 shrink-0 card p-2 flex flex-row md:flex-col gap-1.5 h-max overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 md:p-3 rounded-lg text-[13px] font-bold transition-all text-left whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  background: isActive ? "#ccfbf1" : "transparent",
                  color: isActive ? "#0d9488" : "#475569",
                  border: isActive ? "1px solid #99f6e4" : "1px solid transparent",
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
          <div className="hidden md:block my-2 h-px bg-slate-100 mx-2" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 md:p-3 rounded-lg text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-colors text-left border border-transparent hover:border-rose-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 card p-6">

          {activeTab === "general" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-bold text-[16px] text-slate-900">General Settings</h2>
              <div className="flex flex-col gap-3">
                {[
                  { icon: Globe, label: "Language", value: "English (US)" },
                  { icon: Settings, label: "Currency", value: "INR (₹)" },
                  { icon: Clock, label: "Time Format", value: "12-Hour" },
                ].map(({ icon: Icon, label, value }, i) => (
                  <button key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-slate-200 group-hover:border-teal-200">
                        <Icon size={16} className="text-slate-500 group-hover:text-teal-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-[13px]">{label}</p>
                        <p className="text-[12px] font-medium text-slate-500">{value}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-bold text-[16px] text-slate-900">Notifications</h2>
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {[
                  { label: "Ride Notifications", desc: "Driver arrival, trip start/end, receipts.", on: true },
                  { label: "AI Commute Alerts", desc: "Traffic warnings, smart schedule adjustments.", on: true },
                  { label: "Promotional Offers", desc: "Discounts, coupons, and partner offers.", on: false },
                  { label: "Email Receipts", desc: "Send a copy of trip receipts to your email.", on: true },
                ].map(({ label, desc, on }, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="pr-4">
                      <p className="font-bold text-slate-900 text-[13px]">{label}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={on} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-bold text-[16px] text-slate-900">Appearance</h2>
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                <div className="pr-4">
                  <p className="font-bold text-slate-900 text-[13px]">Dark Mode</p>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">Adjust the application theme.</p>
                </div>
                <div className="flex p-1 rounded-md bg-slate-100 border border-slate-200">
                  <button className="px-3 py-1.5 text-[11px] font-bold rounded bg-white text-slate-900 shadow-sm">Light</button>
                  <button className="px-3 py-1.5 text-[11px] font-bold rounded text-slate-500 hover:text-slate-700">Dark</button>
                  <button className="px-3 py-1.5 text-[11px] font-bold rounded text-slate-500 hover:text-slate-700">System</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-bold text-[16px] text-slate-900">Privacy & Data</h2>
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {[
                  { label: "Location Services", desc: "Allow Bhavo to access your precise location for pickups.", on: true },
                  { label: "Analytics & Telemetry", desc: "Share anonymous usage data to improve the app.", on: false },
                ].map(({ label, desc, on }, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="pr-4">
                      <p className="font-bold text-slate-900 text-[13px]">{label}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={on} />
                  </div>
                ))}
              </div>

              <div className="p-4 border border-rose-200 bg-rose-50 rounded-lg mt-2">
                <h3 className="font-bold text-rose-700 text-[13px] flex items-center gap-2 mb-1">
                  <Trash2 size={14} /> Delete Account
                </h3>
                <p className="text-[12px] text-rose-600 font-medium mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button onClick={handleDeleteAccount} className="px-4 py-2 bg-rose-600 text-white text-[12px] font-bold rounded shadow-sm hover:bg-rose-700 transition-colors">
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-bold text-[16px] text-slate-900">Help & Support</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "FAQ & Help Center", desc: "Find answers to common questions." },
                  { label: "Contact Support", desc: "Get in touch with our customer service team." },
                  { label: "Report a Safety Issue", desc: "Immediately report an incident." },
                  { label: "Terms of Service", desc: "Read our terms and conditions." },
                ].map(({ label, desc }, i) => (
                  <button key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all text-left group">
                    <div>
                      <p className="font-bold text-slate-900 text-[13px]">{label}</p>
                      <p className="text-[12px] font-medium text-slate-500">{desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
