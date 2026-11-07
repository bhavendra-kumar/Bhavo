import { getSession } from "@/lib/auth";
import { AdminOverviewDashboard } from "@/components/admin/overview/AdminOverviewDashboard";
import AdminLogin from "@/components/admin/auth/AdminLogin";

export const metadata = {
  title: "Admin Operations Portal | Bhavo",
  description: "Executive and administrative operations command center for Bhavo.",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  if (!isAdmin) {
    const params = searchParams ? await searchParams : {};
    return (
      <AdminLogin
        redirectUrl={params.redirect || "/admin"}
        currentRole={session?.role}
      />
    );
  }

  return <AdminOverviewDashboard />;
}
