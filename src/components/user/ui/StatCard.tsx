import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: "teal" | "blue" | "purple" | "rose" | "amber";
}

const colorConfig = {
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = "teal",
}: StatCardProps) {
  const cfg = colorConfig[color];

  return (
    <div className="premium-card rounded-2xl p-5 flex flex-col gap-5 relative overflow-hidden group">
      <div className="flex items-center justify-between z-10">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${cfg.bg}`}>
          <Icon size={18} className={cfg.text} />
        </div>
      </div>

      <div className="z-10">
        <h3 className="text-3xl font-bold text-teal-950 tracking-tight mb-2">
          {value}
        </h3>
        
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
          {subtitle && (
            <span className="text-[12px] font-medium text-slate-500">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
