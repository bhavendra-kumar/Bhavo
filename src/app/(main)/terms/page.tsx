import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 120, paddingBottom: 80, minHeight: "calc(100vh - 200px)", maxWidth: 1200, margin: "0 auto", paddingLeft: 24, paddingRight: 24 }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 24 }}>Terms of Service</h1>
        <p style={{ fontSize: 18, color: "#475569", maxWidth: 800 }}>
          The rules and guidelines for using Bhavo.
        </p>
      </main>
      <Footer />
    </>
  );
}
