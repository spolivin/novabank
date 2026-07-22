/** Keep in sync with WIDTHS in scripts/resize-banners.mjs, which emits these files. */
export const BANNER_WIDTHS = [960, 1440, 1920, 2560];

export const bannerSrcSet = (banner: string) =>
  BANNER_WIDTHS.map((width) => `/banners/${banner}-${width}.avif ${width}w`).join(", ");

/** Plain src for browsers that skip srcset. */
export const bannerFallback = (banner: string) => `/banners/${banner}-1920.avif`;
