import { APR } from "./loans.data";

export function buildAmortization(principal: number, termMonths: number) {
  const monthlyRate = APR / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  let balance = principal;
  let totalInterest = 0;
  const data: { month: number; balance: number }[] = [{ month: 0, balance: Math.round(balance) }];

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance -= payment - interest;
    data.push({ month: i, balance: Math.max(0, Math.round(balance)) });
  }

  return { payment, totalInterest, data };
}
