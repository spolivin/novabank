import { motion } from "motion/react";

export interface TimelineStepProps {
  number: number;
  year: string;
  title: string;
  description: string;
  side: "left" | "right";
}

const viewportOpts = { once: true, margin: "-80px" as const };

export const TimelineStep = ({ number, year, title, description, side }: TimelineStepProps) => {
  const isLeft = side === "left";

  return (
    <div className="relative flex items-center py-10">
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 bg-accent w-10 h-10 shrink-0 font-bold rounded-full flex items-center justify-center text-brand-bg"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewportOpts}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
      >
        {number}
      </motion.div>

      <motion.div
        className={`w-[calc(50%-3rem)] flex flex-col gap-3 ${isLeft ? "mr-auto text-right" : "ml-auto text-left"}`}
        initial={{ opacity: 0, x: isLeft ? -32 : 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={viewportOpts}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-brand-accent font-semibold">{year}</p>
        <h3 className="font-bold text-brand-fg">{title}</h3>
        <p className="text-brand-fg-muted text-sm">{description}</p>
      </motion.div>
    </div>
  );
};
