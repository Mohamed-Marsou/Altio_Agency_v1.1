// =============================================================================
// SITE DATA CHECK  (F1: one source of truth, no placeholders in the release)
// -----------------------------------------------------------------------------
//   node scripts/check-site-data.mjs            -> prints a warning list, exit 0
//   node scripts/check-site-data.mjs --strict   -> exit 1 if anything is left
// `npm run build:release` runs the strict mode first, so a build with a fake phone
// number, a fake email or an unreviewed text can never be uploaded by mistake.
// Normal `npm run build:export` only warns, so development is never blocked.
// =============================================================================
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src", "content");

// Patterns that mean "this value was never filled in".
export const PLACEHOLDER_PATTERNS = [
  { name: "fake email domain", test: /yourdomain|example\.(com|ma|org)/i },
  { name: "fake phone number", test: /\b00 00 00\b|2126000000\d\d|0600000000/i },
  { name: "TODO marker", test: /\b(TODO|TBD|FIXME|lorem ipsum)\b/i },
  { name: "unfinished sentence", test: /\bAdd (stack|year|result)\b/i },
];

/** Returns the names of the placeholder patterns found in a text. */
export function findPlaceholders(text) {
  return PLACEHOLDER_PATTERNS.filter((pattern) => pattern.test.test(text)).map((pattern) => pattern.name);
}

/** Every string value inside a JSON value, with its path (for a helpful message). */
export function* walkStrings(value, trail = "") {
  if (typeof value === "string") yield [trail, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* walkStrings(v, `${trail}[${i}]`);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* walkStrings(v, trail ? `${trail}.${k}` : k);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function checkSiteData() {
  const problems = [];
  const site = readJson(path.join(contentDir, "shared", "site.json"));

  // 1. The shared business data itself.
  for (const [key, value] of walkStrings(site)) {
    for (const name of findPlaceholders(value)) problems.push(`shared/site.json  ${key}: ${name} ("${value}")`);
  }
  if (site.verified !== true) problems.push('shared/site.json  "verified" is not true (the owner has not confirmed the business data yet)');

  // 2. Every text file in every language.
  for (const locale of ["en", "fr", "ar"]) {
    for (const file of readdirSync(path.join(contentDir, locale)).filter((f) => f.endsWith(".json"))) {
      const json = readJson(path.join(contentDir, locale, file));
      for (const [key, value] of walkStrings(json)) {
        for (const name of findPlaceholders(value)) problems.push(`${locale}/${file}  ${key}: ${name}`);
      }
    }
  }

  // 3. Texts nobody has reviewed yet.
  const status = readJson(path.join(contentDir, "review-status.json"));
  const drafts = [];
  for (const [locale, files] of Object.entries(status.files)) {
    for (const [file, state] of Object.entries(files)) if (state !== "reviewed") drafts.push(`${locale}/${file}`);
  }
  return { problems, drafts };
}

// Run as a command (not when imported by a test).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const strict = process.argv.includes("--strict");
  const { problems, drafts } = checkSiteData();

  if (problems.length) {
    console.log(`\nSite data: ${problems.length} placeholder problem(s)`);
    for (const p of problems) console.log(`  - ${p}`);
  }
  if (drafts.length) {
    console.log(`\nTexts not yet reviewed by a person: ${drafts.length}`);
    console.log(`  ${drafts.slice(0, 8).join(", ")}${drafts.length > 8 ? ` ... (+${drafts.length - 8} more, see src/content/review-status.json)` : ""}`);
  }

  if (!problems.length && !drafts.length) console.log("Site data: OK (no placeholder, everything reviewed).");
  if (strict && (problems.length || drafts.length)) {
    console.error("\nRelease blocked: fill in src/content/shared/site.json and review the texts, then run again.");
    process.exit(1);
  }
}
