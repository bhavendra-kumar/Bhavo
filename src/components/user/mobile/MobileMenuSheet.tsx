"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, MapPin, Wallet, BarChart3, LifeBuoy, User, Settings,
  LogOut, Bell, ChevronRight, ShieldCheck
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { name: "Bhavo Wallet", href: "/user/wallet", icon: Wallet, desc: "Cashback, top up & payments", color: "text-amber-500 bg-amber-50" },
  { name: "Saved Places", href: "/user/places", icon: MapPin, desc: "Home, Work & frequent spots", color: "text-teal-600 bg-teal-50" },
  { name: "Mobility Insights", href: "/user/mobility-insights", icon: BarChart3, desc: "Savings & commute patterns", color: "text-emerald-600 bg-emerald-50" },
  { name: "Notifications", href: "/user/notifications", icon: Bell, desc: "Ride alerts & inbox", color: "text-sky-600 bg-sky-50" },
  { name: "Raise a Ticket / Help", href: "/user/support", icon: LifeBuoy, desc: "24/7 Priority rider support", color: "text-rose-500 bg-rose-50" },
  { name: "My Profile", href: "/user/profile", icon: User, desc: "Personal info, SOS contacts", color: "text-purple-600 bg-purple-50" },
  { name: "Settings", href: "/user/settings", icon: Settings, desc: "Preferences, appearance & privacy", color: "text-slate-600 bg-slate-100" },
];

export default function MobileMenuSheet({ isOpen, onClose }: MobileMenuSheetProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { confirm } = useDialog();

  if (!isOpen) return null;

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out?",
      message: "You'll need to log back in to access your account.",
      confirmText: "Sign out",
      cancelText: "Stay",
      variant: "warning",
    });
    if (!ok) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onClose();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Slide-Up Bottom Sheet */}
      <div
        className="w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-300 overflow-hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 14px)" }}
      >
        {/* Drag Pill Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* User Identity Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-11 h-11 border-2 border-teal-500 shrink-0 shadow-xs">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="text-[14px] font-black bg-teal-700 text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-900 truncate leading-snug">
                {user?.name || "Bhavo Commuter"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
                  ★ {user?.rating ?? 5.0}
                </span>
                <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Rider
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mx-5 my-3 p-3.5 rounded-2xl bg-linear-to-r from-teal-900 via-teal-800 to-[#042f2e] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-teal-300 border border-white/10">
              <Wallet size={17} />
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-teal-200/90">Bhavo Wallet Balance</p>
              <p className="text-[17px] font-black text-white">
                ₹{user?.walletBalance !== undefined ? user.walletBalance : 500}
              </p>
            </div>
          </div>

          <Link
            href="/user/wallet"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-teal-400 hover:bg-teal-300 text-teal-950 text-[11.5px] font-black transition-all active:scale-95 shadow-xs"
          >
            Manage
          </Link>
        </div>

        {/* Menu Navigation Links List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-1 flex flex-col gap-0.5 divide-y divide-slate-100">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3.5 py-2.5 px-2 rounded-xl active:bg-teal-50/50 transition-colors group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-transparent ${item.color}`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 leading-snug">{item.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-active:translate-x-0.5 transition-transform" />
              </Link>
            );
          })}
        </div>

        {/* Sign Out Action Button */}
        <div className="p-3.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-4 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[13px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer border border-rose-200/80 disabled:opacity-50 shadow-xs"
          >
            <LogOut size={15} />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

