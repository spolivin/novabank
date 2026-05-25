import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export default function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-4 rounded-2xl bg-brand-surface p-6"
    >
      <div className="flex items-center justify-center bg-brand-accent/20 rounded-xl w-12 h-12 text-brand-accent shrink-0">
        <Icon size={22} />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-brand-fg-muted font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-brand-fg">{value}</p>
      </div>
    </motion.div>
  );
}
