import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { Button } from "@/components/ui/Button";

import { Section } from "../layout/Section";

interface BannerProps {
  heading: string;
  subheading: string;
  primaryButton: { label: string; href: string };
}

export const Banner = ({ heading, subheading, primaryButton }: BannerProps) => {
  return (
    <Section className="bg-accent text-brand-surface text-center">
      <motion.div {...scrollAnimation}>
        <h2 className="text-3xl md:text-4xl font-bold">{heading}</h2>
        <p className="mt-5 mb-5">{subheading}</p>
        <Button variant="dark" href={primaryButton.href}>
          {primaryButton.label}
        </Button>
      </motion.div>
    </Section>
  );
};
