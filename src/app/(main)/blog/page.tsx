import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 120, paddingBottom: 80, minHeight: "calc(100vh - 200px)", maxWidth: 1200, margin: "0 auto", paddingLeft: 24, paddingRight: 24 }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 24 }}>Blog</h1>
        <p style={{ fontSize: 18, color: "#475569", maxWidth: 800 }}>
          Latest news, updates, and thoughts from the Bhavo team.
        </p>
      </main>
      <Footer />
    </>
  );
}
