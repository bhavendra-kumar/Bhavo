import React from "react";
import Sidebar from "@/components/user/Sidebar";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-900 font-sans" style={{ background: "#f1f5f9" }}>
      {/* Sidebar - fixed position or flex depending on implementation. 
          Our Sidebar is h-screen and handles its own width transitions. */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Navbar />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
