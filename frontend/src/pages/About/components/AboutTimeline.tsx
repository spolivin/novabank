import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { Section } from "@/components/layout/Section";
import { TimelineStep } from "@/components/ui/TimelineStep";

import { timelineSteps } from "../about.data";

export const AboutTimeline = () => (
  <Section>
    <motion.div {...scrollAnimation} className="text-center mb-5">
      <h2 className="text-3xl font-bold leading-tight text-brand-fg">How we got here</h2>
      <p className="text-brand-fg-muted mt-3 max-w-xl mx-auto">
        From idea to millions of users — the NovaBank story.
      </p>
    </motion.div>

    <div className="relative overflow-x-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-accent/30 -translate-x-1/2" />
      {timelineSteps.map((step, index) => (
        <TimelineStep key={index} number={index + 1} {...step} />
      ))}
    </div>
  </Section>
);
