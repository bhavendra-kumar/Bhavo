"use client";

import React from "react";
import Link from "next/link";
import {
  Wallet,
  Clock,
  Leaf,
  ReceiptText,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { IDashboardStats } from "@/hooks/user/useDashboardStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface CommuterPerksMetricsProps {
  stats?: IDashboardStats;
}

export default function CommuterPerksMetrics({
  stats,
}: CommuterPerksMetricsProps) {
  const { alert } = useDialog();

  const handleDownloadInvoice = () => {
    alert({
      title: "Consolidated Expense Summary",
      message:
        monthExpense > 0
          ? `Your total expenses for this month are ₹${monthExpense.toLocaleString()} across completed trips.`
          : "No completed ride expenses recorded for this month yet.",
      variant: "info",
    });
  };

  const walletBalance = stats?.walletBalance ?? 0;
  const onTimeRate = stats?.onTimeRate ?? 100;
  const co2Saved = stats?.carbonOffsetKg ?? stats?.co2SavedKg ?? 0;
  const ridesCount = stats?.ridesCount ?? stats?.totalRides ?? 0;
  const monthExpense = stats?.monthExpenseTotal ?? 0;

  const metrics = [
    {
      icon: Wallet,
      label: "Wallet",
      value: `₹${walletBalance.toLocaleString()}`,
      sub: "Cash pilot active",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      href: "/user/wallet",
    },
    {
      icon: Clock,
      label: "On-time",
      value: `${onTimeRate}%`,
      sub: `${ridesCount} completed`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/user/mobility-insights",
      badge: (
        <TrendingUp size={10} />
      ),
    },
    {
      icon: Leaf,
      label: "CO₂ Saved",
      value: `${co2Saved}kg`,
      sub: "EV fleet",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: ReceiptText,
      label: "Expenses",
      value: `₹${monthExpense.toLocaleString()}`,
      sub: "This month",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      action: handleDownloadInvoice,
    },
  ];

  return (
    <div className="flex items-stretch gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {metrics.map((m) => {
        const Icon = m.icon;
        const sharedClassName = `flex items-center gap-3 min-w-45 flex-1 px-4 py-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 hover:shadow-sm transition-all group ${
          m.action || m.href ? "cursor-pointer" : ""
        }`;

        const content = (
          <>
            <div
              className={`w-9 h-9 rounded-xl ${m.bgColor} ${m.color} flex items-center justify-center shrink-0`}
            >
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none">
                {m.value}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                {m.sub}
                {m.badge && (
                  <span className="text-emerald-500">{m.badge}</span>
                )}
              </p>
            </div>
            {(m.href || m.action) && (
              <ArrowUpRight
                size={13}
                className="text-slate-300 group-hover:text-teal-600 transition-colors shrink-0"
              />
            )}
          </>
        );

        if (m.href) {
          return (
            <Link key={m.label} href={m.href} className={sharedClassName}>
              {content}
            </Link>
          );
        }

        return (
          <div
            key={m.label}
            className={sharedClassName}
            onClick={m.action}
            role={m.action ? "button" : undefined}
            tabIndex={m.action ? 0 : undefined}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
