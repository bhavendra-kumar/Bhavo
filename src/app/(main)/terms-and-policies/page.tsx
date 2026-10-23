import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import TermsSection from "@/components/public-website/landing-page/sections/TermsSection";

export const metadata = {
  title: "Terms & Policies | BHAVO",
  description: "Terms of Service, Privacy Policy, and operational guidelines for riders and drivers on the BHAVO platform.",
};

export default function TermsAndPoliciesPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76, minHeight: "calc(100vh - 180px)" }}>
        <TermsSection />
      </main>
      <Footer />
    </>
  );
}
