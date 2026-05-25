import { PageHero } from "@/components/sections/PageHero";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PAGE_TITLES } from "@/constants";
import { CardGrid } from "@/components/sections/CardGrid";
import {
  features,
  products,
  steps,
  faqs,
} from "@/pages/Business/business.data";
import { StepSection } from "@/components/sections/StepSection";
import { AccordionSection } from "@/components/sections/AccordionSection";
import { Banner } from "@/components/sections/Banner";

export default function Business() {
  usePageTitle(PAGE_TITLES.BUSINESS);

  return (
    <>
      <PageHero
        heading={
          <>
            Banking built{" "}
            <span className="text-brand-accent">for your business</span>
          </>
        }
        subheading="Powerful tools for invoicing, team spending, and integrations - all in one account. Grow with confidence and zero hidden fees."
        primaryButton={{ label: "Open a Business Account", href: "/contact" }}
        secondaryButton={{ label: "Talk to Sales", href: "/contact" }}
      />
      <ProductGrid
        title="Choose your account"
        subtitle="Pick the plan that works for you. Upgrade or downgrade any time - no lock-in."
        products={products}
      />
      <CardGrid
        title="Built for how you work"
        subtitle="Every feature designed to help your business grow faster."
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
      <Banner
        heading="Ready to grow your business with NovaBank?"
        subheading="Join thousands of businesses who trust us to power their finances."
        primaryButton={{ label: "Open a Business Account", href: "/contact" }}
      />
    </>
  );
}
