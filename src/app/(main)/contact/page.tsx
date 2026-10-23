import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import ContactSection from "@/components/public-website/landing-page/sections/ContactSection";

export const metadata = {
  title: "Contact Us | BHAVO Support",
  description: "Get in touch with the BHAVO operations and customer care desk for rider assistance, commute setups, or driver inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76, minHeight: "calc(100vh - 180px)" }}>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
