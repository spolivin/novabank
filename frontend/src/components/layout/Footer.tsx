import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";

const PRODUCT_LINKS = [
  { to: ROUTES.PERSONAL, label: "Personal" },
  { to: ROUTES.BUSINESS, label: "Business" },
  { to: ROUTES.CARDS, label: "Cards" },
  { to: ROUTES.LOANS, label: "Loans" },
];

const COMPANY_LINKS = [
  { to: ROUTES.ABOUT, label: "About Us" },
  { to: ROUTES.SECURITY, label: "Security" },
  { to: ROUTES.CONTACT, label: "Contact" },
  { to: ROUTES.CAREERS, label: "Careers" },
];

const SOCIAL_LINKS = [
  {
    href: "https://twitter.com",
    label: "Twitter / X",
  },
  {
    href: "https://linkedin.com",
    label: "LinkedIn",
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
  },
  {
    href: "https://github.com",
    label: "GitHub",
  },
];

export default function Footer() {
  return (
    <footer className="px-6 md:px-10 bg-brand-surface">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-xs text-brand-fg-muted border-b-1 border-brand-fg-muted/10 py-10">
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4 max-w-[200px]">
          <Link to={ROUTES.HOME} className="text-brand-fg font-bold text-xl">
            Nova<span className="text-brand-accent">Bank</span>
          </Link>
          <span>The future of banking, today. Simple, secure, and built for your life.</span>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-sm md:text-xl font-bold text-brand-fg uppercase">Products</h2>
          {PRODUCT_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="hover:underline self-start">
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-sm md:text-xl font-bold text-brand-fg uppercase">Company</h2>
          {COMPANY_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="hover:underline self-start">
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-sm md:text-xl font-bold text-brand-fg uppercase">Follow us</h2>
          {SOCIAL_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline self-start"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center text-brand-fg-muted py-10">
        @{new Date().getFullYear()} NovaBank. All rights reserved.
      </div>
    </footer>
  );
}
