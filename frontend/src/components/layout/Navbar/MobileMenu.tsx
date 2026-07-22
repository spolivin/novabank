import { useEffect, useRef } from "react";

import { Link, NavLink, useNavigate } from "react-router-dom";

import { LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";

import { getInitials } from "./getInitials";
import { NAV_GROUPS } from "./navbar.data";
import { useMenu } from "./useMenu";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "block rounded-xl px-3 py-2.5 text-base font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-accent",
    isActive ? "bg-brand-surface text-brand-accent" : "text-brand-fg-muted hover:text-brand-fg",
  ].join(" ");

const groupLabelClass =
  "px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-brand-fg-muted/60";

export function MobileMenu() {
  const { open, setOpen, ref } = useMenu<HTMLDivElement>();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate(ROUTES.HOME);
  };

  // Lock body scroll so the page behind the full-height panel stays put.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the panel on open, keep Tab inside it, and hand focus back
  // to the toggle on close so keyboard users don't get dropped at the top.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    // The toggle is never unmounted, but capture it so cleanup restores focus to
    // the node this effect actually opened from.
    const toggle = toggleRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus();
    };
  }, [open]);

  return (
    <div ref={ref} className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="cursor-pointer rounded-lg p-1 text-brand-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="block"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto border-t border-brand-border bg-brand-bg px-4 py-6"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-6">
                <p className={groupLabelClass}>{group.label}</p>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map(({ to, label, description, icon: Icon }) => (
                    <li key={to}>
                      <NavLink to={to} className={linkClass}>
                        <span className="flex items-center gap-3">
                          <Icon className="size-4 shrink-0 text-brand-accent" aria-hidden="true" />
                          <span className="flex flex-col">
                            {label}
                            <span className="text-xs font-normal text-brand-fg-muted/70">
                              {description}
                            </span>
                          </span>
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {!loading &&
              (isAuthenticated ? (
                <div className="flex flex-col gap-3 border-t border-brand-border pt-6">
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-base font-medium text-brand-fg"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brand-accent/40 bg-brand-accent/20 text-xs font-bold text-brand-accent">
                      {getInitials(displayName)}
                    </span>
                    <span className="truncate">{displayName}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-base font-medium text-brand-fg-muted transition-colors hover:text-brand-fg"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 border-t border-brand-border pt-6">
                  <Link
                    to={ROUTES.SIGNUP}
                    className="rounded-xl bg-brand-accent px-5 py-3 text-center text-sm font-semibold text-brand-bg"
                  >
                    Get started
                  </Link>
                  <Link
                    to={ROUTES.LOGIN}
                    className="rounded-xl border border-brand-border px-5 py-3 text-center text-sm font-semibold text-brand-fg"
                  >
                    Log in
                  </Link>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
