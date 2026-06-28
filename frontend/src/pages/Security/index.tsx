import { ShieldCheck } from "lucide-react";

import { Banner } from "@/components/sections/Banner";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { PAGE_TITLES } from "@/constants";
import { usePageTitle } from "@/hooks/usePageTitle";

import { BadgeGrid } from "./components/BadgeGrid";
import { FraudProtectionSection } from "./components/FraudProtectionSection";
import { features, securityFeatures } from "./security.data";

export default function Security() {
  usePageTitle(PAGE_TITLES.SECURITY);

  return (
    <>
      <PageHero
        heading={
          <>
            Your money is <span className="text-brand-accent">safe with us</span>
          </>
        }
        subheading="Security is our top priority. With state-of-the-art encryption, 24/7 monitoring, and a dedicated fraud team, we ensure your finances are protected around the clock."
        badge="Bank-grade security"
        features={[
          { title: "State-of-the-Art Encryption" },
          { title: "24/7 Monitoring" },
          { title: "Dedicated Fraud Team" },
        ]}
      >
        <div className="flex items-center justify-center bg-brand-accent/20 rounded-full text-brand-accent w-80 h-80">
          <ShieldCheck size={128} />
        </div>
      </PageHero>
      <CardGrid
        title="Three pillars of protection"
        subtitle="Layered security built from the ground up to keep your money and data safe."
        features={features}
      />
      <BadgeGrid
        title="Independently certified"
        subtitle="Our security practices are audited and certified by leading third-party organizations."
        features={securityFeatures}
      />
      <FraudProtectionSection />
      <Banner
        heading="Bank with confidence"
        subheading="Join NovaBank and experience security that never sleeps."
        primaryButton={{ label: "Open a Secure Account", href: "/contact" }}
      />
    </>
  );
}
