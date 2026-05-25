import { usePageTitle } from "@/hooks/usePageTitle";
import { PAGE_TITLES } from "@/constants";
import { PageHero } from "@/components/sections/PageHero";
import { CardGrid } from "@/components/sections/CardGrid";
import { RoleList } from "./components/RoleList";
import { Banner } from "@/components/sections/Banner";
import { values, roles, perks } from "./careers.data";

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
        variant="centered"
      />
      <CardGrid title="Why NovaBank" features={values} horizontal />
      <RoleList
        title="Checkout available vacancies"
        subtitle="Do not be afraid to apply!"
        roles={roles}
      />
      <CardGrid title="Perks & benefits" features={perks} />
      <Banner
        heading="Do not see a role that fits?"
        subheading="Send us your CV!"
        primaryButton={{ label: "Apply", href: "/contact" }}
      />
    </>
  );
}
