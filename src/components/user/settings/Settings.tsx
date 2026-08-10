"use client";

import React, { useState } from "react";
import { Settings, Bell, Shield, Moon, Globe, LogOut, ChevronRight } from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Moon },
];

const Toggle = ({ on = true }: { on?: boolean }) => (
  <div
    className="relative cursor-pointer transition-colors duration-200"
    style={{
      width: "44px",
      height: "24px",
      background: on ? "linear-gradient(135deg, #0d9488, #059669)" : "#e2e8f0",
      borderRadius: "999px",
      boxShadow: on ? "0 0 10px rgba(13,148,136,0.35)" : "none",
      flexShrink: 0,
    }}
  >
    <div
      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
      style={{ left: on ? "calc(100% - 22px)" : "2px" }}
    />
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0d9488, #059669)", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
          >
            <Settings size={18} className="text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 mt-1.5 text-sm">Manage your app preferences and account.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">

        {/* Side nav */}
        <div
          className="w-full md:w-56 shrink-0 bg-white rounded-2xl p-2 flex flex-col gap-1 h-max"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06)" }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all text-left"
                style={{
                  background: isActive ? "#0f172a" : "transparent",
                  color: isActive ? "white" : "#64748b",
                  boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
          <div style={{ height: "1px", background: "rgba(15,23,42,0.06)", margin: "4px 0" }} />
          <button className="flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors text-left">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 bg-white rounded-2xl p-6"
          style={{ border: "1px solid rgba(15,23,42,0.07)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}
        >

          {activeTab === "general" && (
            <div className="flex flex-col gap-5">
              <h2 className="font-bold text-lg text-slate-900">General Settings</h2>
              {[
                { icon: Globe, label: "Language", value: "English (US)" },
                { icon: Settings, label: "Region", value: "India 🇮🇳" },
              ].map(({ icon: Icon, label, value }) => (
                <button
                  key={label}
                  className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-slate-50 text-left"
                  style={{ border: "1px solid rgba(15,23,42,0.07)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#f1f5f9" }}
                    >
                      <Icon size={17} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{label}</p>
                      <p className="text-xs text-slate-500">{value}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-5">
              <h2 className="font-bold text-lg text-slate-900">Notifications</h2>
              {[
                { label: "Push Notifications", desc: "Receive alerts on your device.", on: true },
                { label: "Email Receipts", desc: "Get ride receipts in your inbox.", on: true },
                { label: "AI Suggestions", desc: "Personalized commute insights.", on: true },
                { label: "Marketing Offers", desc: "Deals and promotions.", on: false },
              ].map(({ label, desc, on }) => (
                <div
                  key={label}
                  className="flex items-center justify-between pb-5 last:pb-0 last:border-0"
                  style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle on={on} />
                </div>
              ))}
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="flex flex-col gap-5">
              <h2 className="font-bold text-lg text-slate-900">Appearance</h2>
              <div
                className="flex items-center justify-between pb-5"
                style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">Dark Mode</p>
                  <p className="text-xs text-slate-500 mt-0.5">Toggle dark theme for the app.</p>
                </div>
                <Toggle on={false} />
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="flex flex-col gap-5">
              <h2 className="font-bold text-lg text-slate-900">Privacy & Security</h2>
              <button
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-slate-50 text-left"
                style={{ border: "1px solid rgba(15,23,42,0.07)" }}
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">Change Password</p>
                  <p className="text-xs text-slate-500">Update your account password</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
              <button
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-rose-50 text-left"
                style={{ border: "1px solid rgba(225,29,72,0.15)", background: "rgba(225,29,72,0.02)" }}
              >
                <div>
                  <p className="font-bold text-rose-600 text-sm">Delete Account</p>
                  <p className="text-xs text-rose-400">Permanently delete your account and data</p>
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
