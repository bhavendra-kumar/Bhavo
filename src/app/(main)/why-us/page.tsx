import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import WhyBhavoSection from "@/components/public-website/landing-page/sections/WhyBhavoSection";

export const metadata = {
  title: "Why BHAVO | Reliable Everyday Travel",
  description: "Discover genuine platform capabilities: recurring commute automation, server-authoritative fares, verified drivers, and live route tracking.",
};

export default function WhyUsPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76, minHeight: "calc(100vh - 180px)" }}>
        <WhyBhavoSection />
      </main>
      <Footer />
    </>
  );
}
