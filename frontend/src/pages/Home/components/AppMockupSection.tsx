import { Check } from "lucide-react";
import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { Section } from "@/components/layout/Section";

const bullets = [
  "Instant account setup in under 2 minutes",
  "Free international transfers",
  "No monthly fees, ever",
];

export const AppMockupSection = () => (
  <Section className="bg-brand-surface">
    <motion.div {...scrollAnimation} className="flex flex-col md:flex-row items-center gap-10">
      <img src="/AppMockup.webp" alt="NovaBank app mockup" className="w-80 shrink-0" />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-brand-fg">
            Your bank in your pocket
          </h2>
          <p className="text-brand-fg-muted mt-3">
            The NovaBank app puts your entire financial life at your fingertips - elegant, fast, and
            always available.
          </p>
        </div>
        <ul className="space-y-3 mt-8 max-w-sm text-left">
          {bullets.map((item) => (
            <li key={item} className="flex items-center gap-3 text-brand-fg-muted">
              <Check className="text-brand-accent flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  </Section>
);
