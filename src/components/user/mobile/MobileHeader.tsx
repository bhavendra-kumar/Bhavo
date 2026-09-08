"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, ChevronLeft, Wallet
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SUBPAGE_TITLES: Record<string, { title: string; parent?: string }> = {
  "/user/dashboard": { title: "BHAVO" },
  "/user/book-ride": { title: "Book a Ride" },
  "/user/my-commute": { title: "My Commute" },
  "/user/trips": { title: "My Trips" },
  "/user/wallet": { title: "Bhavo Wallet", parent: "/user/dashboard" },
  "/user/places": { title: "Saved Places", parent: "/user/dashboard" },
  "/user/mobility-insights": { title: "Mobility Insights", parent: "/user/dashboard" },
  "/user/support": { title: "Support & Help", parent: "/user/dashboard" },
  "/user/profile": { title: "My Profile", parent: "/user/dashboard" },
  "/user/settings": { title: "Settings", parent: "/user/dashboard" },
  "/user/notifications": { title: "Notifications", parent: "/user/dashboard" },
};

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export default function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();

  const [unreadCount] = useState(3);
  const pageMeta = SUBPAGE_TITLES[pathname] || { title: "Bhavo", parent: "/user/dashboard" };
  const isRootTab = pathname === "/user/dashboard" || pathname === "/user/book-ride" || pathname === "/user/my-commute" || pathname === "/user/trips";
  const hasParent = !isRootTab && Boolean(pageMeta.parent);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between h-15 px-3.5 bg-[#03201e]/98 backdrop-blur-xl text-white border-b border-white/8 shrink-0 select-none shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* ── Left: Back button OR App Brand ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {hasParent ? (
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push(pageMeta.parent || "/user/dashboard");
              }
            }}
            aria-label="Go back"
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/10 text-white active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft size={19} />
          </button>
        ) : (
          <Link href="/user/dashboard" className="flex items-center gap-2.5 shrink-0 active:scale-98 transition-transform">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/trimmed-logo.png" alt="Bhavo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[17px] font-black tracking-tight bg-linear-to-r from-[#5eead4] via-white to-[#2dd4bf] bg-clip-text text-transparent">
                BHAVO
              </span>
              <span className="text-[9px] font-bold text-teal-400/80 tracking-wider uppercase">
                Zero-Surge Transit
              </span>
            </div>
          </Link>
        )}

        {hasParent && (
          <h1 className="text-[15px] font-bold text-white tracking-tight truncate max-w-45">
            {pageMeta.title}
          </h1>
        )}
      </div>

      {/* ── Right Actions: Wallet Chip + Notifications + Menu Trigger ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Wallet Balance Chip */}
        <Link
          href="/user/wallet"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-teal-500/20 to-emerald-500/15 border border-teal-400/35 text-teal-200 active:scale-95 transition-all shadow-[0_0_12px_rgba(45,212,191,0.12)]"
        >
          <Wallet size={13} className="text-teal-300 shrink-0" />
          <span className="text-[12px] font-black tracking-tight">
            ₹{user?.walletBalance !== undefined ? user.walletBalance : 500}
          </span>
        </Link>

        {/* Notifications Icon */}
        <Link
          href="/user/notifications"
          aria-label="Notifications"
          className="relative w-8.5 h-8.5 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/14 border border-white/8 text-slate-200 active:scale-95 transition-all"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#03201e] shadow-xs">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Avatar / Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open Navigation Menu"
          className="flex items-center justify-center w-8.5 h-8.5 rounded-full ring-2 ring-teal-400/40 hover:ring-teal-400 overflow-hidden active:scale-90 transition-all cursor-pointer shadow-xs"
        >
          <Avatar className="w-full h-full">
            <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
            <AvatarFallback className="text-[11.5px] font-black bg-teal-700 text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
