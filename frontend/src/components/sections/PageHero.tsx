import { type ReactNode, useCallback, useState } from "react";

import { Check } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/Button";
import { bannerFallback, bannerSrcSet } from "@/lib/banners";

import { Section } from "../layout/Section";

interface BaseHeroProps {
  heading: ReactNode;
  subheading: string;
  primaryButton?: { label: string; href: string };
  secondaryButton?: { label: string; href: string };
  badge?: string;
  features?: { title: string }[];
  /** Base name of a banner in public/banners, e.g. "Home-banner". */
  banner?: string;
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

// The navbar is transparent until scrolled, so the hero is pulled up under it
// and pads itself back out — the background image runs full-bleed behind the bar.
// min-h absorbs the 72px header so the visible hero keeps its original height.
const heroClass =
  "bg-hero relative isolate flex items-center overflow-hidden -mt-[72px] pt-[72px] min-h-[712px]";

export function PageHero({
  variant,
  heading,
  subheading,
  primaryButton,
  secondaryButton,
  badge,
  features,
  banner,
  ...rest
}: PageHeroProps) {
  const children = "children" in rest ? rest.children : undefined;
  const [loaded, setLoaded] = useState(false);

  // A cached image can finish loading before React attaches onLoad, which would
  // strand it at opacity-0. Catch that case when the node is first attached.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  const background = banner && (
    <>
      <img
        ref={imgRef}
        // sizes/srcSet before src: React assigns props in order, so this keeps a
        // browser from ever starting a fetch for the fallback and then aborting
        // it once the candidate list arrives.
        sizes="100vw"
        srcSet={bannerSrcSet(banner)}
        src={bannerFallback(banner)}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        // The section's bg-hero gradient shows through until the image arrives,
        // so a slow network degrades to the brand gradient instead of a flash.
        className={`absolute inset-0 w-full h-full object-cover -z-20 transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, rgba(13,43,69,0.82) 0%, rgba(26,74,110,0.82) 100%)",
        }}
      />
    </>
  );

  if (variant === "centered") {
    return (
      <Section className={heroClass}>
        {background}
        <motion.div {...motionProps} className="w-full">
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
    <Section className={`${heroClass} justify-center`}>
      {background}
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
