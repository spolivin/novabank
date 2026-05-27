import { motion } from "motion/react";
import { Step, type StepProps } from "@/components/ui/Step";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";

interface StepSectionProps {
  title: string;
  subtitle: string;
  steps: StepProps[];
}

export const StepSection = ({ title, subtitle, steps }: StepSectionProps) => {
  return (
    <Section className="text-brand-fg">
      <motion.div {...scrollAnimation} className="text-center mb-5">
        <h2 className="text-3xl font-bold leading-tight text-brand-fg">{title}</h2>
        <p className="text-brand-fg-muted mt-3 max-w-xl mx-auto">{subtitle}</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
        {steps.map((step, index) => (
          <Step
            key={index}
            number={index + 1}
            title={step.title}
            description={step.description}
            isLast={index === steps.length - 1}
            delay={index * 0.15}
          />
        ))}
      </div>
    </Section>
  );
};
