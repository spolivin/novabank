import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { LOAN_TYPES } from "../loans.data";
import { Section } from "@/components/layout/Section";

export function LoanTypeTabs() {
  const [activeId, setActiveId] = useState(LOAN_TYPES[0].id);
  const active = LOAN_TYPES.find((t) => t.id === activeId)!;

  return (
    <Section>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-brand-fg">Find the right loan for you</h2>
        <p className="mt-3 text-brand-fg-muted">Flexible options to fit every financial goal.</p>
      </div>

      {/* Tab bar */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex gap-1 bg-brand-surface border border-brand-border rounded-2xl p-1.5">
          {LOAN_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveId(type.id)}
              className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                type.id === activeId ? "text-brand-bg" : "text-brand-fg-muted hover:text-brand-fg"
              }`}
            >
              {type.id === activeId && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 bg-brand-accent rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <motion.div
        key={activeId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-2xl mx-auto bg-brand-surface border border-brand-border rounded-2xl p-8"
      >
        <div className="mb-6">
          <p className="text-sm text-brand-fg-muted uppercase tracking-wider mb-1">Rate range</p>
          <p className="text-2xl font-bold text-brand-accent">{active.rateRange}</p>
        </div>

        <div>
          <p className="text-sm text-brand-fg-muted uppercase tracking-wider mb-4">
            Eligibility requirements
          </p>
          <ul className="flex flex-col gap-3">
            {active.eligibility.map((item) => (
              <li key={item} className="flex items-center gap-3 text-brand-fg">
                <Check className="w-4 h-4 text-brand-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </Section>
  );
}
