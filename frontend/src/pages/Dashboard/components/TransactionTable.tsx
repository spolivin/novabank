import { motion } from "motion/react";
import { scrollAnimation } from "@/animations";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount >= 0 ? "+" : "-"}$${abs}`;
}

export default function TransactionTable({ transactions }: { transactions: Transaction[] }) {
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
          <tbody>
            {transactions.map((tx, i) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
