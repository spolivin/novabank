export const products = [
  {
    title: "Startup",
    price: "0",
    features: [
      "1 business debit card",
      "Basic invoicing tools",
      "Up to 2 team members",
      "Mobile app access",
    ],
    featured: false,
  },
  {
    title: "Growth",
    price: "19",
    features: [
      "Everything in Startup",
      "Unlimited invoicing",
      "Up to 10 team members",
      "Expense categorization",
    ],
    featured: true,
  },
  {
    title: "Enterprise",
    price: "49",
    features: [
      "Everything in Growth",
      "Unlimited team members",
      "Full API access",
      "Dedicated account manager",
    ],
    featured: false,
  },
];

export const features = [
  {
    icon: <img src="/icons/Business/Invoicing.svg" alt="" />,
    title: "Invoicing",
    description: "Create, send, and track professional invoices in seconds. Get paid faster.",
  },
  {
    icon: <img src="/icons/Business/Multi-User-Access.svg" alt="" />,
    title: "Multi-User Access",
    description:
      "Add team members with customizable permissions. Collaborate securely and efficiently.",
  },
  {
    icon: <img src="/icons/Business/API-Integrations.svg" alt="" />,
    title: "API Integrations",
    description:
      "Connect your account to your favorite tools and automate your workflows with our powerful API.",
  },
  {
    icon: <img src="/icons/Business/Expense-Management.svg" alt="" />,
    title: "Expense Management",
    description:
      "Easily categorize and track your expenses. Get insights to help your business grow.",
  },
];

export const steps = [
  {
    title: "Sign Up",
    description: "Create your account in under 2 minutes with just an email.",
  },
  {
    title: "Verify",
    description: "Provide some basic information to verify your identity and business details.",
  },
  {
    title: "Fund",
    description:
      "Add funds to your account using a bank transfer, debit card, or mobile check deposit.",
  },
];

export const faqs = [
  {
    question: "Are there any fees I should know about?",
    answer:
      "No hidden fees on your plan. We offer transparent pricing with no monthly maintenance fees on the Startup plan, and flat monthly rates for Growth and Enterprise. Incoming wires are always free, and outgoing domestic wires are included on Growth and above. Enterprise accounts also get unlimited team members and a dedicated account manager at no extra cost.",
  },
  {
    question: "How do I open a business account?",
    answer:
      "Opening a business account takes about 5 minutes. Click 'Open Account', fill in your business details — legal name, EIN, registered address, and a few details about your business type — and submit. We'll verify your business and notify you by email once approved. Most applications are reviewed within one business day.",
  },
  {
    question: "Can I upgrade or downgrade my plan later?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any time from your business dashboard with no lock-in periods or cancellation fees. Changes take effect at the start of your next billing cycle, so you're never charged for capacity you don't use.",
  },
  {
    question: "What security measures do you have in place?",
    answer:
      "Your business data and funds are protected with AES-256 encryption, real-time transaction monitoring, and role-based access controls so you can limit what each team member can see and do. We also support two-factor authentication on all accounts. Our support team is available 24/7 if you spot anything suspicious.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "Our business support team is available 24/7 by email at support@novabank.com. Enterprise customers also get a dedicated account manager reachable directly by phone.",
  },
  {
    question: "What if I have more questions?",
    answer:
      "No problem! If you have any other questions that aren't covered here, feel free to reach out to our support team. We're available 24/7 via email at support@novabank.com.",
  },
];
