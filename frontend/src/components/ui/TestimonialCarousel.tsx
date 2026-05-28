import { useEffect, useRef, useState } from "react";

import { Quote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { scrollAnimation } from "@/animations";

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface TestimonialCarouselProps {
  testimonials: TestimonialItem[];
  intervalMs?: number;
}

export const TestimonialCarousel = ({
  testimonials,
  intervalMs = 5000,
}: TestimonialCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, intervalMs);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonials.length]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    startTimer();
  };

  if (!testimonials.length) return null;

  const active = testimonials[activeIndex];
  // Derive initials for the avatar placeholder
  const initials = active.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div {...scrollAnimation}>
      <div className="max-w-3xl mx-auto text-center">
        {/* Quote area */}
        <div style={{ minHeight: "180px" }} className="flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Opening quote mark */}
              <div className="flex flex-col">
                <Quote className="text-brand-accent mb-4 ml-auto rotate-180" />
                <p className="text-xl md:text-2xl text-brand-fg italic leading-relaxed">
                  {active.quote}
                </p>
                <Quote className="text-brand-accent mb-4" />
              </div>

              {/* Attribution */}
              <div className="mt-8 flex items-center justify-center gap-3">
                {active.avatar ? (
                  <img
                    src={active.avatar}
                    alt={active.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center text-sm text-brand-accent font-semibold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm text-brand-fg font-semibold">{active.name}</p>
                  <p className="text-xs text-brand-fg-muted">{active.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot navigation */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
              className={[
                "h-2 rounded-full outline-none transition-all duration-300 relative overflow-hidden bg-brand-border",
                i === activeIndex ? "w-6" : "w-2",
              ].join(" ")}
            >
              {i === activeIndex && (
                <span
                  style={{ animationDuration: `${intervalMs}ms` }}
                  className="absolute inset-0 bg-brand-accent rounded-full animate-progress-fill origin-left"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
