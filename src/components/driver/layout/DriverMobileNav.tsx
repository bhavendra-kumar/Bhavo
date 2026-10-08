"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Car,
  Menu,
  X,
  Power,
  ShieldAlert,
  Star,
  Map,
  LogOut,
  Award,
  LifeBuoy,
  Settings,
  Sparkles,
} from "lucide-react";
import { useDriverStore } from "@/hooks/driver/useDriverStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

export function DriverMobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { isOnline, toggleOnline, simulateIncomingRide } = useDriverStore();
  const { alert } = useDialog();

  const handleSos = () => {
    alert({
      title: "Driver Safety SOS Triggered",
      message:
        "Emergency response dispatch alerted with your live GPS location! Bhavo Safety Officer will call within 30 seconds.",
      confirmText: "Understood",
      variant: "danger",
    });
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-teal-900/10 px-3.5 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Brand & Vehicle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMenu}
          className="p-1.5 -ml-1 text-slate-700 hover:text-teal-700 active:scale-95 transition-transform"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trimmed-logo.png" alt="Bhavo" className="h-7 w-auto object-contain" />
        <span className="text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
          CAPTAIN
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Simulate Dispatch quick tap */}
        <button
          onClick={simulateIncomingRide}
          className="p-1.5 rounded-full text-indigo-600 bg-indigo-50 border border-indigo-200 active:scale-95"
          title="Simulate Dispatch"
        >
          <Sparkles size={16} />
        </button>

        {/* SOS Button */}
        <button
          onClick={handleSos}
          className="p-1.5 rounded-full text-rose-600 bg-rose-50 border border-rose-200 active:scale-95"
          title="SOS"
        >
          <ShieldAlert size={16} />
        </button>

        {/* Quick Duty Toggle */}
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition-all ${
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
              : "bg-slate-100 text-slate-600 border-slate-300"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
          />
          <span>{isOnline ? "ON" : "OFF"}</span>
        </button>
      </div>
    </header>
  );
}

export function DriverMobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { stats } = useDriverStore();

  const items = [
    { name: "Command", href: "/driver", icon: LayoutDashboard },
    { name: "Trips", href: "/driver/trips", icon: Map },
    { name: "Earnings", href: "/driver/earnings", icon: Wallet, badge: `₹${stats.todayEarnings}` },
    { name: "Vehicle", href: "/driver/vehicle", icon: Car },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              isActive ? "text-teal-700 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div className="relative">
              <Icon size={20} className={isActive ? "text-teal-600 scale-105" : "text-slate-500"} />
              {item.badge && (
                <span className="absolute -top-1.5 -right-3 text-[9px] font-black bg-teal-600 text-white px-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.name}</span>
          </Link>
        );
      })}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 font-medium"
      >
        <Menu size={20} />
        <span className="text-[10px] mt-0.5">Menu</span>
      </button>
    </nav>
  );
}

export function DriverMobileMenuSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { driverProfile, stats, isOnline, toggleOnline } = useDriverStore();
  const { confirm } = useDialog();

  if (!isOpen) return null;

  const handleLogout = async () => {
    const ok = await confirm({
      title: "End Shift & Sign Out?",
      message: "You will go offline and ride requests will stop.",
      confirmText: "Go Offline & Sign Out",
      cancelText: "Stay on Shift",
      variant: "warning",
    });
    if (!ok) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Sheet panel */}
      <div className="relative w-4/5 max-w-xs bg-[#042f2e] text-white flex flex-col h-full z-10 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-10 h-10 rounded-xl border border-teal-400/40">
              <AvatarImage src={driverProfile?.avatar || ""} />
              <AvatarFallback className="bg-teal-700 text-white font-bold">
                {driverProfile?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-extrabold text-[14px] text-white">{driverProfile?.name}</h3>
              <span className="text-[11px] text-teal-300 font-semibold flex items-center gap-1">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {stats.rating} Rating • DL-01-EV-4429
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Duty Card */}
        <div className="p-4">
          <button
            onClick={toggleOnline}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 border ${
              isOnline
                ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <Power size={16} />
            <span>{isOnline ? "You are Online (Tap to Go Offline)" : "You are Offline (Tap to Go Online)"}</span>
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 px-4 space-y-1 text-[13px] font-semibold">
          <Link
            href="/driver"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <LayoutDashboard size={18} className="text-teal-400" />
            <span>Command Center</span>
          </Link>
          <Link
            href="/driver/trips"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <Map size={18} className="text-teal-400" />
            <span>Trips History</span>
          </Link>
          <Link
            href="/driver/earnings"
            onClick={onClose}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-teal-400" />
              <span>Earnings & Payouts</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-300">₹{stats.todayEarnings}</span>
          </Link>
          <Link
            href="/driver/incentives"
            onClick={onClose}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <div className="flex items-center gap-3">
              <Award size={18} className="text-teal-400" />
              <span>Incentive Quests</span>
            </div>
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
              ₹350 Bonus
            </span>
          </Link>
          <Link
            href="/driver/vehicle"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <Car size={18} className="text-teal-400" />
            <span>Vehicle & Documents</span>
          </Link>
          <Link
            href="/driver/ratings"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <Star size={18} className="text-teal-400" />
            <span>Ratings & Compliments</span>
          </Link>
          <Link
            href="/driver/support"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <LifeBuoy size={18} className="text-teal-400" />
            <span>24/7 Driver Support & SOS</span>
          </Link>
          <Link
            href="/driver/settings"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-teal-100"
          >
            <Settings size={18} className="text-teal-400" />
            <span>Driver Settings</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-rose-500/30 transition-colors"
          >
            <LogOut size={16} />
            <span>End Shift & Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
