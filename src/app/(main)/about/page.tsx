import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import AboutSection from "@/components/public-website/landing-page/sections/AboutSection";

export const metadata = {
  title: "About Us | BHAVO Mobility",
  description:
    "Learn about BHAVO's mission to eliminate daily commute stress with server-authoritative fair pricing, automated recurring dispatch, and eco-friendly fleets.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76 }}>
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}
