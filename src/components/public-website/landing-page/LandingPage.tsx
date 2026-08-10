"use client";

import Navbar from "../Navbar";
import Footer from "../Footer";
import Hero from "./sections/Hero";
import AppPreview from "./sections/AppPreview";
// import StatsBanner from "./sections/StatsBanner";
import CTASection from "./sections/CTASection";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AppPreview />
        {/* <StatsBanner /> */}
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

