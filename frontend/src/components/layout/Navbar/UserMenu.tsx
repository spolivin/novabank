import { Link, useNavigate } from "react-router-dom";

import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";

import { getInitials } from "./getInitials";
import { useMenu } from "./useMenu";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-fg-muted transition-colors hover:bg-brand-bg/60 hover:text-brand-fg focus-visible:bg-brand-bg/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-accent";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { open, setOpen, ref } = useMenu<HTMLDivElement>();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "";
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate(ROUTES.HOME);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-brand-fg-muted transition-colors hover:text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        <span className="flex size-8 items-center justify-center rounded-full border border-brand-accent/40 bg-brand-accent/20 text-xs font-bold text-brand-accent">
          {initials}
        </span>
        <span className="hidden max-w-40 truncate sm:block">{displayName}</span>
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full w-56 pt-3"
          >
            <div
              role="menu"
              className="rounded-2xl border border-brand-border bg-brand-surface p-2 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            >
              <p className="truncate px-3 pb-2 pt-1 text-xs text-brand-fg-muted">{displayName}</p>
              <div className="mb-1 h-px bg-brand-border" />
              <Link to={ROUTES.DASHBOARD} role="menuitem" className={itemClass}>
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Dashboard
              </Link>
              <button type="button" role="menuitem" onClick={handleSignOut} className={itemClass}>
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
