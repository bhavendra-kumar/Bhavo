/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  accent: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
export const FEATURES: Feature[] = [
  {
    icon: "✦",
    title: "AI Route Optimisation",
    description:
      "Our model ingests live traffic, weather, and historical patterns to find your fastest path — automatically, every single day.",
    accent: "#0d9488",
  },
  {
    icon: "⟳",
    title: "Commute Automation",
    description:
      "Set your schedule once. Bhavo books your ride, notifies your driver, and adjusts for delays so you never have to think about it.",
    accent: "#6366f1",
  },
  {
    icon: "◈",
    title: "Premium Driver Network",
    description:
      "Every Bhavo driver is background-verified, rated above 4.8, and trained in professional commute standards.",
    accent: "#f59e0b",
  },
  {
    icon: "⬡",
    title: "Corporate Accounts",
    description:
      "Unified billing, per-employee ride limits, and real-time dashboards built for finance and HR teams.",
    accent: "#ec4899",
  },
  {
    icon: "◎",
    title: "Real-Time Tracking",
    description:
      "Share your live ETA with family or colleagues. Get instant alerts when your driver is 2 minutes away.",
    accent: "#14b8a6",
  },
  {
    icon: "⟁",
    title: "Smart Pricing",
    description:
      "Commute subscriptions lock in your rate. No surge pricing, no surprises — just transparent, flat daily fares.",
    accent: "#a855f7",
  },
];

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Set Your Commute",
    description:
      "Enter your home, office, and preferred departure time. Bhavo builds your personalised commute profile in under 60 seconds.",
  },
  {
    number: "02",
    title: "AI Matches Your Driver",
    description:
      "Our algorithm selects the optimal driver on your route — considering vehicle type, rating, and real-time position.",
  },
  {
    number: "03",
    title: "Ride, Repeat",
    description:
      "Your ride is confirmed automatically every morning. No taps, no searching — just walk out and your car is waiting.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya Sharma",
    role: "Product Lead",
    company: "Infosys",
    avatar: "PS",
    quote:
      "Bhavo has completely eliminated the stress of my morning commute. I haven't opened another ride-hailing app in three months.",
    rating: 5,
  },
  {
    name: "Rahul Mehta",
    role: "CFO",
    company: "FinEdge Capital",
    avatar: "RM",
    quote:
      "The corporate dashboard gave us full visibility into employee travel spend. We cut commute costs by 31% in the first quarter.",
    rating: 5,
  },
  {
    name: "Ananya Iyer",
    role: "Senior Engineer",
    company: "TechCorp",
    avatar: "AI",
    quote:
      "The AI rerouting is genuinely impressive — it caught a traffic jam on my usual highway and saved me 18 minutes this morning.",
    rating: 5,
  },
];

export const STATS = [
  { value: "500+", label: "Partner Companies" },
  { value: "50k+", label: "Daily Commuters" },
  { value: "10k+", label: "Premium Drivers" },
  { value: "4.9★", label: "Average Rating" },
];

export const NAV_LINKS = ["Features", "How it Works", "Contact"];


