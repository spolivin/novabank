import { Button } from "./Button";

interface PricingCardProps {
  name: string;
  price: string;
  highlighted?: boolean;
  rows: { feature: string; value: string }[];
}

export const PricingCard = ({ name, price, highlighted = false, rows }: PricingCardProps) => (
  <div
    className={`snap-center shrink-0 w-[80vw] rounded-xl border p-6 flex flex-col gap-4 ${highlighted ? "bg-brand-accent/10 border-brand-accent/40" : "border-brand-fg/20"}`}
  >
    <div>
      {highlighted && (
        <span className="inline-block text-xs font-semibold text-brand-bg bg-brand-accent rounded-full px-3 py-1 mb-2">
          Most Popular
        </span>
      )}
      <span
        className={`block font-bold text-xl ${highlighted ? "text-brand-accent" : "text-brand-fg"}`}
      >
        {name}
      </span>
      <span className="block text-brand-fg-muted text-sm mt-1">{price}</span>
    </div>
    <div className="flex flex-col gap-3 flex-1">
      {rows.map(({ feature, value }) => (
        <div key={feature} className="flex justify-between gap-4">
          <span className="text-brand-fg-muted text-sm">{feature}</span>
          <span
            className={`text-sm font-semibold ${highlighted ? "text-brand-accent" : "text-brand-fg"}`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
    <Button variant={highlighted ? "accentCard" : "secondary"} fullWidth>
      Apply
    </Button>
  </div>
);
