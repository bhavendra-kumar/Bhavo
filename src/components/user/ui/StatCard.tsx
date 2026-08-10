import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  teal: {
    gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
    glow: "rgba(20,184,166,0.3)",
  },
  blue: {
    gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    glow: "rgba(59,130,246,0.3)",
  },
  purple: {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
    glow: "rgba(139,92,246,0.3)",
  },
  rose: {
    gradient: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    glow: "rgba(244,63,94,0.3)",
  },
  amber: {
    gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    glow: "rgba(245,158,11,0.3)",
  },
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
    <Card className="transition-all duration-300 hover:-translate-y-1 group cursor-default border-none shadow-sm rounded-2xl bg-white">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: cfg.gradient,
              boxShadow: `0 4px 14px ${cfg.glow}`,
            }}
          >
            <Icon size={18} className="text-white" />
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            {value}
          </h3>

          {(trend || subtitle) && (
            <div className="mt-2.5 flex items-center gap-2">
              {trend && (
                <Badge
                  variant={trend.isPositive ? "default" : "destructive"}
                  className={`text-xs font-bold px-2 py-0.5 shadow-none ${trend.isPositive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}
                >
                  5                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </Badge>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
