import type { ReactNode } from "react";

import { Link } from "react-router-dom";

interface ButtonProps {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "dark"
    | "darkCard"
    | "accentCard"
    | "danger"
    | "dangerSolid";
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand-accent text-brand-bg hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,201,167,0.35)] active:scale-[0.98]",
  secondary:
    "bg-transparent text-brand-accent border-2 border-brand-accent/30 hover:scale-[1.02] active:scale-[0.98]",
  ghost: "bg-transparent text-brand-accent hover:scale-[1.02] active:scale-[0.98]",
  dark: "bg-brand-bg text-brand-accent hover:scale-[1.02] active:scale-[0.98]",
  darkCard:
    "bg-brand-surface text-brand-accent border-2 border-brand-accent/20 hover:scale-[1.02] active:scale-[0.98]",
  accentCard: "bg-brand-accent/90 text-brand-surface hover:scale-[1.02] active:scale-[0.98]",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:scale-[1.02] active:scale-[0.98]",
  dangerSolid:
    "bg-red-500 text-white hover:bg-red-600 hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(239,68,68,0.35)] active:scale-[0.98]",
};

export const Button = ({
  variant = "primary",
  children,
  onClick,
  href,
  fullWidth = false,
  disabled = false,
}: ButtonProps) => {
  const baseClass = [
    "inline-flex items-center justify-center font-semibold rounded-xl text-sm h-12 px-6 transition-[transform,box-shadow] duration-200 ease-in-out",
    variantStyles[variant],
    fullWidth ? "w-full" : "",
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (href?.startsWith("#")) {
    return (
      <a
        href={href}
        className={baseClass}
        onClick={(e) => {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            const top = target.getBoundingClientRect().top + window.scrollY - 72;
            window.scrollTo({ top, behavior: "smooth" });
          }
          onClick?.();
        }}
      >
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link to={href} className={baseClass} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
