import { Nfc } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";

interface BankingCardProps {
  cardholderName?: string;
  lastFour?: string;
}

export const BankingCard = ({
  cardholderName = "Jane Doe",
  lastFour = "1234",
}: BankingCardProps) => {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring the raw values so rotation and glare share the same physics
  const x = useSpring(rawX, { stiffness: 200, damping: 40 });
  const y = useSpring(rawY, { stiffness: 200, damping: 40 });

  const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-7, 7]);

  const glareX = useTransform(x, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(y, [-0.5, 0.5], [20, 80]);
  const rawGlareOpacity = useMotionValue(0);
  const glareOpacity = useSpring(rawGlareOpacity, { stiffness: 200, damping: 40 });
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.25) 0%, transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clamp = (val: number) => Math.max(-0.4, Math.min(0.4, val));

    rawX.set(clamp((e.clientX - centerX) / rect.width));
    rawY.set(clamp((e.clientY - centerY) / rect.height));
    rawGlareOpacity.set(1);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
    rawGlareOpacity.set(0);
  };

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.div
        className="relative w-80 sm:w-96 lg:w-110 bg-accent rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-7"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: glareBackground, opacity: glareOpacity }}
        />
        <div className="flex justify-between">
          <p className="font-bold text-base sm:text-xl">NovaBank</p>
          <img src="/partners/MasterCard.svg" alt="Mastercard" className="w-12 sm:w-14" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-10 sm:w-18 sm:h-13 bg-brand-fg/40 rounded-lg" />
          <Nfc className="w-5 h-5 sm:w-6 sm:h-6 opacity-70" />
        </div>
        <div>
          <p className="text-lg sm:text-2xl font-bold tracking-widest">
            {"•••• •••• •••• "}
            {lastFour}
          </p>
          <div className="flex justify-between">
            <p className="uppercase text-sm sm:text-base">{cardholderName}</p>
            <p className="text-sm sm:text-base">12/28</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
