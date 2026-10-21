// =============================================================================
// SOCIAL SHARE IMAGES  (the card shown when a link is shared on WhatsApp, Facebook,
// LinkedIn, X...). One 1200x630 PNG per language, drawn from the home page text.
//   npm run og            (re-run when the hero title or the logo changes)
// The PNG files are committed (public/og/*.png), so the build and the CI server
// do not need any font. Run this on a computer that has Segoe UI or Arial.
// =============================================================================
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "og");
mkdirSync(outDir, { recursive: true });

const site = JSON.parse(readFileSync(path.join(root, "src/content/shared/site.json"), "utf8"));
const mark = readFileSync(path.join(root, "public/logo/altio-mark.svg"));
const markUri = `data:image/svg+xml;base64,${mark.toString("base64")}`;

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Cuts a sentence into lines of about `max` characters (SVG text does not wrap).
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

for (const locale of ["en", "fr", "ar"]) {
  const hero = JSON.parse(readFileSync(path.join(root, `src/content/${locale}/hero.json`), "utf8"));
  const rtl = locale === "ar";
  const x = rtl ? 1080 : 120;
  // In right-to-left text, "start" already means the right edge.
  const anchor = "start";
  const font = rtl ? "Segoe UI, Tahoma, Arial, sans-serif" : "Segoe UI, Arial, Helvetica, sans-serif";

  const title = wrap(hero.title, rtl ? 26 : 28).slice(0, 3);
  const sub = wrap(hero.badge, 40).slice(0, 1);
  const titleLines = title
    .map((line, i) => `<text x="${x}" y="${270 + i * 76}" text-anchor="${anchor}" direction="${rtl ? "rtl" : "ltr"}" font-family="${font}" font-size="62" font-weight="700" fill="#ffffff">${escape(line)}</text>`)
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0d12"/><stop offset="1" stop-color="#0a2a7a"/></linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.7"><stop offset="0" stop-color="#1463ff" stop-opacity="0.55"/><stop offset="1" stop-color="#1463ff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <image href="${markUri}" x="${rtl ? 1000 : 120}" y="70" width="80" height="80"/>
  <text x="${rtl ? 980 : 220}" y="125" text-anchor="${rtl ? "end" : "start"}" direction="ltr" font-family="${font}" font-size="40" font-weight="800" fill="#ffffff" letter-spacing="2">ALTIO</text>
  ${titleLines}
  <text x="${x}" y="500" text-anchor="${anchor}" direction="${rtl ? "rtl" : "ltr"}" font-family="${font}" font-size="34" fill="#9fc0ff">${escape(sub[0] ?? "")}</text>
  <text x="${x}" y="565" text-anchor="${rtl ? "end" : "start"}" direction="ltr" font-family="${font}" font-size="30" fill="#ffffff" fill-opacity="0.75">${escape(site.domain)} · ${escape(site.city)}</text>
</svg>`;

  const file = path.join(outDir, `${locale}.png`);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(file);
  console.log(`og/${locale}.png written`);
}
