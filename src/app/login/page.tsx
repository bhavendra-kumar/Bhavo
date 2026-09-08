import Login from "@/components/auth/login/Login";

export const metadata = {
  title: "Log In | Bhavo",
  description: "Sign in to your Bhavo account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <Login
      isRegistered={params.registered === "true"}
      initialEmail={params.email || ""}
    />
  );
}
