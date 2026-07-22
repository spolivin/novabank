/**
 * Generates the responsive hero banners served from public/banners/.
 *
 * The sources in banners-src/ are full-size photos (up to 7680x4320). Shipping
 * those means every visitor decodes a ~33 megapixel image — over 100MB of RGBA
 * bitmap — to paint a background that sits behind an 82% opaque gradient. This
 * emits a width ladder instead, and <img srcSet> lets the browser download the
 * single variant that fits its viewport and pixel ratio.
 *
 * Run manually with `npm run banners` and commit the output; it is deliberately
 * not part of `npm run build`, so no native binary is needed to deploy.
 */
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SRC = "banners-src";
const OUT = "public/banners";

export const WIDTHS = [960, 1440, 1920, 2560];

// Low quality is safe here: the gradient overlay hides compression artifacts,
// and these are backgrounds rather than content the eye rests on.
const AVIF = { quality: 52, effort: 5 };

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file));

for (const file of files) {
  const name = path.parse(file).name;
  // One decode of the source, reused by every width via clone().
  const source = sharp(path.join(SRC, file));
  const { width: sourceWidth } = await source.metadata();

  for (const width of WIDTHS) {
    if (sourceWidth < width) continue; // never upscale past the original
    const out = path.join(OUT, `${name}-${width}.avif`);
    const { size } = await source.clone().resize({ width }).avif(AVIF).toFile(out);
    console.log(`${out}  ${(size / 1024).toFixed(0)} kB`);
  }
}
