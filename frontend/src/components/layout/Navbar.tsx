import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { NAV_LINKS, ROUTES } from "@/constants";
import { useAuth } from "@/context/useAuth";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const NavCta = ({ onClick }: { onClick?: () => void }) => (
  <Link
    to={ROUTES.SIGNUP}
    onClick={onClick}
    className="
      relative inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold
      rounded-full border border-brand-accent/50 text-brand-accent
      bg-brand-accent/10 hover:bg-brand-accent/20
      transition-colors duration-200
      before:absolute before:inset-0 before:rounded-full
      before:shadow-[0_0_12px_2px_rgba(0,201,167,0.15)]
    "
  >
    <span className="size-1.5 rounded-full bg-brand-accent animate-pulse" />
    Get started
  </Link>
);

const NavUser = ({ onClick }: { onClick?: () => void }) => {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name ?? user?.email ?? "";
  const initials = getInitials(fullName);
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "";

  return (
    <Link
      to={ROUTES.DASHBOARD}
      onClick={onClick}
      className="inline-flex items-center gap-2.5 text-sm font-medium text-brand-fg-muted hover:text-brand-fg transition-colors"
    >
      <span className="size-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-xs font-bold text-brand-accent">
        {initials}
      </span>
      <span className="hidden sm:block">{displayName}</span>
    </Link>
  );
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "text-sm font-medium transition-colors duration-200 pb-0.5",
    isActive
      ? "text-brand-accent border-b-2 border-brand-accent"
      : "text-brand-fg-muted hover:text-brand-fg border-b-2 border-transparent",
  ].join(" ");

export default function Navbar() {
  const [isOpen, setOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isOpen]);

  return (
    <header
      className={`relative sticky top-0 z-50 border-brand-border bg-brand-bg backdrop-blur-sm ${
        isOpen ? "" : "border-b"
      }`}
      ref={navRef}
    >
      <nav className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          className="text-brand-fg font-bold text-3xl"
          onClick={() => setOpen(false)}
        >
          Nova<span className="text-brand-accent">Bank</span>
        </Link>
        {/* Navigation links */}
        <ul className="hidden md:flex gap-8">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={navLinkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        {/* CTA / User */}
        <span className="hidden md:block">
          {!loading && (isAuthenticated ? <NavUser /> : <NavCta />)}
        </span>
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-brand-fg cursor-pointer p-1"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>
      {/* Mobile Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 w-full md:hidden flex flex-col items-center gap-8 bg-brand-bg backdrop-blur-sm border-b border-brand-border py-4"
          >
            <ul className="flex flex-col gap-4 items-center">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink to={to} onClick={() => setOpen(false)} className={navLinkClass}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {!loading &&
              (isAuthenticated ? (
                <NavUser onClick={() => setOpen(false)} />
              ) : (
                <NavCta onClick={() => setOpen(false)} />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
