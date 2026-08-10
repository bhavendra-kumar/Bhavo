import React from "react";
import WelcomeWidget from "@/components/user/dashboard/WelcomeWidget";
import UpcomingRideWidget from "@/components/user/dashboard/UpcomingRideWidget";
import AutoBookingWidget from "@/components/user/dashboard/AutoBookingWidget";
import StatCard from "@/components/user/ui/StatCard";
import { Route, Clock, Banknote, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypographyH3 } from "@/components/ui/typography";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Hero */}
      <WelcomeWidget />

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ minHeight: "280px" }}>
        <UpcomingRideWidget />
        <AutoBookingWidget />
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <TypographyH3 className="text-base text-slate-900 border-none pb-0">
            This Month&apos;s Overview
          </TypographyH3>
          <Button variant="link" className="text-xs font-bold text-teal-600 hover:text-teal-700 h-auto p-0">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Rides"
            value="34"
            icon={Route}
            color="teal"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Time Saved"
            value="4h 12m"
            icon={Clock}
            color="blue"
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Money Spent"
            value="₹4,250"
            icon={Banknote}
            color="amber"
            subtitle="Under budget by ₹750"
          />
          <StatCard
            title="Auto-Booking"
            value="100%"
            icon={ShieldCheck}
            color="purple"
            subtitle="Success Rate"
          />
        </div>
      </div>
    </div>
  );
}
