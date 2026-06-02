import { motion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { scrollAnimation } from "@/animations";
import { Section } from "@/components/layout/Section";

import { buildAmortization } from "../buildAmortization";
import { APR } from "../loans.data";

interface Props {
  amount: number;
  termMonths: number;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fmtDecimal = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function LoanCalculator({ amount, termMonths }: Props) {
  const { payment, totalInterest, data } = buildAmortization(amount, termMonths);

  return (
    <Section className="bg-brand-surface">
      <motion.div {...scrollAnimation}>
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-brand-fg">Your estimated payments</h2>
          <p className="mt-2 text-brand-fg-muted">
            Based on {APR}% APR — actual rates may vary based on credit profile.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Monthly payment" value={fmtDecimal.format(payment)} accent />
          <StatCard label="Total interest" value={fmt.format(totalInterest)} />
          <StatCard label="Total repayment" value={fmt.format(amount + totalInterest)} />
        </div>

        <div className="bg-brand-bg rounded-2xl border border-brand-border p-6">
          <p className="text-sm font-medium text-brand-fg-muted mb-6 uppercase tracking-wider">
            Remaining balance over time
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-brand-border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="var(--color-brand-fg-muted)"
                tick={{ fill: "var(--color-brand-fg-muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Month",
                  position: "insideBottom",
                  offset: -2,
                  fill: "var(--color-brand-fg-muted)",
                  fontSize: 12,
                }}
              />
              <YAxis
                stroke="var(--color-brand-fg-muted)"
                tick={{ fill: "var(--color-brand-fg-muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-brand-surface)",
                  border: "1px solid var(--color-brand-border)",
                  borderRadius: "0.75rem",
                  color: "var(--color-brand-fg)",
                }}
                formatter={(value) =>
                  typeof value === "number"
                    ? [fmt.format(value), "Balance"]
                    : [String(value), "Balance"]
                }
                labelFormatter={(label) => `Month ${label}`}
                cursor={{ stroke: "var(--color-brand-border)" }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--color-brand-accent)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "var(--color-brand-accent)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </Section>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent ? "bg-brand-accent/10 border-brand-accent/30" : "bg-brand-bg border-brand-border"
      }`}
    >
      <p className="text-sm text-brand-fg-muted uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-brand-accent" : "text-brand-fg"}`}>
        {value}
      </p>
    </div>
  );
}
