import { Banner } from "@/components/sections/Banner";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { PAGE_TITLES } from "@/constants";
import { usePageTitle } from "@/hooks/usePageTitle";

import { roles, values } from "./careers.data";
import { RoleList } from "./components/RoleList";

export default function Careers() {
  usePageTitle(PAGE_TITLES.CAREERS);
  return (
    <>
      <PageHero
        heading=<>
          Build the future <span className="text-brand-accent">of finance</span>
        </>
        subheading="We are a team of builders, thinkers, and problem solvers on a mission to make banking work for everyone. Come build with us."
        primaryButton={{ label: "Check vacancies", href: "#roles" }}
        backgroundImage="/banners/Careers-banner.avif"
        variant="centered"
      />
      <CardGrid title="Why NovaBank" features={values} horizontal />
      <RoleList
        title="Check out available vacancies"
        subtitle="Do not be afraid to apply!"
        roles={roles}
      />
      <Banner
        heading="Do not see a role that fits?"
        subheading="Send us your CV!"
        primaryButton={{ label: "Apply", href: "/contact" }}
      />
    </>
  );
}
