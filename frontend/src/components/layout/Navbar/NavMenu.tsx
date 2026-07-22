import { useRef } from "react";

import { NavLink, useLocation } from "react-router-dom";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { NavUnderline } from "./NavUnderline";
import type { NavGroup } from "./navbar.data";
import { useMenu } from "./useMenu";

export function NavMenu({ label, items }: NavGroup) {
  const { open, setOpen, ref } = useMenu<HTMLDivElement>();
  const { pathname } = useLocation();

  // Whether a mouse is currently hovering the trigger. Read by onClick to tell a
  // hover-opened menu from a touch/keyboard one — checking the click event's own
  // pointerType is unreliable, since not every browser dispatches click as a
  // PointerEvent (jsdom and older Safari send a plain MouseEvent).
  const hoverOpened = useRef(false);

  // The trigger carries the active underline whenever any route in its group is
  // open. Groups are disjoint, so at most one underline is ever mounted.
  const isActive = items.some((item) => item.to === pathname);

  return (
    <div
      ref={ref}
      className="relative"
      // Gate hover-to-open on a real mouse: touch taps also emit enter/leave,
      // which would race the click toggle below and flash the panel open-shut.
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        hoverOpened.current = true;
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        hoverOpened.current = false;
        setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => {
          // A mouse user already opened this by hovering, so a click must not
          // toggle it shut. Touch and keyboard never hovered, so they toggle.
          if (hoverOpened.current) setOpen(true);
          else setOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          "relative flex cursor-pointer items-center gap-1 pb-1 text-sm font-medium transition-colors duration-200",
          "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent",
          isActive || open ? "text-brand-fg" : "text-brand-fg-muted hover:text-brand-fg",
        ].join(" ")}
      >
        {label}
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        {isActive && <NavUnderline />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            // pt-3 is the hover bridge: without it the pointer crosses a gap
            // between trigger and panel and onMouseLeave closes the menu.
            className="absolute left-1/2 top-full w-96 -translate-x-1/2 pt-3"
          >
            <div
              role="menu"
              aria-label={label}
              className="rounded-2xl border border-brand-border bg-brand-surface p-2 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            >
              {items.map(({ to, label: itemLabel, description, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  role="menuitem"
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-brand-bg/60 focus-visible:bg-brand-bg/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-accent"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-brand-fg">{itemLabel}</span>
                    <span className="text-xs leading-relaxed text-brand-fg-muted">
                      {description}
                    </span>
                  </span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
