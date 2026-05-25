import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { scrollAnimation } from "@/animations";
import { RoleCard, type Department } from "@/components/ui/RoleCard";
import { Section } from "@/components/layout/Section";
import { type Role } from "../careers.data";

interface RoleListProps {
  title: string;
  subtitle: string;
  roles: Role[];
}

export const RoleList = ({ title, subtitle, roles }: RoleListProps) => {
  const [activeFilter, setActiveFilter] = useState<"All" | Department>("All");

  const departments = useMemo(
    () => ["All" as const, ...new Set(roles.map((r) => r.department))],
    [roles],
  );

  const effectiveFilter = departments.includes(activeFilter) ? activeFilter : "All";

  const filteredRoles =
    effectiveFilter === "All"
      ? roles
      : roles.filter((role) => role.department === effectiveFilter);

  return (
    <Section id="roles">
      <motion.div {...scrollAnimation}>
        <div className="text-center">
          <h2 className="text-brand-fg font-bold text-3xl">{title}</h2>
          <p className="text-brand-fg-muted mt-3">{subtitle}</p>
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {departments.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                effectiveFilter === filter
                  ? "bg-brand-accent text-white"
                  : "bg-brand-surface text-brand-fg-muted hover:text-brand-fg"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 gap-3 mt-6 max-w-3xl mx-auto"
          >
            {filteredRoles.map(({ id, ...role }) => (
              <RoleCard key={id} {...role} />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Section>
  );
};
