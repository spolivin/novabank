import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";

const bullets = [
  "Instant account setup in under 2 minutes",
  "Free international transfers",
  "No monthly fees, ever",
];

export const AppMockupSection = () => (
  <Section className="bg-brand-surface">
    <motion.div
      {...scrollAnimation}
      className="flex flex-col md:flex-row items-center gap-10"
    >
      <div className="w-50 h-80 shrink-0 bg-brand-bg border-2 border-brand-accent rounded-lg flex items-center justify-center">
        <div className="w-30 h-60 bg-brand-surface/50" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-brand-fg">
            Your bank in your pocket
          </h2>
          <p className="text-brand-fg-muted mt-3">
            The NovaBank app puts your entire financial life at your fingertips
            - elegant, fast, and always available.
          </p>
        </div>
        <ul className="space-y-3 mt-8 max-w-sm">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-brand-fg-muted"
            >
              <Check className="text-brand-accent flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  </Section>
);
