import { Banner } from "@/components/sections/Banner";
import { PageHero } from "@/components/sections/PageHero";
import { PAGE_TITLES } from "@/constants";
import { usePageTitle } from "@/hooks/usePageTitle";

import { AboutTeam } from "./components/AboutTeam";
import { AboutTimeline } from "./components/AboutTimeline";

export default function About() {
  usePageTitle(PAGE_TITLES.ABOUT);

  return (
    <>
      <PageHero
        heading={
          <>
            "We believe banking should be{" "}
            <span className="text-brand-accent">transparent, instant,</span> and designed around{" "}
            <span className="text-brand-accent">your life</span> - not ours."
          </>
        }
        subheading="NovaBank was built from the ground up to replace the frustration of legacy banking with something better: zero hidden fees, real-time everything, and customer support that actually helps."
        badge="Our mission"
        variant="centered"
      />
      <AboutTimeline />
      <AboutTeam />
      <Banner
        heading="Join us - we are hiring"
        subheading="Help build the future of banking. We are looking for bold, curious people who want to make a real impact."
        primaryButton={{ label: "View open roles", href: "/careers" }}
      />
    </>
  );
}
