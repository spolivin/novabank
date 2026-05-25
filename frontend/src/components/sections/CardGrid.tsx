import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";

interface Feature {
  icon: ReactNode;
  title?: string;
  description: string;
  tag?: string;
}

interface CardGridProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  horizontal?: boolean;
}

export const CardGrid = ({
  title,
  subtitle,
  features,
  horizontal = false,
}: CardGridProps) => (
  <Section>
    <motion.div {...scrollAnimation}>
      <div className={`text-center ${horizontal ? "mb-5" : ""}`}>
        <h2 className="text-3xl font-bold leading-tight text-brand-fg">
          {title}
        </h2>
        <p className="text-brand-fg-muted mt-3">{subtitle}</p>
      </div>
      <div
        className={
          horizontal
            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10"
        }
      >
        {features.map((feature, index) => (
          <Card
            key={feature.title ?? index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            tag={feature.tag}
            horizontal={horizontal}
          />
        ))}
      </div>
    </motion.div>
  </Section>
);
