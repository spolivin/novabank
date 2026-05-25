import type { TimelineStepProps } from "@/components/ui/TimelineStep";

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
}

export const teamMembers: TeamMember[] = [
  {
    name: "Sarah Chen",
    role: "Co-founder & CEO",
    bio: "Former VP at Stripe. Spent a decade reimagining payments infrastructure before founding Novabank.",
  },
  {
    name: "Marcus Webb",
    role: "Co-founder & CTO",
    bio: "Ex-Google engineer who led core banking platform development at Monzo before joining Sarah to build Novabank.",
  },
  {
    name: "Priya Nair",
    role: "Chief Product Officer",
    bio: "Product lead behind award-winning fintech apps at N26 and Revolut. Obsessed with removing friction from finance.",
  },
  {
    name: "James Okafor",
    role: "Chief Risk Officer",
    bio: "20 years in regulatory compliance at the Federal Reserve. Ensures Novabank operates with integrity at every layer.",
  },
  {
    name: "Lena Fischer",
    role: "Head of Design",
    bio: "Previously led design systems at Figma. Believes every banking interaction should feel as natural as a conversation.",
  },
  {
    name: "David Park",
    role: "Head of Engineering",
    bio: "Scaled infrastructure at Robinhood through 10x growth. Keeps Novabank fast, reliable, and secure around the clock.",
  },
];

export const timelineSteps: Omit<TimelineStepProps, "number">[] = [
  {
    year: "2019",
    side: "left",
    title: "Founded in San Francisco",
    description:
      "Novabank was incorporated by a team of fintech veterans and former regulators with one goal - build a bank that actually works for people, not the other way around.",
  },
  {
    year: "2020",
    side: "right",
    title: "First million customers",
    description:
      "Just 18 months after launch, Novabank crossed one million active customers — driven entirely by word of mouth. No branch network, no billboards. Just a product people genuinely wanted to tell their friends about.",
  },
  {
    year: "2022",
    side: "left",
    title: "Launched business banking",
    description:
      "Responding to demand from our own customers, we introduced dedicated business accounts with invoicing, multi-user access, and accounting integrations. Within a year, over 50,000 small businesses had made Novabank their primary bank.",
  },
  {
    year: "2024",
    side: "right",
    title: "Global expansion",
    description:
      "Novabank extended its reach to 40+ countries, enabling customers to spend in 150+ currencies with no foreign transaction fees. Our infrastructure now processes over $2 billion in cross-border payments every month.",
  },
];
