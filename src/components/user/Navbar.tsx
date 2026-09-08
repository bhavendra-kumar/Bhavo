"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, Search, X, CheckCheck, MapPin,
  CarFront, CalendarClock, Wallet, User, Settings, LogOut,
  LifeBuoy, ChevronDown, ShieldCheck, Clock,
  Menu, Trash2, ArrowRight, Loader2, LayoutDashboard,
  BarChart3
} from "lucide-react";
import { useUserStore } from "@/hooks/user/useUserStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDialog } from "@/components/ui/DialogProvider";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/user/dashboard": { title: "Dashboard", subtitle: "Real-time overview of your commute activity." },
  "/user/book-ride": { title: "Book a Ride", subtitle: "Get a ride in minutes. Your preferred vehicles are ready." },
  "/user/my-commute": { title: "My Commute", subtitle: "Your daily routes and smart commute insights." },
  "/user/trips": { title: "My Trips", subtitle: "View your past and upcoming trips." },
  "/user/wallet": { title: "Bhavo Wallet", subtitle: "Manage your balance, rewards and payments." },
  "/user/places": { title: "Places", subtitle: "Your saved and frequent locations." },
  "/user/notifications": { title: "Notifications", subtitle: "Stay up to date with your activity." },
  "/user/mobility-insights": { title: "Mobility Insights", subtitle: "Analytics on your travel patterns and savings." },
  "/user/profile": { title: "My Profile", subtitle: "Manage your personal information and preferences." },
  "/user/settings": { title: "Settings", subtitle: "Customize your Bhavo experience." },
  "/user/support": { title: "Raise a Ticket", subtitle: "Get prompt help and support from Bhavo care." },
};

