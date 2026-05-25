import { motion } from "motion/react";

export interface StepProps {
  title: string;
  description: string;
  isLast?: boolean;
}

const viewportOpts = { once: true, margin: "-80px" as const };

export const Step = ({
  number,
  title,
  description,
  isLast = false,
  delay = 0,
}: StepProps & { number: number; delay?: number }) => {
  return (
    <div className="relative flex flex-col items-center gap-5">
      {!isLast && (
        <motion.div
          className="hidden md:block absolute top-5 left-[calc(50%+20px)] right-[calc(-50%-20px)] h-px bg-brand-accent/30 origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={viewportOpts}
          transition={{ duration: 0.4, ease: "easeOut", delay: delay + 0.55 }}
        />
      )}

      <motion.div
        className="bg-accent w-10 h-10 font-bold rounded-full items-center justify-center flex text-brand-bg"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewportOpts}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: delay + 0.15 }}
      >
        {number}
      </motion.div>

      <motion.div
        className="flex flex-col gap-5 max-w-[190px]"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOpts}
        transition={{ duration: 0.5, ease: "easeOut", delay }}
      >
        <h3 className="font-bold text-center">{title}</h3>
        <p className="text-brand-fg-muted text-sm text-center">{description}</p>
      </motion.div>
    </div>
  );
};
