import { Button } from "./Button";
import { Check } from "lucide-react";

export interface ProductCardProps {
  title: string;
  price: string;
  features: string[];
  featured?: boolean;
}

export const ProductCard = ({
  title,
  price,
  features,
  featured,
}: ProductCardProps) => (
  <div
    className={`relative rounded-lg px-6 py-8 flex flex-col gap-6 ${featured ? "bg-accent" : "bg-brand-surface"}`}
  >
    <div>
      <h3
        className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${featured ? "text-brand-surface" : "text-brand-fg"}`}
      >
        {title}
      </h3>
      <p
        className={`text-lg sm:text-xl md:text-2xl font-bold ${featured ? "text-brand-surface" : "text-brand-accent"}`}
      >
        ${price}/mo
      </p>
    </div>
    <ul className="space-y-3 text-sm md:text-base">
      {features.map((item) => (
        <li
          key={item}
          className={`flex items-center gap-3 ${featured ? "text-brand-surface" : "text-brand-fg-muted"}`}
        >
          <Check
            className={`flex-shrink-0 ${featured ? "text-brand-surface" : "text-brand-accent"}`}
          />
          {item}
        </li>
      ))}
    </ul>
    {featured ? (
      <Button variant="accentCard">Get Started</Button>
    ) : (
      <Button variant="darkCard">Get Started</Button>
    )}
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-surface text-sm text-brand-accent font-semibold px-3 py-1 rounded-full">
        Most Popular
      </div>
    )}
  </div>
);
