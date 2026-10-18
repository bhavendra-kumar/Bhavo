export interface Testimonial {
  name: string;
  role: string;
  company: string;
  type: "rider" | "driver";
  avatar: string;
  quote: string;
  rating: number;
}

export interface Feature {
  icon: string;
  category: "rider" | "driver" | "platform";
  title: string;
  description: string;
  accent: string;
  tag: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
  highlight: string;
}

export const FEATURES: Feature[] = [
  // Rider Features
  {
    icon: "✦",
    category: "rider",
    title: "AI Route Optimisation",
    description:
      "Our predictive model ingests live city traffic, choke-points, and weather to calculate your fastest route automatically every single day.",
    accent: "#0d9488",
    tag: "Rider Portal",
  },
  {
    icon: "⟳",
    category: "rider",
    title: "Autonomous Commute Booking",
    description:
      "Set your weekly schedule once. Bhavo reserves your ride, assigns your dedicated captain, and alerts you before pickup with zero manual taps.",
    accent: "#14b8a6",
    tag: "Rider Portal",
  },
  {
    icon: "⟁",
    category: "rider",
    title: "Surge-Free Fare Lock",
    description:
      "Commute subscriptions shield you from rain or peak-hour surges. Enjoy transparent, flat daily rates guaranteed all month long.",
    accent: "#06b6d4",
    tag: "Rider Portal",
  },
  {
    icon: "◎",
    category: "rider",
    title: "Live GPS & Safety Sharing",
    description:
      "Pinpoint sub-meter vehicle tracking, secure OTP authentication, and automated ride progress sharing with family or team members.",
    accent: "#10b981",
    tag: "Rider Portal",
  },

  // Driver / Captain Features
  {
    icon: "⚡",
    category: "driver",
    title: "Real-Time Dispatch Radar",
    description:
      "Instant high-priority trip dispatches delivered directly to your captain console with pickup distance, passenger rating, and upfront net fare.",
    accent: "#38bdf8",
    tag: "Captain Hub",
  },
  {
    icon: "◈",
    category: "driver",
    title: "Zero Deadhead Commute Batches",
    description:
      "Our corridor-matching engine chains recurring daily commuters along your habitual route, eliminating empty driving miles.",
    accent: "#6366f1",
    tag: "Captain Hub",
  },
  {
    icon: "💰",
    category: "driver",
    title: "Instant Same-Day Payouts",
    description:
      "Zero commission penalties, direct bank deposits within minutes of shift completion, and daily incentive bonuses with full transparency.",
    accent: "#f59e0b",
    tag: "Captain Hub",
  },
  {
    icon: "⬡",
    category: "driver",
    title: "Dynamic Surge Heatmaps",
    description:
      "Live geo-spatial demand heatmaps show real-time multiplier zones, high-density pickup hubs, and airport surge queues before you arrive.",
    accent: "#ec4899",
    tag: "Captain Hub",
  },

  // Platform Unified Features
  {
    icon: "🛡️",
    category: "platform",
    title: "Verified Identity & Telematics",
    description:
      "Comprehensive background checks, biometric KYC, vehicle safety compliance, and telematics scoring ensuring 5-star standard rides.",
    accent: "#2dd4bf",
    tag: "Ecosystem",
  },
];

export const COMMUTER_STEPS: Step[] = [
  {
    number: "01",
    title: "Configure Commute Rhythm",
    description:
      "Input your home, workspace, and target arrival times. Bhavo crafts a personalized recurring commute profile in seconds.",
    highlight: "60-sec Setup",
  },
  {
    number: "02",
    title: "Predictive Captain Pairing",
    description:
      "Our AI pairs you with a top-rated EV or premium vehicle captain already headed along your transit corridor.",
    highlight: "99.8% Match Rate",
  },
  {
    number: "03",
    title: "Step Out & Ride Effortlessly",
    description:
      "Your car is stationed at your door right on schedule. No morning delays, no surge surprises, just smooth productivity.",
    highlight: "Zero Daily Taps",
  },
];

export const STEPS: Step[] = COMMUTER_STEPS;

export const DRIVER_STEPS: Step[] = [
  {
    number: "01",
    title: "Go Online with 1 Tap",
    description:
      "Toggle your shift active in the Captain Hub. Set your preferred zones, hours, and direction to get matched immediately.",
    highlight: "Flexible Shifts",
  },
  {
    number: "02",
    title: "Accept High-Yield Corridors",
    description:
      "Receive guaranteed recurring commuter bookings along high-density routes with zero empty return trips.",
    highlight: "Upfront Net Pay",
  },
  {
    number: "03",
    title: "Instant Daily Earnings",
    description:
      "Track your shift metrics, peak surge bonuses, and cash out your daily earnings directly to your bank account anytime.",
    highlight: "Instant Payout",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya Sharma",
    role: "Product Lead",
    company: "Infosys Bangalore",
    type: "rider",
    avatar: "PS",
    quote:
      "Bhavo's Commuter Portal completely transformed my mornings. The recurring schedule means my EV is waiting at 8:40 AM sharp, and I arrive relaxed.",
    rating: 5,
  },
  {
    name: "Vikram Rathore",
    role: "Elite Fleet Captain (4.98★)",
    company: "Bhavo Captain Network",
    type: "driver",
    avatar: "VR",
    quote:
      "The Captain Hub is hands-down the best driver dashboard I've used. Chained commute bookings give me ₹52,000/month with zero dry mileage and instant daily payouts.",
    rating: 5,
  },
  {
    name: "Rahul Mehta",
    role: "VP Operations",
    company: "FinEdge Capital",
    type: "rider",
    avatar: "RM",
    quote:
      "Having our whole tech team onboarded with locked monthly fares reduced our corporate commute logistics overhead by 34% in one quarter.",
    rating: 5,
  },
  {
    name: "Sunil K. Desai",
    role: "Full-Time Captain",
    company: "Pune City Fleet",
    type: "driver",
    avatar: "SD",
    quote:
      "The live heatmaps and direct dispatch radar keep me busy during rush hours without endless roaming. Transparent fares make all the difference.",
    rating: 5,
  },
];

export const STATS = [
  { value: "50,000+", label: "Daily Active Commuters", glow: "#0d9488" },
  { value: "12,500+", label: "Verified Captains", glow: "#14b8a6" },
  { value: "99.8%", label: "On-Time Dispatch Precision", glow: "#38bdf8" },
  { value: "0%", label: "Surge Penalty Guarantee", glow: "#818cf8" },
];

export const NAV_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Our Services", href: "/our-services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Why BHAVO", href: "/why-us" },
  { label: "Terms & Policies", href: "/terms-and-policies" },
  { label: "Contact Us", href: "/contact" },
];
