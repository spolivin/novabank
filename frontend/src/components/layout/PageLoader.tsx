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

// Module-level cache: holding the decoded HTMLImageElements for the whole session
// keeps their bitmaps alive so route banners reuse them without re-decoding.
const decodedBanners: HTMLImageElement[] = [];

interface PageLoaderProps {
  children: ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  const [imagesReady, setImagesReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Download AND fully decode every banner before revealing the page, so the first
  // paint on each route reuses an already-decoded image instead of decoding on demand.
  useEffect(() => {
    let cancelled = false;

    const decodeAll = BANNER_IMAGES.map((src) => {
      const img = new Image();
      img.src = src;
      decodedBanners.push(img);
      // decode() rejects on a broken image; swallow so one bad asset can't block the app.
      return img.decode().catch(() => undefined);
    });

    Promise.all(decodeAll).then(() => {
      if (!cancelled) setImagesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const showPage = imagesReady && minTimeElapsed;

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
