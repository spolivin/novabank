const allTransactions: {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}[] = [
  {
    id: "1",
    date: "2026-05-12",
    description: "Salary deposit",
    category: "Income",
    amount: 5200.0,
  },
  {
    id: "2",
    date: "2026-05-11",
    description: "Whole Foods Market",
    category: "Groceries",
    amount: -134.72,
  },
  {
    id: "3",
    date: "2026-05-10",
    description: "Netflix",
    category: "Subscriptions",
    amount: -15.99,
  },
  {
    id: "4",
    date: "2026-05-09",
    description: "Freelance payment",
    category: "Income",
    amount: 850.0,
  },
  {
    id: "5",
    date: "2026-05-08",
    description: "Electric bill",
    category: "Utilities",
    amount: -98.4,
  },
  { id: "6", date: "2026-05-07", description: "Uber", category: "Transport", amount: -22.5 },
  { id: "7", date: "2026-05-06", description: "Amazon", category: "Shopping", amount: -67.3 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function seedFromUserId(id: string) {
  const seed = parseInt(id.replace(/-/g, "").slice(0, 8), 16);
  const rand = seededRandom(seed);

  const accountBalance = 1200 + Math.floor(rand() * 13800);
  const monthlySpending = 200 + Math.floor(rand() * 2800);
  const savingsGoal = 5000 + Math.floor(rand() * 45000);
  const savingsProgress = Math.round(savingsGoal * (0.1 + rand() * 0.8));

  const shuffled = [...allTransactions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    summary: { accountBalance, monthlySpending, savingsGoal, savingsProgress },
    transactions: shuffled.slice(0, 5),
  };
}
