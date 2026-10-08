import { Metadata } from "next";
import DriverDashboard from "@/components/driver/dashboard/DriverDashboard";

export const metadata: Metadata = {
  title: "Captain Hub | Bhavo Driver",
  description: "Driver command center, shift operations, active dispatches and earnings tracker for Bhavo Captains.",
};

export default function DriverPage() {
  return <DriverDashboard />;
}
