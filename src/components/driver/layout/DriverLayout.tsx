"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DriverSidebar from "./DriverSidebar";
import DriverNavbar from "./DriverNavbar";
import {
  DriverMobileHeader,
  DriverMobileBottomNav,
  DriverMobileMenuSheet,
} from "./DriverMobileNav";
import { useDriverStore } from "@/hooks/driver/useDriverStore";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { fetchDriverData, loading, driverProfile } = useDriverStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [safeguardTimeout, setSafeguardTimeout] = useState(false);

  useEffect(() => {
    fetchDriverData();
    const timer = setTimeout(() => setSafeguardTimeout(true), 2500);
    return () => clearTimeout(timer);
  }, [fetchDriverData]);

  useEffect(() => {
    if (driverProfile && driverProfile.role && driverProfile.role !== "DRIVER") {
      router.replace("/user/dashboard");
    }
  }, [driverProfile, router]);

  if (loading && !driverProfile && !safeguardTimeout) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f0fdfa]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
          <span className="text-[13px] font-bold text-teal-800">
            Initializing Driver Command Center...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:flex h-screen w-full overflow-hidden bg-[#f0fdfa]">
        <DriverSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DriverNavbar />
          <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
            <div
              className="p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col shrink-0"
              style={{ minHeight: "calc(100vh - 64px)" }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <div className="flex lg:hidden flex-col h-dvh w-full overflow-hidden bg-[#f0fdfa]">
        <DriverMobileHeader onOpenMenu={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto no-scrollbar overscroll-y-contain flex flex-col px-3.5 pt-3 pb-32">
          {children}
        </main>
        <DriverMobileBottomNav onOpenMenu={() => setIsMenuOpen(true)} />
        <DriverMobileMenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </>
  );
}
