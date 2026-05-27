import { motion, useMotionValue, useTransform } from "motion/react";

interface BankingCardProps {
  cardholderName?: string;
  lastFour?: string;
}

export const BankingCard = ({
  cardholderName = "Jane Doe",
  lastFour = "1234",
}: BankingCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clamp = (val: number) => Math.max(-0.4, Math.min(0.4, val));

    x.set(clamp((e.clientX - centerX) / rect.width));
    y.set(clamp((e.clientY - centerY) / rect.height));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.div
        className="w-80 sm:w-96 lg:w-110 bg-accent rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-7"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        transition={{ type: "spring", stiffness: 200, damping: 40 }}
      >
        <div className="flex justify-between">
          <p className="font-bold text-base sm:text-xl">NovaBank</p>
          <div className="flex">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-surface/50 rounded-full" />
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-surface/30 rounded-full -translate-x-3" />
          </div>
        </div>
        <div className="w-14 h-10 sm:w-18 sm:h-13 bg-brand-fg/40 rounded-lg" />
        <div>
          <p className="text-lg sm:text-2xl font-bold tracking-widest">**** **** **** {lastFour}</p>
          <div className="flex justify-between">
            <p className="uppercase text-sm sm:text-base">{cardholderName}</p>
            <p className="text-sm sm:text-base">12/28</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
