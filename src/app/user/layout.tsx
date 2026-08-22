"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/user/Sidebar";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { useUserStore } from "@/hooks/user/useUserStore";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser, loading } = useUserStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: "#f0fdfa" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#f0fdfa" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          <div
            className="p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col shrink-0"
            style={{ minHeight: "calc(100vh - 64px)" }}
          >
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

