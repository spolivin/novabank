import { Banner } from "@/components/sections/Banner";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { PartnerMarquee } from "@/pages/Home/components/PartnerMarquee";
import { TestimonialSection } from "@/pages/Home/components/TestimonialSection";

import { AppMockupSection } from "./components/AppMockupSection";
import { PARTNERS, TESTIMONIALS, features } from "./home.data";

export default function Home() {
  return (
    <>
      {/* Hero section */}
      <PageHero
        heading="The Future of Banking"
        subheading="Manage your money with confidence. Instant transfers, smart budgeting, and bank-grade security - all in one beautifully simple app."
        primaryButton={{ label: "Open Account", href: "/personal" }}
        secondaryButton={{ label: "Learn More", href: "/about" }}
        backgroundImage="/banners/Home-banner.avif"
      />
      {/* Partner slider */}
      <PartnerMarquee partners={PARTNERS} />
      <CardGrid
        title="Everything you need"
        subtitle="From everyday banking to long-term savings, NovaBank has every tool you need to take control of your finances."
        features={features}
      />
      <AppMockupSection />
      <TestimonialSection title="What our customers are saying" testimonials={TESTIMONIALS} />
      <Banner
        heading="Start banking smarter today"
        subheading="Join over 500,000 people who trust NovaBank with their finances."
        primaryButton={{ label: "Get Started", href: "/personal" }}
      />
    </>
  );
}
