import { useState } from "react";

import { FlaskConical, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <motion.div
          role="region"
          aria-label="Demo notice"
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative overflow-hidden border-b border-brand-accent/25 bg-brand-surface"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-brand-accent/15 via-transparent to-brand-accent/15"
          />
          <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-2 px-10 py-2 sm:gap-2.5 sm:px-12 sm:py-2.5 text-xs text-brand-fg-muted sm:text-sm">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent ring-1 ring-brand-accent/30 sm:text-xs">
              <FlaskConical className="hidden size-3 sm:block" aria-hidden="true" />
              Demo
            </span>
            <p className="text-center">
              <span className="font-semibold text-brand-fg">NovaBank is not a real bank.</span>{" "}
              <span className="hidden sm:inline">
                Please don&apos;t enter real personal or financial information.
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss demo notice"
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-brand-fg-muted transition-colors hover:bg-white/5 hover:text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-accent"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
