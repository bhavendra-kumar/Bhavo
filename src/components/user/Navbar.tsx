"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Command,
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const pathname = usePathname();
  const { toggleSidebar, user } = useUserStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const paths = pathname.split("/").filter(Boolean);
  const formatPath = (path: string) =>
    path.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const pageTitle = paths.length > 0 ? formatPath(paths[paths.length - 1]) : "Dashboard";

  /* Scroll shadow effect */
  useEffect(() => {
    const container = document.querySelector("main");
    if (!container) return;
    const handler = () => setScrolled(container.scrollTop > 10);
    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, []);

  /* Cmd+K shortcut to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <style>{`
        .navbar-blur {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
      
      <header
        className={`sticky top-0 z-40 w-full flex items-center justify-between px-6 transition-all duration-300 navbar-blur ${
          scrolled ? "h-16 border-b border-slate-200 shadow-sm" : "h-19 border-b border-slate-100"
        }`}
      >
        {/* ─── Left: Mobile Menu + Breadcrumbs ─── */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden w-10 h-10 text-slate-500 hover:bg-slate-100"
          >
            <Menu size={20} />
          </Button>

          <nav className="hidden sm:flex flex-col justify-center">
            {/* Breadcrumb row */}
            {paths.length > 1 && (
              <div className="flex items-center gap-1.5 mb-0.5">
                {paths.slice(0, -1).map((path, idx) => (
                  <React.Fragment key={path}>
                    <span className="text-[12px] font-medium text-slate-400 tracking-wide hover:text-slate-600 transition-colors cursor-pointer">
                      {formatPath(path)}
                    </span>
                    {idx < paths.length - 2 && (
                      <ChevronRight size={12} className="text-slate-300" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {/* Page Title */}
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">
              {pageTitle}
            </h1>
          </nav>
        </div>

        {/* ─── Right: Actions & Profile ─── */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* Search Bar */}
          <div className="relative hidden md:flex items-center group">
            <Search
              size={16}
              className={`absolute left-3.5 pointer-events-none transition-colors ${
                searchFocused ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"
              }`}
            />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`h-10 pl-10 pr-12 rounded-full text-[14px] font-medium transition-all duration-300 ${
                searchFocused
                  ? "w-72 bg-white border-teal-500 ring-4 ring-teal-500/10 shadow-sm text-slate-800"
                  : "w-60 bg-slate-100 border-transparent hover:bg-slate-200/70 text-slate-700 placeholder:text-slate-400"
              }`}
            />
            {!searchFocused && (
              <kbd className="absolute right-3.5 hidden lg:flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm pointer-events-none">
                <Command size={10} /> K
              </kbd>
            )}
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative w-10 h-10 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <Bell size={20} />
            {/* Unread dot */}
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
          </Button>

          {/* Profile Menu */}
          <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors group">
            <Avatar className="w-9 h-9 border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-teal-600 text-white font-semibold text-[13px]">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col items-start justify-center">
              <span className="text-[14px] font-bold text-slate-800 leading-tight">
                {user.name}
              </span>
              <span className="text-[12px] font-semibold text-teal-600 leading-tight flex items-center gap-0.5 mt-0.5">
                ★ {user.rating}
              </span>
            </div>
          </button>
        </div>
      </header>
    </>
  );
}
