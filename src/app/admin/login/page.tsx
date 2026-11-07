import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLogin from "@/components/admin/auth/AdminLogin";

export const metadata = {
  title: "Admin Portal Sign In | Bhavo Operations",
  description: "Secure login for Bhavo system administrators and dispatch operators.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "ADMIN") {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  return (
    <AdminLogin
      redirectUrl={params.redirect || "/admin"}
      currentRole={session?.role}
    />
  );
}

