import { useEffect, useRef, useState } from "react";

import { useLocation } from "react-router-dom";

/**
 * Open/close state shared by every navbar menu. Closes on outside pointer down,
 * Escape, and route change; `ref` goes on the element that counts as "inside".
 */
export function useMenu<T extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);
  const { pathname } = useLocation();

  // Close on navigation by adjusting state during render rather than in an
  // effect — an effect would paint the stale-open menu first, then re-render.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { open, setOpen, ref };
}
