// careers.data.ts

import { type RoleProps } from "@/components/ui/RoleCard";

export interface Perk {
  icon: string;
  title: string;
  description: string;
}

export interface Value {
  icon: string;
  title: string;
  description: string;
}

export interface Role extends RoleProps {
  id: string;
}

// ─── Why NovaBank ────────────────────────────────────────────
export const values: Value[] = [
  {
    icon: "🚀",
    title: "Grow fast",
    description:
      "We invest in your development with a dedicated learning budget, mentorship, and clear progression paths.",
  },
  {
    icon: "🌍",
    title: "Work remotely",
    description:
      "Fully remote-first culture with flexible hours. Work from wherever you do your best thinking.",
  },
  {
    icon: "💡",
    title: "Make an impact",
    description:
      "Small teams, real ownership. Your work ships to millions of users — no bureaucracy in the way.",
  },
  {
    icon: "🤝",
    title: "People first",
    description:
      "We hire for character and curiosity. Diverse, kind, and direct — the team you actually want to work with.",
  },
];

// ─── Open roles ──────────────────────────────────────────────
export const roles: Role[] = [
  {
    id: "1",
    title: "Senior ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build and maintain the ML infrastructure powering our fraud detection and personalisation systems. You will design and deploy models at scale, work closely with data engineers to shape our feature pipelines, and own model quality from experimentation through to production. We expect you to bring deep knowledge of modern ML stacks and a strong instinct for when a simple model beats a complex one.",
    stack: ["Python", "PyTorch", "Kafka", "Spark", "AWS"],
  },
  {
    id: "2",
    title: "Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Craft fast, accessible React interfaces used by millions of customers across web and mobile. You will collaborate with designers to turn high-fidelity prototypes into polished, production-ready components, champion performance and accessibility standards, and help establish the patterns that the rest of the frontend team builds on. Strong TypeScript and a good eye for detail are a must.",
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
  },
  {
    id: "3",
    title: "Backend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Design and scale the APIs and services that power real-time payments and account management. You will architect new microservices, improve reliability and observability of existing systems, and work closely with product and compliance teams to ship features without compromising security or uptime. Experience with high-throughput, low-latency distributed systems is expected.",
    stack: ["Go", "PostgreSQL", "Kubernetes", "gRPC", "Terraform"],
  },
  {
    id: "4",
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description:
      "Own the end-to-end design process from research to high-fidelity prototypes for our core product. You will run user interviews, map journeys, identify friction points, and produce designs that balance clarity with delight. You will work directly with engineers to ensure what ships matches what was designed, and feed learnings back into the product roadmap.",
    stack: ["Figma", "Maze", "Lottie", "Storybook"],
  },
  {
    id: "5",
    title: "Brand Designer",
    department: "Design",
    location: "Remote",
    type: "Part-time",
    description:
      "Shape the visual identity of NovaBank across marketing, social, and product surfaces. You will maintain and evolve our brand guidelines, produce assets for campaigns and feature launches, and ensure every touchpoint feels consistent and premium. You bring a strong portfolio of brand work and can move quickly from concept to final asset without losing quality.",
    stack: ["Figma", "Illustrator", "After Effects"],
  },
  {
    id: "6",
    title: "Customer Operations Lead",
    department: "Operations",
    location: "Hybrid",
    type: "Full-time",
    description:
      "Lead our customer support function, building processes and a team that delivers world-class service. You will define escalation workflows, own key satisfaction metrics, hire and coach support specialists, and act as the voice of the customer in product discussions. This role requires equal parts empathy, operational rigour, and a drive to make things better every week.",
    stack: ["Zendesk", "Notion", "Looker", "Slack"],
  },
  {
    id: "7",
    title: "Compliance Analyst",
    department: "Operations",
    location: "Remote",
    type: "Full-time",
    description:
      "Ensure NovaBank meets regulatory requirements across all markets while we scale internationally. You will monitor changing regulations, conduct internal audits, maintain our compliance documentation, and partner with legal and engineering to implement controls. You are comfortable translating dense regulatory language into clear, actionable requirements for the product team.",
    stack: ["Jira", "Confluence", "OneTrust", "Excel"],
  },
];

// ─── Culture points ───────────────────────────────────────────
export const culturePoints: string[] = [
  "Async-first communication — no pointless meetings",
  "Transparent salaries and equity for everyone",
  "Ship fast, learn faster — we celebrate smart failures",
  "Quarterly offsites to connect in person",
];

// ─── Perks ───────────────────────────────────────────────────
export const perks: Perk[] = [
  {
    icon: "🏥",
    title: "Health coverage",
    description: "Full medical, dental, and vision for you and your family.",
  },
  {
    icon: "📈",
    title: "Equity",
    description:
      "Meaningful equity stake so you share in what we build together.",
  },
  {
    icon: "📚",
    title: "Learning budget",
    description: "$2,000 per year for courses, books, and conferences.",
  },
  {
    icon: "🖥️",
    title: "Home office setup",
    description: "Full equipment budget to build the workspace you need.",
  },
  {
    icon: "🏖️",
    title: "Unlimited PTO",
    description: "Take the time you need. We trust you to manage your energy.",
  },
  {
    icon: "👶",
    title: "Parental leave",
    description: "16 weeks fully paid leave for all new parents.",
  },
];
