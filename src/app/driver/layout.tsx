import DriverLayout from "@/components/driver/layout/DriverLayout";

export const metadata = {
  title: "Captain Hub | Bhavo Driver",
  description: "Driver command center, shift operations, active dispatches and earnings tracker for Bhavo Captains.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DriverLayout>{children}</DriverLayout>;
}
