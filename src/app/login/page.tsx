import Login from "@/components/auth/login/Login";

export const metadata = {
  title: "Log In | Bhavo",
  description: "Sign in to your Bhavo account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; email?: string; role?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params.role?.toUpperCase() === "DRIVER" ? "DRIVER" : "RIDER";
  return (
    <Login
      key={initialRole}
      isRegistered={params.registered === "true"}
      initialEmail={params.email || ""}
      initialRole={initialRole}
    />
  );
}
