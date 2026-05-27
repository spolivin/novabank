import { useState } from "react";
import { motion } from "motion/react";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";
import { pricingTiers, pricingTiersAnnual } from "../cards.data";
import { PricingCards } from "./PricingCards";
import { PricingTable } from "./PricingTable";

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const tiers = isAnnual ? pricingTiersAnnual : pricingTiers;

  return (
    <Section id="pricing">
      <motion.div {...scrollAnimation}>
        <div className="text-center mb-10">
          <h2 className="text-brand-fg font-bold text-3xl">Choose your card</h2>
          <p className="text-brand-fg-muted mt-3">Pick the card that matches how you spend.</p>
          <div className="inline-flex items-center rounded-full mt-6 gap-5">
            <span
              className={`text-xs font-medium ${!isAnnual ? "text-brand-fg" : "text-brand-fg-muted"}`}
            >
              Monthly
            </span>
            <div
              className="relative rounded-full w-16 h-8 bg-brand-surface"
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <div
                className={`absolute w-8 h-8 rounded-full bg-brand-fg/50 transition-transform duration-200 ${isAnnual ? "translate-x-8" : "translate-x-0"}`}
              />
            </div>
            <span
              className={`text-xs font-medium ${isAnnual ? "text-brand-fg" : "text-brand-fg-muted"}`}
            >
              Annual
            </span>
            <span className="text-xs font-semibold bg-brand-accent/20 text-brand-accent rounded-full px-2 py-1 ml-2">
              Save ~ 16%
            </span>
          </div>
        </div>

        <div className="md:hidden">
          <PricingCards tiers={tiers} />
        </div>
        <div className="hidden md:block">
          <PricingTable tiers={tiers} />
        </div>
      </motion.div>
    </Section>
  );
};