// Navigation suggestions for omnibar search
const APP_NAV_ITEMS = [
  { name: "Book a Ride", href: "/user/book-ride", icon: CarFront, desc: "Instant or scheduled cab, bike, auto" },
  { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard, desc: "Overview & active trip status" },
  { name: "My Commute", href: "/user/my-commute", icon: CalendarClock, desc: "Daily route schedules & alarms" },
  { name: "My Trips", href: "/user/trips", icon: CarFront, desc: "Past ride receipts & upcoming bookings" },
  { name: "Bhavo Wallet", href: "/user/wallet", icon: Wallet, desc: "Add money, cashback & payment methods" },
  { name: "Saved Places", href: "/user/places", icon: MapPin, desc: "Home, Office & frequent destinations" },
  { name: "Mobility Insights", href: "/user/mobility-insights", icon: BarChart3, desc: "CO2 savings & commute patterns" },
  { name: "Raise a Ticket", href: "/user/support", icon: LifeBuoy, desc: "24/7 Support, refund or issue tickets" },
  { name: "My Profile", href: "/user/profile", icon: User, desc: "Personal info, emergency contacts" },
  { name: "Settings", href: "/user/settings", icon: Settings, desc: "Security, notifications, preferences" },
];

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "ride" | "wallet" | "commute" | "system";
  href: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Wallet Cashback Credited",
    message: "₹50 promotional cashback has been credited to your Bhavo Wallet!",
    time: "5m ago",
    read: false,
    type: "wallet",
    href: "/user/wallet",
  },
  {
    id: "notif-2",
    title: "Smart Commute Route Alert",
    message: "Traffic is moving 15% faster on your usual morning route today.",
    time: "25m ago",
    read: false,
    type: "commute",
    href: "/user/my-commute",
  },
  {
    id: "notif-3",
    title: "Trip Safety Verified",
    message: "24/7 SOS safety and pilot identity verification active on all rides.",
    time: "2h ago",
    read: false,
    type: "system",
    href: "/user/support",
  },
  {
    id: "notif-4",
    title: "Welcome to Bhavo",
    message: "Account verified. Your doorstep smart commute experience is ready.",
    time: "1d ago",
    read: true,
    type: "system",
    href: "/user/dashboard",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, toggleSidebar } = useUserStore();
  const meta = PAGE_META[pathname] ?? { title: "Bhavo Smart Commute", subtitle: "" };

  // Dropdown toggles
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<Array<{ place_id: number; display_name: string; lat: string; lon: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // DOM Refs for click outside
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useDialog();

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsUserMenuOpen(false);
      }
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced search for locations via /api/places
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (!ignore && Array.isArray(data)) {
          setPlaceResults(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Navbar search error:", err);
      } finally {
        if (!ignore) setSearchLoading(false);
      }
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Filtered app navigation links
  const filteredNavItems = searchQuery.trim()
    ? APP_NAV_ITEMS.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : APP_NAV_ITEMS.slice(0, 5);

  // Unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayedNotifications =
    notifFilter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsNotificationsOpen(false);
    if (notif.href) {
      router.push(notif.href);
    }
  };

  const handleDismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Logout handler
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
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 shrink-0 relative z-30"
      style={{ background: "#042f2e", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* ── Left: Mobile Menu Toggle + Title ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="md:hidden p-2 rounded-lg text-teal-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-[16px] sm:text-[17px] font-black tracking-tight leading-none text-white truncate">
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p className="text-[11px] font-medium mt-1 hidden sm:block text-slate-400 truncate">
              {meta.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Omnibar Search, Notifications, User Menu ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ── 1. Global Search / Omnibar ── */}
        <div className="relative" ref={searchRef}>
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 pointer-events-none text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val || val.trim().length < 2) {
                  setPlaceResults([]);
                }
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (placeResults.length > 0) {
                    const p = placeResults[0];
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    router.push(`/user/book-ride?dest=${encodeURIComponent(p.display_name)}&lat=${p.lat}&lng=${p.lon}`);
                  } else if (filteredNavItems.length > 0) {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    router.push(filteredNavItems[0].href);
                  }
                }
              }}
              placeholder="Search places or features... (Ctrl+K)"
              className="h-9 pl-9 pr-8 text-[12px] sm:text-[13px] rounded-lg transition-all w-36 sm:w-56 md:w-64 focus:w-48 sm:focus:w-72 lg:focus:w-80 focus:outline-none placeholder:text-slate-400 text-white"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: isSearchOpen ? "1px solid #2dd4bf" : "1px solid rgba(255,255,255,0.12)",
                boxShadow: isSearchOpen ? "0 0 0 3px rgba(45,212,191,0.15)" : "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPlaceResults([]);
                }}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute top-full right-0 sm:left-0 mt-2 w-72 sm:w-80 md:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header label */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>{searchQuery ? "Search Results" : "Quick Shortcuts"}</span>
                <span className="text-[10px] text-slate-400 lowercase font-medium">esc to close</span>
              </div>

              <div className="max-h-80 overflow-y-auto no-scrollbar p-1.5 flex flex-col gap-1">
                {/* Real-time geocoded place search results */}
                {searchLoading ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-slate-500 text-[12px]">
                    <Loader2 size={14} className="animate-spin text-teal-600" /> Searching places...
                  </div>
                ) : placeResults.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest px-2.5 py-1">
                      Destinations (Book Ride)
                    </p>
                    {placeResults.map((place) => (
                      <button
                        key={place.place_id}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          router.push(
                            `/user/book-ride?dest=${encodeURIComponent(place.display_name.split(",")[0])}&lat=${place.lat}&lng=${place.lon}`
                          );
                        }}
                        className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-teal-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <MapPin size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-bold text-slate-800 truncate">
                            {place.display_name.split(",")[0]}
                          </p>
                          <p className="text-[10.5px] text-slate-500 truncate">{place.display_name}</p>
                        </div>
                        <ArrowRight size={12} className="text-teal-600 opacity-0 group-hover:opacity-100 mt-1 transition-opacity shrink-0" />
                      </button>
                    ))}
                    <div className="h-px bg-slate-100 my-1" />
                  </div>
                ) : null}

                {/* App Sections & Features */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1">
                    Features & Pages
                  </p>
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                      >
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-bold text-slate-800 leading-snug">{item.name}</p>
                          <p className="text-[10.5px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Notifications Center (Bell) ── */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsUserMenuOpen(false);
              setIsSearchOpen(false);
            }}
            aria-label="View notifications"
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer text-slate-300 hover:text-white"
            style={{
              background: isNotificationsOpen ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[9.5px] font-black flex items-center justify-center border-2 border-[#042f2e] shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={13} /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex px-3 pt-2 border-b border-slate-100 bg-white gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setNotifFilter("all")}
                  className={`pb-2 px-1 transition-all border-b-2 cursor-pointer ${
                    notifFilter === "all"
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter("unread")}
                  className={`pb-2 px-1 transition-all border-b-2 cursor-pointer ${
                    notifFilter === "unread"
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                {displayedNotifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Bell size={24} className="opacity-40" />
                    <p className="text-[13px] font-semibold text-slate-600">No notifications</p>
                    <p className="text-[11px]">You are all caught up with your rides and commute!</p>
                  </div>
                ) : (
                  displayedNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                        !notif.read ? "bg-teal-50/40" : "bg-white"
                      }`}
                    >
                      {/* Icon based on notification category */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.type === "wallet"
                            ? "bg-amber-100 text-amber-700"
                            : notif.type === "ride"
                            ? "bg-teal-100 text-teal-700"
                            : notif.type === "commute"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {notif.type === "wallet" ? (
                          <Wallet size={15} />
                        ) : notif.type === "ride" ? (
                          <CarFront size={15} />
                        ) : notif.type === "commute" ? (
                          <CalendarClock size={15} />
                        ) : (
                          <ShieldCheck size={15} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-[12.5px] font-bold ${!notif.read ? "text-slate-950" : "text-slate-700"}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                            <Clock size={10} /> {notif.time}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Action / Dismiss */}
                      <button
                        type="button"
                        onClick={(e) => handleDismissNotification(e, notif.id)}
                        title="Dismiss"
                        className="text-slate-300 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                <button
                  type="button"
                  onClick={handleClearAllNotifications}
                  className="text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1"
                >
                  <Trash2 size={12} /> Clear all
                </button>
                <Link
                  href="/user/notifications"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors px-2 py-1"
                >
                  View full inbox <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-white/10 hidden sm:block" />

        {/* ── 3. User Profile Dropdown ── */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotificationsOpen(false);
              setIsSearchOpen(false);
            }}
            aria-label="User Account Menu"
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl transition-all cursor-pointer hover:bg-white/10"
            style={{
              border: isUserMenuOpen ? "1px solid rgba(45,212,191,0.4)" : "1px solid transparent",
              background: isUserMenuOpen ? "rgba(255,255,255,0.12)" : "transparent",
            }}
          >
            <Avatar className="w-8 h-8 shrink-0 border border-white/20">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? undefined} />
              <AvatarFallback className="text-[12px] font-bold bg-teal-600 text-white">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>

            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-bold leading-none text-white truncate max-w-28">
                  {user?.name || "Commuter"}
                </p>
                <ChevronDown size={12} className="text-teal-300" />
              </div>
              <p className="text-[10.5px] font-medium mt-1 text-slate-300 flex items-center gap-1">
                <span className="text-amber-400 font-bold">★ {user?.rating ?? 5.0}</span> · Commuter
              </p>
            </div>
          </button>

          {/* User Profile Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {/* User Identity Header Card */}
              <div className="p-4 bg-teal-900 text-white flex items-center gap-3">
                <Avatar className="w-11 h-11 border-2 border-teal-400 shrink-0">
                  <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                  <AvatarFallback className="text-[14px] font-black bg-teal-700 text-white">
                    {user?.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold leading-snug truncate text-white">
                    {user?.name || "Bhavo Commuter"}
                  </p>
                  <p className="text-[11px] text-teal-200 truncate">{user?.email || "commuter@bhavo.com"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-800 text-teal-200 flex items-center gap-1">
                      ★ {user?.rating ?? 5.0}
                    </span>
                    <span className="text-[10px] font-semibold text-teal-300 uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Wallet balance chip */}
              <div className="p-3 bg-teal-50/80 border-b border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Wallet size={13} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wallet Balance</p>
                    <p className="text-[14px] font-black text-slate-900">
                      ₹{user?.walletBalance !== undefined ? user.walletBalance : 500}
                    </p>
                  </div>
                </div>
                <Link
                  href="/user/wallet"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-colors shadow-xs"
                >
                  Top Up
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="p-2 flex flex-col gap-0.5">
                <Link
                  href="/user/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <User size={15} className="text-teal-600" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/user/trips"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <CarFront size={15} className="text-teal-600" />
                  <span>My Trips & Receipts</span>
                </Link>

                <Link
                  href="/user/places"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <MapPin size={15} className="text-teal-600" />
                  <span>Saved Places</span>
                </Link>

                <Link
                  href="/user/support"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <LifeBuoy size={15} className="text-teal-600" />
                  <span>Raise a Ticket / Support</span>
                </Link>

                <Link
                  href="/user/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Settings size={15} className="text-teal-600" />
                  <span>Settings & Preferences</span>
                </Link>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 my-1" />

              {/* Log Out */}
              <div className="p-2 pt-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 size={15} className="animate-spin text-rose-600" />
                  ) : (
                    <LogOut size={15} className="text-rose-600" />
                  )}
                  <span>{isLoggingOut ? "Logging Out..." : "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
