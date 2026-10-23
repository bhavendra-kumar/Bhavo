"use client";

import Navbar from "../Navbar";
import Footer from "../Footer";
import Hero from "./sections/Hero";
import FleetSection from "./sections/FleetSection";
import CommutesSection from "./sections/CommutesSection";
import PetRidesSection from "./sections/PetRidesSection";
import DriveSection from "./sections/DriveSection";
import FAQSection from "./sections/FAQSection";
import FinalCTASection from "./sections/FinalCTASection";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Section 1 — Hero */}
        <Hero />

        {/* Section 2 — Our Fleet & Affordable Mobility */}
        <FleetSection />

        {/* Section 3 — Daily Commutes */}
        <CommutesSection />

        {/* Section 4 — Pet Rides */}
        <PetRidesSection />

        {/* Section 5 — Drive with BHAVO */}
        <DriveSection />

        {/* Section 7 — Frequently Asked Questions */}
        <FAQSection />

        {/* Section 8 — Final Call to Action */}
        <FinalCTASection />
      </main>

      {/* Section 11 — Footer */}
      <Footer />
    </>
  );
}

