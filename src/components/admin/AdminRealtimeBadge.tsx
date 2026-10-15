"use client";

import React, { useEffect, useState } from "react";
import { Radio, RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import { ConnectionState } from "./useAdminRealtime";

export interface AdminRealtimeBadgeProps {
  connectionState?: ConnectionState;
  status?: ConnectionState;
  lastUpdated: Date;
  onRefresh?: () => void;
  onManualRefresh?: () => void;
  isLoading?: boolean;
}

export function AdminRealtimeBadge({
  connectionState,
  status,
  lastUpdated,
  onRefresh,
  onManualRefresh,
  isLoading = false,
}: AdminRealtimeBadgeProps) {
  const effectiveState = connectionState || status || "RECONNECTING";
  const handleRefresh = onRefresh || onManualRefresh;
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / 1000));
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getStatusConfig = () => {
    switch (effectiveState) {
      case "LIVE":
        return {
          label: "Live Stream",
          dotColor: "bg-emerald-500",
          ping: true,
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: Radio,
        };
      case "POLLING":
        return {
          label: "Polling Fallback (12s)",
          dotColor: "bg-amber-500",
          ping: false,
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: RefreshCw,
        };
      case "RECONNECTING":
        return {
          label: "Reconnecting...",
          dotColor: "bg-amber-400",
          ping: true,
          badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: AlertCircle,
        };
      case "OFFLINE":
      default:
        return {
          label: "Connection Offline",
          dotColor: "bg-rose-500",
          ping: false,
          badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: WifiOff,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-2xs ${config.badgeBg}`}
      >
        <span className="relative flex h-2 w-2">
          {config.ping && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        </span>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">{config.label}</span>
        <span className="text-slate-400">|</span>
        <span className="text-[11px] text-slate-500">
          {secondsAgo === 0 ? "Just now" : `${secondsAgo}s ago`}
        </span>
      </div>

      {handleRefresh && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          title="Manual refresh"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      )}
    </div>
  );
}

export default AdminRealtimeBadge;

