import type { ReactNode } from "react";

import { motion } from "motion/react";

interface CardProps {
  horizontal?: boolean;
  icon?: ReactNode;
  title?: string;
  description: string;
  tag?: string;
}

const motionProps = {
  whileHover: { y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

export const Card = ({ horizontal = false, icon, title, description, tag }: CardProps) => (
  <motion.div
    {...motionProps}
    className={`flex gap-4 rounded-2xl p-8 bg-brand-surface ${
      horizontal ? "flex-row items-center" : "flex-col items-start"
    }`}
  >
    <div className="flex items-center justify-center bg-brand-accent/20 rounded-xl w-12 h-12 text-brand-accent shrink-0">
      {icon}
    </div>
    <div className="flex flex-col gap-2">
      {title && <p className="text-xl font-semibold text-brand-fg">{title}</p>}
      {tag && <span className="font-medium text-xs text-brand-accent">{tag}</span>}
      <p className="text-sm text-brand-fg-muted">{description}</p>
    </div>
  </motion.div>
);
