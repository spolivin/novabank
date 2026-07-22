import { useEffect, useState } from "react";

/**
 * Tracks whether the page has scrolled past `threshold`, which drives the
 * navbar's transparent -> blurred/bordered transition.
 */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    // Sync immediately: a restored scroll position means we can mount mid-page.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
