import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import ContactSection from "@/components/public-website/landing-page/sections/ContactSection";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "calc(100vh - 200px)" }}>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
