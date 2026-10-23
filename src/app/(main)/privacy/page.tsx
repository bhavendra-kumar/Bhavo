import { redirect } from "next/navigation";

export default function PrivacyRedirect() {
  redirect("/terms-and-policies#privacy");
}
