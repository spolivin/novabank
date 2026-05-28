import { motion } from "motion/react";

import type { TeamMember } from "@/pages/About/about.data";

export const TeamCard = ({ name, role, bio, avatar }: TeamMember) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div
      className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex flex-col gap-4"
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center text-sm text-brand-accent font-semibold flex-shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-brand-fg">{name}</p>
          <p className="text-xs text-brand-fg-muted">{role}</p>
        </div>
      </div>
      <p className="text-sm text-brand-fg-muted leading-relaxed">{bio}</p>
    </motion.div>
  );
};
