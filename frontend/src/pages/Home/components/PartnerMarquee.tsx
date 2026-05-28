import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";

interface PartnerMarqueeProps {
  partners: string[];
}

export const PartnerMarquee = ({ partners }: PartnerMarqueeProps) => {
  return (
    <motion.div
      {...scrollAnimation}
      className="bg-brand-surface border-y border-brand-border py-10 overflow-hidden"
    >
      <p className="text-center text-xl font-semibold uppercase tracking-widest text-brand-fg-muted mb-8">
        Trusted by industry leaders
      </p>
      <div className="flex animate-marquee">
        {partners.concat(partners).map((name, i) => (
          <span
            key={i}
            className="flex-shrink-0 mx-12 text-brand-fg-muted font-semibold text-lg whitespace-nowrap"
          >
            {name}
          </span>
        ))}
      </div>
    </motion.div>
  );
};
