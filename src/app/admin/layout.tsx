import { getSession } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  if (!isAdmin) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
