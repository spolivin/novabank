import { Button } from "@/components/ui/Button";

import type { PricingRow, PricingTier } from "../cards.data";

interface PricingTableProps {
  tiers: readonly { name: PricingTier; price: string; highlighted: boolean }[];
  rows: PricingRow[];
}

export const PricingTable = ({ tiers, rows }: PricingTableProps) => (
  <div className="rounded-xl border border-brand-fg/20 overflow-hidden">
    <table className="w-full text-sm table-fixed">
      <thead>
        <tr className="text-center">
          <th className="w-39 px-4 py-10 border-r border-b border-brand-fg/20" />
          {tiers.map(({ name, price, highlighted }, i) => (
            <th
              key={name}
              className={`relative font-medium px-4 py-10 border-b border-brand-fg/20${i < tiers.length - 1 ? " border-r" : ""}${highlighted ? " bg-brand-accent/10" : ""}`}
            >
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
              <span className="block font-bold text-brand-fg-muted text-sm mt-1">{price}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={row.feature}
            className={`${rowIndex === rows.length - 1 ? "border-b border-brand-fg/20" : ""} ${rowIndex % 2 === 0 ? "bg-brand-bg" : "bg-brand-surface/20"}`}
          >
            <td className="text-brand-fg-muted border-r border-brand-fg/20 px-4 py-4 text-left">
              {row.feature}
            </td>
            {tiers.map(({ name, highlighted }, i) => (
              <td
                key={name}
                className={`text-center font-semibold py-4${i < tiers.length - 1 ? " border-r border-brand-fg/20" : ""} ${highlighted ? "bg-brand-accent/5 text-brand-accent" : "text-brand-fg"}`}
              >
                {row.values[name]}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <td className="border-r border-brand-fg/20 px-4 py-4" />
          {tiers.map(({ name, highlighted }, i) => (
            <td
              key={name}
              className={`text-center px-4 py-4${i < tiers.length - 1 ? " border-r border-brand-fg/20" : ""}${highlighted ? " bg-brand-accent/7" : ""}`}
            >
              <Button variant={highlighted ? "accentCard" : "secondary"} fullWidth>
                Apply
              </Button>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
);
