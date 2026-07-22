import { Link } from "react-router-dom";

import { ROUTES } from "@/constants";

import { MobileMenu } from "./MobileMenu";
import { NavActions } from "./NavActions";
import { NavMenu } from "./NavMenu";
import { NAV_GROUPS } from "./navbar.data";
import { useScrolled } from "./useScrolled";

export default function Navbar() {
  const scrolled = useScrolled();

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-bg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60"
      >
        Skip to content
      </a>
      <header
        className={[
          "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-brand-border bg-brand-bg/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        ].join(" ")}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-8 px-6"
        >
          <Link to={ROUTES.HOME} aria-label="NovaBank home" className="shrink-0">
            <img src="/logos/Nova-Bank-Logo.svg" alt="NovaBank" className="h-8 w-auto" />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_GROUPS.map((group) => (
              <li key={group.label}>
                <NavMenu {...group} />
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <NavActions />
          </div>

          <MobileMenu />
        </nav>
      </header>
    </>
  );
}
