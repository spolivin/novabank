export const ROUTES = {
  HOME: "/",
  PERSONAL: "/personal",
  BUSINESS: "/business",
  CARDS: "/cards",
  LOANS: "/loans",
  SECURITY: "/security",
  ABOUT: "/about",
  CONTACT: "/contact",
  CAREERS: "/careers",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
} as const;

export const NAV_LINKS = [
  { label: "Personal", to: ROUTES.PERSONAL },
  { label: "Business", to: ROUTES.BUSINESS },
  { label: "Cards", to: ROUTES.CARDS },
  { label: "Loans", to: ROUTES.LOANS },
  { label: "Security", to: ROUTES.SECURITY },
  { label: "About", to: ROUTES.ABOUT },
] as const;

export const PAGE_TITLES = {
  PERSONAL: "NovaBank - Personal",
  BUSINESS: "NovaBank - Business",
  CARDS: "NovaBank - Cards",
  LOANS: "NovaBank - Loans",
  SECURITY: "NovaBank - Security",
  ABOUT: "NovaBank - About",
  CONTACT: "NovaBank - Contact",
  CAREERS: "NovaBank - Careers",
  NOT_FOUND: "NovaBank - Page Not Found",
  LOGIN: "NovaBank - Login",
  SIGNUP: "NovaBank - Sign Up",
  DASHBOARD: "NovaBank - Dashboard",
} as const;
