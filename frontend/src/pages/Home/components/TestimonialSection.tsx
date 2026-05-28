import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { Section } from "@/components/layout/Section";
import { TestimonialCarousel, type TestimonialItem } from "@/components/ui/TestimonialCarousel";

interface TestimonialSectionProps {
  title: string;
  testimonials: TestimonialItem[];
}

export const TestimonialSection = ({ title, testimonials }: TestimonialSectionProps) => {
  return (
    <Section>
      <motion.div {...scrollAnimation}>
        <h2 className="text-3xl font-bold leading-tight text-center text-brand-fg mb-12">
          {title}
        </h2>
        <TestimonialCarousel testimonials={testimonials} />
      </motion.div>
    </Section>
  );
};
