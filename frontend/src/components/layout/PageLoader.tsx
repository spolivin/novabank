import { type ReactNode, useEffect, useState } from "react";

/**
 * Brand splash shown on first load. Purely decorative and purely time-based —
 * it no longer gates on assets. Each route's hero requests its own banner when
 * it mounts, and this window gives the home banner time to arrive before reveal.
 */
const SPLASH_DURATION_MS = 3000;

interface PageLoaderProps {
  children: ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  const [showPage, setShowPage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPage(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Prevent scrolling while the loader overlay is visible.
  useEffect(() => {
    if (showPage) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showPage]);

  return (
    <>
      {!showPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg">
          <img src="/logos/N-Logo-Symbol.svg" alt="Loading" className="w-16 h-16 animate-spin" />
        </div>
      )}
      <div className={`transition-opacity duration-500 ${showPage ? "opacity-100" : "opacity-0"}`}>
        {children}
      </div>
    </>
  );
}
