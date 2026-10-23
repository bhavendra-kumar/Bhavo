import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";
import ReviewsSection from "@/components/public-website/landing-page/sections/ReviewsSection";

export const metadata = {
  title: "Customer Reviews & Verification | BHAVO",
  description: "Authentic, verified passenger reviews and driver feedback collected from completed BHAVO journeys.",
};

export default function ReviewsPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76, minHeight: "calc(100vh - 180px)" }}>
        <ReviewsSection />
      </main>
      <Footer />
    </>
  );
}
