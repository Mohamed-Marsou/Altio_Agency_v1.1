// =============================================================================
// SEO LINT  (F5): reads the BUILT site (out/) and fails when something would hurt
// search results. Run it after `npm run build:export`:   npm run seo:lint
//
// It checks, for every page in every language:
//   title and description present, right length and not repeated on another page;
//   one canonical address and the hreflang pair (en, fr, ar, x-default);
//   exactly one <h1>; every <img> has an alt attribute;
//   <html lang dir> match the language; social card tags and the image file exist;
//   every JSON-LD block is valid JSON; every internal link points to a real page.
// And for the whole site: sitemap.xml lists every page (and only real ones),
// robots.txt exists and points to the sitemap.
// =============================================================================
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "out");
const LOCALES = ["en", "fr", "ar"];
const TITLE = { min: 10, max: 70 };
const DESCRIPTION = { min: 50, max: 200 };
// Pages that are not meant to be indexed (redirects, error pages).
const SKIP = new Set(["cookies"]);

// ---- tiny helpers -----------------------------------------------------------
function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* htmlFiles(full);
    else if (entry === "index.html") yield full;
  }
}
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => {
  const match = new RegExp(`${name}="([^"]*)"`, "i").exec(tag);
  return match ? decode(match[1]) : undefined;
};
const tags = (html, re) => html.match(re) ?? [];
const siteUrl = () => {
  const site = JSON.parse(readFileSync(path.join(root, "src/content/shared/site.json"), "utf8"));
  return (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.domain}`).replace(/\/$/, "");
};

/** Does an internal address point to a file in out/ ? */
function linkExists(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return existsSync(path.join(OUT, "index.html"));
  const target = path.join(OUT, clean);
  return existsSync(path.join(target, "index.html")) || (existsSync(target) && statSync(target).isFile());
}

export function lintPage({ html, urlPath, locale, base }) {
  const errors = [];
  const add = (message) => errors.push(message);

  // lang and dir
  const htmlTag = tags(html, /<html[^>]*>/i)[0] ?? "";
  if (attr(htmlTag, "lang") !== locale) add(`<html lang> is "${attr(htmlTag, "lang")}", expected "${locale}"`);
  const dir = attr(htmlTag, "dir");
  if (dir !== (locale === "ar" ? "rtl" : "ltr")) add(`<html dir> is "${dir}", expected ${locale === "ar" ? "rtl" : "ltr"}`);

  // title
  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  if (!title) add("missing <title>");
  else if (decode(title).length < TITLE.min || decode(title).length > TITLE.max) add(`title length ${decode(title).length} (want ${TITLE.min} to ${TITLE.max}): "${decode(title)}"`);

  // description
  const descTag = tags(html, /<meta[^>]+name="description"[^>]*>/gi)[0];
  const description = descTag ? attr(descTag, "content") : undefined;
  if (!description) add("missing meta description");
  else if (description.length < DESCRIPTION.min || description.length > DESCRIPTION.max) add(`description length ${description.length} (want ${DESCRIPTION.min} to ${DESCRIPTION.max})`);

  // canonical + hreflang
  const canonicals = tags(html, /<link[^>]+rel="canonical"[^>]*>/gi);
  if (canonicals.length !== 1) add(`${canonicals.length} canonical links (want exactly 1)`);
  else if (attr(canonicals[0], "href") !== `${base}${urlPath}`) add(`canonical is ${attr(canonicals[0], "href")}, expected ${base}${urlPath}`);
  const alternates = tags(html, /<link[^>]+rel="alternate"[^>]*>/gi).map((t) => attr(t, "hrefLang") ?? attr(t, "hreflang"));
  for (const code of [...LOCALES, "x-default"]) if (!alternates.includes(code)) add(`missing hreflang "${code}"`);

  // headings and images
  const h1 = tags(html, /<h1[\s>]/gi).length;
  if (h1 !== 1) add(`${h1} <h1> headings (want exactly 1)`);
  for (const img of tags(html, /<img\b[^>]*>/gi)) if (!/\balt=/.test(img)) add(`image without alt: ${img.slice(0, 80)}`);

  // social card
  for (const property of ["og:title", "og:description", "og:image", "og:url"]) {
    if (!new RegExp(`property="${property}"`).test(html)) add(`missing ${property}`);
  }
  if (!/name="twitter:card"/.test(html)) add("missing twitter:card");
  const ogImage = tags(html, /<meta[^>]+property="og:image"[^>]*>/gi)[0];
  if (ogImage) {
    const content = attr(ogImage, "content") ?? "";
    const file = content.replace(base, "");
    if (!existsSync(path.join(OUT, file))) add(`og:image file not found: ${content}`);
  }

  // structured data
  for (const block of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(block[1].replace(/\\u003c/g, "<"));
    } catch {
      add("JSON-LD block is not valid JSON");
    }
  }

  // internal links
  for (const a of tags(html, /<a\b[^>]*>/gi)) {
    const href = attr(a, "href");
    if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
    if (!linkExists(href)) add(`broken internal link: ${href}`);
  }
  return { errors, title: title && decode(title), description };
}

function main() {
  if (!existsSync(OUT)) {
    console.error("out/ not found. Run `npm run build:export` first.");
    process.exit(1);
  }
  const base = siteUrl();
  let problems = 0;
  const seenTitles = new Map();
  const seenDescriptions = new Map();
  const pages = [];

  for (const file of htmlFiles(OUT)) {
    const rel = path.relative(OUT, path.dirname(file)).split(path.sep).join("/");
    const [first, ...rest] = rel.split("/");
    if (!LOCALES.includes(first)) continue; // admin, root chooser, 404...
    if (SKIP.has(rest[0])) continue;
    const urlPath = `/${rel}/`;
    const html = readFileSync(file, "utf8");
    const { errors, title, description } = lintPage({ html, urlPath, locale: first, base });
    pages.push(urlPath);
    const key = (map, value) => {
      if (!value) return;
      const id = `${first}|${value}`;
      map.set(id, [...(map.get(id) ?? []), urlPath]);
    };
    key(seenTitles, title);
    key(seenDescriptions, description);
    if (errors.length) {
      problems += errors.length;
      console.log(`\n${urlPath}`);
      for (const e of errors) console.log(`  - ${e}`);
    }
  }

  for (const [label, map] of [["title", seenTitles], ["description", seenDescriptions]]) {
    for (const [value, urls] of map) {
      if (urls.length > 1) {
        problems++;
        console.log(`\nDuplicate ${label} on ${urls.join(", ")}: ${value.split("|")[1].slice(0, 70)}`);
      }
    }
  }

  // sitemap.xml
  const sitemapFile = path.join(OUT, "sitemap.xml");
  if (!existsSync(sitemapFile)) {
    problems++;
    console.log("\nsitemap.xml is missing");
  } else {
    const xml = readFileSync(sitemapFile, "utf8");
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const listed = new Set(urls);
    for (const page of pages) {
      if (!listed.has(`${base}${page}`)) {
        problems++;
        console.log(`\nPage missing from sitemap.xml: ${page}`);
      }
    }
    for (const url of urls) {
      const rel = url.replace(base, "");
      if (!linkExists(rel)) {
        problems++;
        console.log(`\nsitemap.xml lists a page that does not exist: ${url}`);
      }
    }
  }

  // robots.txt
  const robotsFile = path.join(OUT, "robots.txt");
  if (!existsSync(robotsFile) || !/Sitemap:\s*\S+sitemap\.xml/i.test(readFileSync(robotsFile, "utf8"))) {
    problems++;
    console.log("\nrobots.txt is missing or does not point to sitemap.xml");
  }

  console.log(`\nSEO lint: ${pages.length} pages checked, ${problems} problem(s).`);
  process.exit(problems ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
