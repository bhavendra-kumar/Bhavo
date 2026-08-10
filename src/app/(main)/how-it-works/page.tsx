import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import HowItWorks from "@/components/public-website/landing-page/sections/HowItWorks";
import ContactSection from "@/components/public-website/landing-page/sections/ContactSection";

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "calc(100vh - 200px)" }}>
        <HowItWorks />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
