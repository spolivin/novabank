import { PageHero } from "@/components/sections/PageHero";
import { CardGrid } from "@/components/sections/CardGrid";
import { TestimonialSection } from "@/pages/Home/components/TestimonialSection";
import { PartnerMarquee } from "@/pages/Home/components/PartnerMarquee";
import { Banner } from "@/components/sections/Banner";
import { PARTNERS, features, TESTIMONIALS } from "./home.data";
import { AppMockupSection } from "./components/AppMockupSection";

export default function Home() {
  return (
    <>
      {/* Hero section */}
      <PageHero
        heading="The Future of Banking"
        subheading="Manage your money with confidence. Instant transfers, smart budgeting, and bank-grade security - all in one beautifully simple app."
        primaryButton={{ label: "Open Account", href: "/personal" }}
        secondaryButton={{ label: "Learn More", href: "/about" }}
      />
      {/* Partner slider */}
      <PartnerMarquee partners={PARTNERS} />
      <CardGrid
        title="Everything you need"
        subtitle="From everyday banking to long-term savings, NovaBank has every tool you need to take control of your finances."
        features={features}
      />
      <AppMockupSection />
      <TestimonialSection
        title="What our customers are saying"
        testimonials={TESTIMONIALS}
      />
      <Banner
        heading="Start banking smarter today"
        subheading="Join over 500,000 people who trust NovaBank with their finances."
        primaryButton={{ label: "Get Started", href: "/personal" }}
      />
    </>
  );
}
