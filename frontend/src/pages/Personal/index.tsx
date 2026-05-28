import { AccordionSection } from "@/components/sections/AccordionSection";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { StepSection } from "@/components/sections/StepSection";
import { PAGE_TITLES } from "@/constants";
import { usePageTitle } from "@/hooks/usePageTitle";
import { faqs, features, products, steps } from "@/pages/Personal/personal.data";

export default function Personal() {
  usePageTitle(PAGE_TITLES.PERSONAL);

  return (
    <>
      <PageHero
        heading={
          <>
            Banking that <span className="text-brand-accent">fits your life</span>
          </>
        }
        subheading="Simple, transparent accounts with no hidden fees. Built for the way you live - whether you're saving for a goal or spending every day."
        primaryButton={{ label: "Open Account", href: "/contact" }}
        secondaryButton={{ label: "See Our Cards", href: "/cards" }}
      />
      <ProductGrid
        title="Choose your account"
        subtitle="Pick the plan that works for you. Upgrade or downgrade any time - no lock-in."
        products={products}
      />
      <CardGrid
        title="Built around your needs"
        subtitle="Every feature designed to make your life easier - from instant notifications to automatic savings."
        features={features}
        horizontal
      />
      <StepSection
        title="Up and running in minutes"
        subtitle="Opening a NovaBank account is the simplest thing you'll do all day. Just follow these 3 easy steps and you'll be ready to start banking on your terms."
        steps={steps}
      />
      <AccordionSection
        title="Common questions"
        subtitle="Everything you need to know about our accounts, fees, and features."
        items={faqs}
      />
    </>
  );
}
