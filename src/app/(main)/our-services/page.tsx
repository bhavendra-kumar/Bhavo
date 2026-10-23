import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import ServicesSection from "@/components/public-website/landing-page/sections/ServicesSection";
import CommutesSection from "@/components/public-website/landing-page/sections/CommutesSection";
import PetRidesSection from "@/components/public-website/landing-page/sections/PetRidesSection";

export const metadata = {
  title: "Our Services | BHAVO",
  description: "Explore everyday rides, automated recurring daily commutes, and pet-friendly travel with verified drivers on BHAVO.",
};

export default function OurServicesPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76, minHeight: "calc(100vh - 180px)" }}>
        <ServicesSection />
        <CommutesSection />
        <PetRidesSection />
      </main>
      <Footer />
    </>
  );
}
