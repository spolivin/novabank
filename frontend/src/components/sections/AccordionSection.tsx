import { motion } from "motion/react";
import { AccordionGroup, type AccordionItem } from "@/components/ui/Accordion";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";

interface AccordionSectionProps {
  title: string;
  subtitle: string;
  items: AccordionItem[];
}

export const AccordionSection = ({
  title,
  subtitle,
  items,
}: AccordionSectionProps) => {
  return (
    <Section>
      <motion.div {...scrollAnimation}>
        <div className="text-center">
          <h2 className="text-3xl font-bold leading-tight text-brand-fg">
            {title}
          </h2>
          <p className="text-brand-fg-muted mt-3">{subtitle}</p>
        </div>
        <div className="max-w-2xl mx-auto mt-8">
          <AccordionGroup items={items} />
        </div>
      </motion.div>
    </Section>
  );
};
