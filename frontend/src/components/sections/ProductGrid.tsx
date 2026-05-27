import { motion } from "motion/react";
import { ProductCard, type ProductCardProps } from "@/components/ui/ProductCard";
import { Section } from "@/components/layout/Section";
import { scrollAnimation } from "@/animations";

interface ProductGridProps {
  title: string;
  subtitle: string;
  products: ProductCardProps[];
}

export const ProductGrid = ({ title, subtitle, products }: ProductGridProps) => (
  <Section>
    <motion.div {...scrollAnimation}>
      <div className="text-center">
        <h2 className="text-brand-fg font-bold text-3xl">{title}</h2>
        <p className="text-brand-fg-muted mt-3">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 mt-10">
        {products.map((product) => (
          <ProductCard key={product.title} {...product} />
        ))}
      </div>
    </motion.div>
  </Section>
);
