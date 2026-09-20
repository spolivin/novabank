import type { ReactNode } from "react";

import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import type { Transaction } from "@/lib/api";

function formatDate(iso: string) {
  // Dates arrive as plain "YYYY-MM-DD", which parses as UTC midnight; format in UTC
  // too so viewers west of Greenwich don't see the previous day.
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatAmount(amount: number) {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount >= 0 ? "+" : "-"}$${abs}`;
}

function StatusRow({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={4} className="px-6 py-10 text-center">
        {children}
      </td>
    </tr>
  );
}

interface TransactionTableProps {
  /** `null` while the transactions are still loading. */
  transactions: Transaction[] | null;
  error?: boolean;
}

export default function TransactionTable({ transactions, error = false }: TransactionTableProps) {
  let body: ReactNode;
  if (error) {
    body = (
      <StatusRow>
        <span className="text-brand-error">Couldn't load transactions.</span>
      </StatusRow>
    );
  } else if (transactions === null) {
    body = (
      <StatusRow>
        <span className="inline-flex gap-1 items-center" aria-label="Loading transactions">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-brand-fg-muted animate-dot-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </StatusRow>
    );
  } else if (transactions.length === 0) {
    body = (
      <StatusRow>
        <span className="text-brand-fg-muted">No transactions found</span>
      </StatusRow>
    );
  } else {
    body = transactions.map((tx, i) => (
      <motion.tr
        key={tx.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05, duration: 0.3 }}
        className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
      >
        <td className="px-6 py-4 text-brand-fg-muted">{formatDate(tx.date)}</td>
        <td className="px-6 py-4 text-brand-fg font-medium">{tx.description}</td>
        <td className="px-6 py-4">
          <span className="px-2.5 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-medium">
            {tx.category}
          </span>
        </td>
        <td
          className={`px-6 py-4 text-right font-semibold tabular-nums ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {formatAmount(tx.amount)}
        </td>
      </motion.tr>
    ));
  }

  return (
    <motion.div {...scrollAnimation} className="rounded-2xl bg-brand-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-brand-fg-muted text-xs uppercase tracking-wide">
              <th className="text-left px-6 py-4 font-medium">Date</th>
              <th className="text-left px-6 py-4 font-medium">Description</th>
              <th className="text-left px-6 py-4 font-medium">Category</th>
              <th className="text-right px-6 py-4 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
    </motion.div>
  );
}
