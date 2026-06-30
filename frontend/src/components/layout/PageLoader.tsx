import { type ReactNode, useEffect, useState } from "react";

const BANNER_IMAGES = [
  "/banners/Home-banner.avif",
  "/banners/Personal-banner.avif",
  "/banners/Business-banner.avif",
  "/banners/Cards-banner.avif",
  "/banners/Loans-banner.avif",
  "/banners/Security-banner.avif",
  "/banners/Careers-banner.avif",
];

interface PageLoaderProps {
  children: ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Count each image once it finishes (or fails, so one bad asset can't block forever).
  const handleSettled = () => setLoadedCount((count) => count + 1);

  const imagesLoaded = loadedCount >= BANNER_IMAGES.length;
  const showPage = imagesLoaded && minTimeElapsed;

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
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -z-50 opacity-0"
        style={{ left: "-9999px", top: 0 }}
      >
        {BANNER_IMAGES.map((src) => (
          <img key={src} src={src} alt="" onLoad={handleSettled} onError={handleSettled} />
        ))}
      </div>

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
