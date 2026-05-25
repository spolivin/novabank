import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PAGE_TITLES } from "@/constants";
import { PageHero } from "@/components/sections/PageHero";
import { Banner } from "@/components/sections/Banner";
import { LoanCalculator } from "./components/LoanCalculator";
import { LoanConfiguratorCard } from "./components/LoanConfiguratorCard";
import { LoanTypeTabs } from "./components/LoanTypeTabs";
import { AMOUNT_DEFAULT, TERM_DEFAULT, type Term } from "./loans.data";

export default function Loans() {
  usePageTitle(PAGE_TITLES.LOANS);
  const [amount, setAmount] = useState(AMOUNT_DEFAULT);
  const [term, setTerm] = useState<Term>(TERM_DEFAULT);

  return (
    <>
      <PageHero
        badge="Smart lending"
        heading={
          <>
            Loans built around{" "}
            <span className="text-brand-accent">your life</span>
          </>
        }
        subheading="Competitive rates, instant decisions, and zero hidden fees. Configure your loan below and see your payments in real time."
      >
        <LoanConfiguratorCard
          amount={amount}
          term={term}
          onAmountChange={setAmount}
          onTermChange={setTerm}
        />
      </PageHero>

      <LoanCalculator amount={amount} termMonths={term} />
      <LoanTypeTabs />
      <Banner
        heading="Apply in 5 minutes"
        subheading="No paperwork, no branch visits. Get a decision instantly and funds in your account within 24 hours."
        primaryButton={{ label: "Start your application", href: "/contact" }}
      />
    </>
  );
}
