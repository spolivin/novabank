import { PricingCard } from "@/components/ui/PricingCard";

import { pricingRows } from "../cards.data";
import type { PricingTier } from "../cards.data";

interface PricingCardsProps {
  tiers: readonly { name: PricingTier; price: string; highlighted: boolean }[];
}

export const PricingCards = ({ tiers }: PricingCardsProps) => (
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6">
    {tiers.map(({ name, price, highlighted }) => (
      <PricingCard
        key={name}
        name={name}
        price={price}
        highlighted={highlighted}
        rows={pricingRows.map((row) => ({ feature: row.feature, value: row.values[name] }))}
      />
    ))}
  </div>
);
