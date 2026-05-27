import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";

interface BadgeItem {
  icon: ReactNode;
  tag?: string;
  description: string;
}

interface BadgeGridProps {
  title: string;
  subtitle: string;
  features: BadgeItem[];
}

export const BadgeGrid = ({ title, subtitle, features }: BadgeGridProps) => (
  <Section>
    <motion.div {...scrollAnimation}>
      <div className="text-center">
        <h2 className="text-3xl font-bold leading-tight text-brand-fg">{title}</h2>
        <p className="text-brand-fg-muted mt-3">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-10">
        {features.map((feature, index) => (
          <Badge
            key={index}
            icon={feature.icon}
            label={feature.tag}
            description={feature.description}
          />
        ))}
      </div>
    </motion.div>
  </Section>
);
