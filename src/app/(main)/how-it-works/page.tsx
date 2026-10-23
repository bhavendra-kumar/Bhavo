import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import HowItWorksSection from "@/components/public-website/landing-page/sections/HowItWorksSection";

export const metadata = {
  title: "How It Works | BHAVO",
  description: "Learn how everyday rides, eligible driver matching, and automated recurring commutes work on BHAVO.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76, minHeight: "calc(100vh - 180px)" }}>
        <HowItWorksSection />
      </main>
      <Footer />
    </>
  );
}
