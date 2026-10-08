import SignUp from "@/components/auth/signup/SignUp";

export const metadata = {
  title: "Sign Up | Bhavo",
  description: "Create a new Bhavo account.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialRole = params?.role?.toUpperCase() === "DRIVER" ? "DRIVER" : "RIDER";
  return <SignUp key={initialRole} initialRole={initialRole} />;
}
