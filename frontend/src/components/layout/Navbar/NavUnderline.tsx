import { motion } from "motion/react";

/**
 * The single active-route indicator in the desktop bar. Every nav item renders
 * the same `layoutId`, so Motion animates one underline between them instead of
 * hard-swapping a static border. Only ever one is mounted (one active route).
 */
export function NavUnderline() {
  return (
    <motion.span
      layoutId="nav-underline"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand-accent"
    />
  );
}
