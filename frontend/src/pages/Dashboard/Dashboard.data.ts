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

  return {
    summary: { accountBalance, monthlySpending, savingsGoal, savingsProgress },
  };
}
