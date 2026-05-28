import type { ReactNode } from "react";

import { motion } from "motion/react";

interface BadgeProps {
  icon?: ReactNode;
  label?: string;
  description: string;
}

const motionProps = {
  whileHover: { y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

export const Badge = ({ icon, label, description }: BadgeProps) => (
  <motion.div
    {...motionProps}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl p-8 bg-brand-surface"
  >
    <div className="flex items-center justify-center bg-accent text-brand-bg rounded-full w-12 h-12">
      {icon}
    </div>
    <span className="bg-brand-accent/20 px-4 py-2 rounded-full font-medium text-xs text-brand-accent">
      {label}
    </span>
    <p className="text-sm text-brand-fg-muted text-center">{description}</p>
  </motion.div>
);
