// =============================================================================
// LIGHTHOUSE BUDGET  (F6): measures speed, accessibility, best practices and SEO of the
// BUILT site as a phone on a slow connection would, and fails when a score is too low.
//   npm run build:export && npm run lighthouse
// It serves out/ itself (like the real host, with gzip) and tests the main page types
// in every language. Scores are lower on a busy computer: run it when nothing else is.
// =============================================================================
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { startServer } from "./serve-out.mjs";

const PORT = 4174;
// Minimum scores (0 to 100). Performance is the hardest: it depends on the machine.
// (The intro loading screen adds about 1 second to the Largest Contentful Paint; with
// NEXT_PUBLIC_SITE_LOADER=off the scores are about 10 points higher.)
const BUDGET = { performance: 80, accessibility: 95, "best-practices": 90, seo: 95 };
// Core Web Vitals limits (milliseconds, and CLS without unit).
const VITALS = { "largest-contentful-paint": 4200, "cumulative-layout-shift": 0.1, "total-blocking-time": 300 };

const PAGES = (process.env.LH_PAGES ?? "/en/,/fr/,/ar/,/en/services/,/en/contact/,/en/blog/local-business-website-checklist/,/en/work/atlas-immo/").split(",");

function chromePath() {
  return process.env.CHROME_PATH ?? undefined; // chrome-launcher finds the installed Chrome by itself
}

const server = await startServer(PORT);
const chrome = await launch({ chromePath: chromePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
let failures = 0;

console.log(`Lighthouse (mobile), ${PAGES.length} page(s)\n`);
for (const page of PAGES) {
  const result = await lighthouse(
    `http://127.0.0.1:${PORT}${page}`,
    { port: chrome.port, output: "json", logLevel: "error" },
    // default config = mobile emulation with slow 4G throttling
  );
  const lhr = result?.lhr;
  if (!lhr) {
    console.log(`${page}  no result`);
    failures++;
    continue;
  }
  const scores = Object.fromEntries(Object.entries(lhr.categories).map(([id, c]) => [id, Math.round((c.score ?? 0) * 100)]));
  const problems = [];
  for (const [id, min] of Object.entries(BUDGET)) if ((scores[id] ?? 0) < min) problems.push(`${id} ${scores[id]} < ${min}`);
  for (const [id, max] of Object.entries(VITALS)) {
    const value = lhr.audits[id]?.numericValue ?? 0;
    if (value > max) problems.push(`${id} ${Math.round(value * 100) / 100} > ${max}`);
  }
  failures += problems.length;
  console.log(
    `${page.padEnd(52)} perf ${scores.performance}  a11y ${scores.accessibility}  best ${scores["best-practices"]}  seo ${scores.seo}  LCP ${Math.round(lhr.audits["largest-contentful-paint"].numericValue)}ms  CLS ${(lhr.audits["cumulative-layout-shift"].numericValue).toFixed(3)}  TBT ${Math.round(lhr.audits["total-blocking-time"].numericValue)}ms${problems.length ? `   <-- ${problems.join("; ")}` : ""}`,
  );
}

await chrome.kill();
server.close();
console.log(failures ? `\n${failures} budget problem(s).` : "\nAll pages are within the budget.");
process.exit(failures ? 1 : 0);
