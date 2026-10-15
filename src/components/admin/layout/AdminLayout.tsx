"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Repeat,
  Car,
  ShieldCheck,
  Users,
  Headphones,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Live Operations", href: "/admin/live-operations", icon: Radio },
  { name: "Daily Commutes", href: "/admin/commutes", icon: Repeat },
  { name: "All Rides", href: "/admin/rides", icon: Car },
  { name: "Drivers & Verification", href: "/admin/drivers", icon: ShieldCheck },
  { name: "Riders", href: "/admin/riders", icon: Users },
  { name: "Support & Safety", href: "/admin/support", icon: Headphones },
  { name: "Payments & Audit", href: "/admin/payments", icon: CreditCard },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-sm overflow-hidden shrink-0">
            <Image src="/bhavo-logo.png" alt="Bhavo Admin" width={24} height={24} className="w-full h-full object-contain" priority />
          </div>
          <span className="font-bold text-lg tracking-wide text-white">BHAVO ADMIN</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between border-r border-slate-800 z-30`}
      >
        <div>
          <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
              <Image src="/bhavo-logo.png" alt="Bhavo Logo" width={32} height={32} className="w-full h-full object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wide">BHAVO OPS</h1>
              <p className="text-[11px] text-teal-400 font-medium tracking-wider uppercase">
                Admin Control Room
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-700/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <p className="text-xs font-semibold text-slate-200">System Administrator</p>
              <p className="text-[11px] text-teal-400">Authorized Session</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors border border-rose-900/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
