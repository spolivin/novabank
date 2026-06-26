export const pricingTiers = [
  { name: "Classic", price: "$8/mo", highlighted: false },
  { name: "Gold", price: "$18/mo", highlighted: true },
  { name: "Platinum", price: "$35/mo", highlighted: false },
] as const;

export const pricingTiersAnnual = [
  { name: "Classic", price: "$80/year", highlighted: false },
  { name: "Gold", price: "$180/year", highlighted: true },
  { name: "Platinum", price: "$350/year", highlighted: false },
] as const;

export type PricingTier = (typeof pricingTiers)[number]["name"];

export type PricingRow = {
  feature: string;
  values: Record<PricingTier, string>;
};

export const pricingRows: PricingRow[] = [
  {
    feature: "Cashback",
    values: { Classic: "0.5%", Gold: "1.5%", Platinum: "3%" },
  },
  {
    feature: "Foreign transaction fee",
    values: { Classic: "3%", Gold: "1.5%", Platinum: "None" },
  },
  {
    feature: "Credit limit",
    values: {
      Classic: "Up to $5,000",
      Gold: "Up to $20,000",
      Platinum: "Up to $100,000",
    },
  },
  {
    feature: "Lounge access",
    values: { Classic: "None", Gold: "2 visits/year", Platinum: "Unlimited" },
  },
];

export const features = [
  {
    icon: <img src="/icons/Cards/Contactless-Payments.svg" alt="" />,
    title: "Contactless Payments",
    description:
      "Make secure payments with a simple tap. Fast, convenient, and accepted worldwide.",
  },
  {
    icon: <img src="/icons/Cards/Apple-Pay-Google-Pay.svg" alt="" />,
    title: "Apple Pay & Google Pay",
    description:
      "Pay with your phone using Apple Pay or Google Pay. Enjoy the convenience of mobile payments wherever you go.",
  },
  {
    icon: <img src="/icons/Cards/Instant-Freeze.svg" alt="" />,
    title: "Instant Freeze",
    description:
      "Lost your card? No worries. Instantly freeze your card from the app to prevent unauthorized transactions.",
  },
  {
    icon: <img src="/icons/Cards/Spending-Limits.svg" alt="" />,
    title: "Spending Limits",
    description:
      "Take control of your finances by setting daily, weekly, or monthly spending limits on your card. Stay on budget effortlessly.",
  },
];
