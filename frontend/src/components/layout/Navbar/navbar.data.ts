import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CreditCard,
  Landmark,
  Mail,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { ROUTES } from "@/constants";

export interface NavMenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: readonly NavMenuItem[];
}

/**
 * Every route in the bar, grouped. The desktop menus and the mobile drawer both
 * render straight off this, so adding a route is a one-line change here.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Products",
    items: [
      {
        label: "Personal",
        to: ROUTES.PERSONAL,
        icon: Wallet,
        description: "Everyday accounts, savings, and budgeting built in.",
      },
      {
        label: "Business",
        to: ROUTES.BUSINESS,
        icon: Building2,
        description: "Banking for teams, payroll, and growing companies.",
      },
      {
        label: "Cards",
        to: ROUTES.CARDS,
        icon: CreditCard,
        description: "Debit and credit cards with real-time controls.",
      },
      {
        label: "Loans",
        to: ROUTES.LOANS,
        icon: Landmark,
        description: "Personal, auto, and home loans at rates you can see.",
      },
    ],
  },
  {
    label: "Company",
    items: [
      {
        label: "About",
        to: ROUTES.ABOUT,
        icon: Users,
        description: "Our story, our team, and where we're headed.",
      },
      {
        label: "Security",
        to: ROUTES.SECURITY,
        icon: ShieldCheck,
        description: "How we protect your money and your data.",
      },
      {
        label: "Careers",
        to: ROUTES.CAREERS,
        icon: Briefcase,
        description: "Open roles and life at NovaBank.",
      },
      {
        label: "Contact",
        to: ROUTES.CONTACT,
        icon: Mail,
        description: "Talk to support or our partnerships team.",
      },
    ],
  },
];
