import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { type Partner } from "@/pages/Home/home.data.tsx";

interface PartnerMarqueeProps {
  partners: Partner[];
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
      <div className="flex w-max animate-marquee items-center">
        {partners.concat(partners).map((partner, i) => (
          <a
            key={i}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={partner.name}
            className="flex-shrink-0 mx-12"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-8 w-auto object-contain transition-opacity hover:opacity-70"
            />
          </a>
        ))}
      </div>
    </motion.div>
  );
};
