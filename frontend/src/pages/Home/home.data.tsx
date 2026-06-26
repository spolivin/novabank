import { type TestimonialItem } from "@/components/ui/TestimonialCarousel";

export interface Partner {
  name: string;
  logo: string;
}

export const PARTNERS: Partner[] = [
  { name: "Visa", logo: "/partners/Visa.svg" },
  { name: "Mastercard", logo: "/partners/MasterCard.svg" },
  { name: "PayPal", logo: "/partners/PayPal.svg" },
  { name: "Stripe", logo: "/partners/Stripe.svg" },
  { name: "Goldman Sachs", logo: "/partners/GoldmanSachs.svg" },
  { name: "JPMorgan", logo: "/partners/J-P-Morgan.svg" },
  { name: "BlackRock", logo: "/partners/BlackRock.svg" },
  { name: "Fidelity", logo: "/partners/Fidelity.svg" },
];

export const features = [
  {
    icon: <img src="/icons/Home/Instant-Transfers.svg" alt="" />,
    title: "Instant Transfers",
    description: "Send and receive money in seconds - 24/7, no delays, no hidden fees.",
  },
  {
    icon: <img src="/icons/Home/Virtual-Cards.svg" alt="" />,
    title: "Virtual Cards",
    description: "Generate one-time or recurring virtual cards for safe online shopping.",
  },
  {
    icon: <img src="/icons/Home/Saving-Goals.svg" alt="" />,
    title: "Saving Goals",
    description: "Set targets, track progress, and automate round-ups toward what matters most.",
  },
  {
    icon: <img src="/icons/Home/Smart-Budgeting.svg" alt="" />,
    title: "Smart Budgeting",
    description: "AI-powered spending insights automatically categorize your transactions.",
  },
  {
    icon: <img src="/icons/Home/Bank-Grade-Security.svg" alt="" />,
    title: "Bank-Grade Security",
    description: "AES-256 encryption, biometric auth, and real-time fraud detection protect you.",
  },
  {
    icon: <img src="/icons/Home/Global-Access.svg" alt="" />,
    title: "Global Access",
    description: "Spend in 150+ currencies with no foreign transaction fees, anywhere on Earth.",
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "NovaBank changed the way I manage my finances. Instant transfers and zero fees — I'll never go back to a traditional bank.",
    name: "Sarah Chen",
    role: "Freelance Designer",
  },
  {
    quote:
      "Finally a bank that works as fast as I do. The virtual cards feature saved me from fraud twice already.",
    name: "Marcus Johnson",
    role: "Software Engineer",
  },
  {
    quote:
      "The savings goals feature helped me save for my first home in 18 months. Genuinely life-changing.",
    name: "Amira Patel",
    role: "Product Manager",
  },
  {
    quote:
      "I love how transparent and user-friendly the app is. The budgeting insights have helped me cut unnecessary expenses.",
    name: "Liam O'Connor",
    role: "Entrepreneur",
  },
  {
    quote:
      "As someone who travels frequently, the global access and no-fee currency exchange have been a game-changer for me.",
    name: "Sofia Martinez",
    role: "Travel Blogger",
  },
];
