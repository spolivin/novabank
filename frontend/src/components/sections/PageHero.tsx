import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { Section } from "../layout/Section";

interface BaseHeroProps {
  heading: ReactNode;
  subheading: string;
  primaryButton?: { label: string; href: string };
  secondaryButton?: { label: string; href: string };
  badge?: string;
  features?: { title: string }[];
}

interface DefaultHeroProps extends BaseHeroProps {
  variant?: "default";
  children?: ReactNode;
}

interface CenteredHeroProps extends BaseHeroProps {
  variant: "centered";
}

const motionProps = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
} as const;

type PageHeroProps = DefaultHeroProps | CenteredHeroProps;

export function PageHero({
  variant,
  heading,
  subheading,
  primaryButton,
  secondaryButton,
  badge,
  features,
  ...rest
}: PageHeroProps) {
  const children = "children" in rest ? rest.children : undefined;
  if (variant === "centered") {
    return (
      <Section className="bg-hero flex items-center overflow-hidden min-h-[640px]">
        <motion.div {...motionProps}>
          <div className="max-w-5xl mx-auto text-center">
            {badge && (
              <div className="inline-block bg-brand-accent/20 text-brand-accent text-xs font-medium px-4 py-2 rounded-full mb-6">
                {badge}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-fg">
              {heading}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-brand-fg-muted">{subheading}</p>
            <div className="mt-10 flex flex-wrap gap-4 items-center justify-center">
              {primaryButton && (
                <Button variant="primary" href={primaryButton.href}>
                  {primaryButton.label}
                </Button>
              )}
              {secondaryButton && (
                <Button variant="secondary" href={secondaryButton.href}>
                  {secondaryButton.label}
                </Button>
              )}
            </div>
            {features && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-brand-fg-muted text-sm font-medium">
                {features.map((feature) => (
                  <span key={feature.title} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-brand-accent" />
                    {feature.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </Section>
    );
  }
  return (
    <Section className="bg-hero flex items-center justify-center overflow-hidden min-h-[640px]">
      <motion.div
        {...motionProps}
        className="flex flex-col lg:flex-row items-center justify-between gap-16"
      >
        <div className="max-w-3xl">
          {badge && (
            <div className="inline-block bg-brand-accent/20 text-brand-accent text-xs font-medium px-4 py-2 rounded-full mb-6">
              {badge}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-brand-fg">
            {heading}
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-brand-fg-muted">{subheading}</p>
          <div className="mt-10 flex flex-wrap gap-4 items-center">
            {primaryButton && (
              <Button variant="primary" href={primaryButton.href}>
                {primaryButton.label}
              </Button>
            )}
            {secondaryButton && (
              <Button variant="secondary" href={secondaryButton.href}>
                {secondaryButton.label}
              </Button>
            )}
          </div>
          {features && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-brand-fg-muted text-sm font-medium">
              {features.map((feature) => (
                <span key={feature.title} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-brand-accent" />
                  {feature.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {children && <div className="shrink-0">{children}</div>}
      </motion.div>
    </Section>
  );
}
