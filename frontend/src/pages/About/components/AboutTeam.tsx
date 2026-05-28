import { motion } from "motion/react";

import { scrollAnimation } from "@/animations";
import { Section } from "@/components/layout/Section";
import { TeamCard } from "@/components/ui/TeamCard";

import { teamMembers } from "../about.data";

export const AboutTeam = () => (
  <Section>
    <motion.div {...scrollAnimation}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold leading-tight text-brand-fg">Meet the team</h2>
        <p className="text-brand-fg-muted mt-3 max-w-xl mx-auto">
          The people building the future of banking — one thoughtful decision at a time.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <TeamCard key={member.name} {...member} />
        ))}
      </div>
    </motion.div>
  </Section>
);
