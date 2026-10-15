"use client";

import React from "react";

export interface AdminStatusBadgeProps {
  status: string;
  type?: "ride" | "driver" | "ticket" | "payment" | "commute" | "dispatch" | "general";
  size?: "sm" | "md";
}

export function AdminStatusBadge({
  status,
  size = "md",
}: AdminStatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  const getColors = () => {
    switch (norm) {
      case "COMPLETED":
      case "VERIFIED":
      case "ACTIVE":
      case "SETTLED":
      case "PAID":
      case "RESOLVED":
      case "CLOSED":
      case "ONLINE":
      case "MATERIALIZED":
      case "FRESH":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "IN_PROGRESS":
      case "ARRIVED":
      case "ACCEPTED":
      case "ONLINE_SEARCHING":
      case "CLAIMED":
      case "DISPATCH_ALERT":
        return "bg-teal-50 text-teal-700 border-teal-200";

      case "SEARCHING":
      case "PENDING":
      case "OPEN":
      case "MEDIUM":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "STALE":
      case "HIGH":
      case "AWAITING_CASH":
      case "SKIPPED_PAST":
      case "SKIPPED_PAUSED":
      case "PAUSED":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "CANCELLED":
      case "REJECTED":
      case "SUSPENDED":
      case "DISABLED":
      case "FAILED":
      case "FAILED_PERMANENT":
      case "FAILED_RETRYABLE":
      case "CRITICAL":
      case "URGENT":
      case "EXPIRED":
      case "CONFLICT":
        return "bg-rose-50 text-rose-700 border-rose-200";

      case "UNAVAILABLE":
      case "OFFLINE":
      case "TERMINAL":
      case "LOW":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border tracking-wide uppercase ${pad} ${getColors()}`}
    >
      {norm.replace(/_/g, " ")}
    </span>
  );
}

export default AdminStatusBadge;

