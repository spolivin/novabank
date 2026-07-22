import { Link } from "react-router-dom";

import { ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";

import { UserMenu } from "./UserMenu";

export function NavActions() {
  const { isAuthenticated, loading } = useAuth();

  // Reserve the slot while Supabase resolves the session, otherwise the actions
  // pop in and shove the rest of the bar sideways on every load.
  if (loading) return <div className="h-10 w-44" aria-hidden="true" />;

  if (isAuthenticated) return <UserMenu />;

  return (
    <div className="flex items-center gap-1">
      <Link
        to={ROUTES.LOGIN}
        className="rounded-full px-4 py-2 text-sm font-medium text-brand-fg-muted transition-colors hover:text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        Log in
      </Link>
      <Link
        to={ROUTES.SIGNUP}
        className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-brand-bg transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-[0_4px_16px_rgba(0,201,167,0.35)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        Get started
      </Link>
    </div>
  );
}
