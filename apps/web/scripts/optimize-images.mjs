// =============================================================================
// IMAGE BUDGET  (F6): the static export has no image optimizer, so we keep images
// small ourselves.
//   node scripts/optimize-images.mjs          -> shrinks too-big images in place (WebP)
//   node scripts/optimize-images.mjs --check  -> only reports, exit 1 if one is too big
// Rules: a picture in public/ is at most 200 KB and at most 1600 px wide. Bigger ones
// are converted to WebP (quality 80) and resized. Social cards (public/og) and
// favicons are left alone. Uploads made from the dashboard go through the same
// rules (see lib/admin/media.ts).
// =============================================================================
import { readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
export const MAX_BYTES = 200 * 1024;
export const MAX_WIDTH = 1600;
const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const IGNORE = [path.join(publicDir, "og"), path.join(publicDir, "uploads")];

function* images(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (IGNORE.some((ignored) => full.startsWith(ignored))) continue;
    if (statSync(full).isDirectory()) yield* images(full);
    else if (RASTER.has(path.extname(entry).toLowerCase()) && !/^(favicon|apple-icon|icon)/.test(entry)) yield full;
  }
}

async function main() {
  const check = process.argv.includes("--check");
  let tooBig = 0;
  for (const file of images(publicDir)) {
    const bytes = statSync(file).size;
    const { width = 0 } = await sharp(file).metadata();
    const rel = path.relative(publicDir, file);
    if (bytes <= MAX_BYTES && width <= MAX_WIDTH) continue;
    tooBig++;
    if (check) {
      console.log(`TOO BIG  ${rel}  ${(bytes / 1024).toFixed(0)} KB, ${width}px (max ${MAX_BYTES / 1024} KB, ${MAX_WIDTH}px)`);
      continue;
    }
    const target = file.replace(/\.[^.]+$/, ".webp");
    const buffer = await sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await sharp(buffer).toFile(target + ".tmp");
    if (target !== file) unlinkSync(file);
    const { renameSync } = await import("node:fs");
    renameSync(target + ".tmp", target);
    console.log(`optimized ${rel}: ${(bytes / 1024).toFixed(0)} KB -> ${(buffer.length / 1024).toFixed(0)} KB (${path.basename(target)})`);
    if (target !== file) console.log(`  NOTE: the file is now ${path.basename(target)}, update references to it.`);
  }
  console.log(tooBig ? `${tooBig} image(s) over budget${check ? "" : " were optimized"}.` : "Images: all within budget.");
  if (check && tooBig) process.exit(1);
}

await main();
