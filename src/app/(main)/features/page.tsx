import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import FeaturesGrid from "@/components/public-website/landing-page/sections/FeaturesGrid";
import ContactSection from "@/components/public-website/landing-page/sections/ContactSection";

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "calc(100vh - 200px)" }}>
        <FeaturesGrid />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
