import { Banner } from "@/components/sections/Banner";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { PAGE_TITLES } from "@/constants";
import { usePageTitle } from "@/hooks/usePageTitle";
import { features } from "@/pages/Cards/cards.data";

import { BankingCard } from "./components/BankingCard";
import { PricingSection } from "./components/PricingSection";

export default function Cards() {
  usePageTitle(PAGE_TITLES.CARDS);

  return (
    <>
      <PageHero
        heading={
          <>
            The card that <span className="text-brand-accent">works harder</span> for you
          </>
        }
        subheading="Each cashback on every purchase, pay nothing abroad, and control your spending - all from one beautifully simple card."
        primaryButton={{ label: "Apply Now", href: "/contact" }}
        secondaryButton={{ label: "Compare Cards", href: "#pricing" }}
        backgroundImage="/banners/Cards-banner.avif"
      >
        <BankingCard />
      </PageHero>
      <PricingSection />
      <CardGrid
        title="Built for how you pay"
        subtitle="Every card comes loaded with features that make your money work for you."
        features={features}
        horizontal
      />
      <Banner
        heading="Choose your card today"
        subheading="Join thousands who earn more with every swipe. Apply in minutes."
        primaryButton={{ label: "Apply Now", href: "/contact" }}
      />
    </>
  );
}
