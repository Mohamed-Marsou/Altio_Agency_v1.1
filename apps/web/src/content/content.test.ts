import { describe, expect, it } from "vitest";
import { dictionaries } from "@/content";
import status from "./review-status.json";

// Translation PARITY: French and Arabic must have exactly the same structure as
// English (same keys, same list lengths, same links and ids), and must really be
// translated. This test is what stops a missing or half-done translation from
// reaching the live site.

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// Keys whose value is NOT text: ids, links, icon names, flags. They must be identical.
const TECHNICAL_KEYS = new Set([
  "id", "key", "slug", "href", "linkHref", "icon", "vibe", "art", "visual", "category", "status", "code", "type", "letter",
]);

// English words that are allowed to stay in a translation (brand and tool names).
const ALLOWED_SAME =
  /^(Altio|WhatsApp|Figma|Next\.js|React|Node\.js|WordPress|SQL|NoSQL|\.NET|C#|Java|Kotlin|TypeScript|Spring Boot|Launch|Commerce|Custom|Managed|Google|MVP|SEO|FAQ|Blog|Contact|Pack \d+|E-commerce|Instagram|[\d\s·%×+−.,:/-]+)$/;

// Only the LAST part of the path counts (hero.visual.url is text, projects[0].built[1].visual is a code).
function isTechnical(trail: string): boolean {
  const last = trail.split(/[.[]/).pop() ?? "";
  return TECHNICAL_KEYS.has(last.replace(/]$/, ""));
}

function walk(en: Json, other: Json, trail: string, fails: string[], locale: string) {
  if (typeof en !== typeof other || Array.isArray(en) !== Array.isArray(other)) {
    fails.push(`${trail}: type differs`);
    return;
  }
  if (Array.isArray(en) && Array.isArray(other)) {
    if (en.length !== other.length) fails.push(`${trail}: ${en.length} items in en, ${other.length} in ${locale}`);
    en.forEach((item, i) => other[i] !== undefined && walk(item, other[i] as Json, `${trail}[${i}]`, fails, locale));
    return;
  }
  if (en && typeof en === "object" && other && typeof other === "object") {
    const a = Object.keys(en).sort().join(",");
    const b = Object.keys(other as object).sort().join(",");
    if (a !== b) fails.push(`${trail}: keys differ (en: ${a} | ${locale}: ${b})`);
    for (const key of Object.keys(en)) {
      if (key in (other as object)) {
        walk((en as Record<string, Json>)[key]!, (other as Record<string, Json>)[key]!, trail ? `${trail}.${key}` : key, fails, locale);
      }
    }
    return;
  }
  // Numbers, flags, ids and links must be identical.
  if (typeof en !== "string" || isTechnical(trail)) {
    if (en !== other) fails.push(`${trail}: technical value changed (${String(en)} -> ${String(other)})`);
    return;
  }
  // Symbol-only text ("×3", "2026-03-12", "99.9%") must match too (a decimal comma is fine),
  // unless the translation wrote it with words (24/7 -> 24h/24).
  const normalise = (s: string) => s.replace(/,/g, ".").replace(/\s/g, "");
  if (!/\p{L}/u.test(en)) {
    const o = other as string;
    if (!/\p{L}/u.test(o) && normalise(en) !== normalise(o)) fails.push(`${trail}: number changed (${en} -> ${o})`);
    return;
  }
  // Text: {{tokens}} must be kept exactly, and it must not be empty.
  const tokens = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort().join("");
  if (tokens(en) !== tokens(other as string)) fails.push(`${trail}: {{tokens}} differ`);
  if (en.trim() !== "" && (other as string).trim() === "") fails.push(`${trail}: empty translation`);
}

const names = Object.keys(dictionaries.en) as (keyof typeof dictionaries.en)[];

describe.each(["fr", "ar"] as const)("translation parity: %s", (locale) => {
  it.each(names)("%s has the same structure as English", (name) => {
    const fails: string[] = [];
    walk(dictionaries.en[name] as Json, dictionaries[locale][name] as Json, name, fails, locale);
    expect(fails).toEqual([]);
  });

  it("is really translated (no long English sentence left behind)", () => {
    const left: string[] = [];
    function scan(en: Json, other: Json, trail: string) {
      if (typeof en === "string" && typeof other === "string") {
        if (!isTechnical(trail) && en === other && en.length > 24 && !ALLOWED_SAME.test(en) && !en.includes("{{")) left.push(`${trail}: "${en}"`);
      } else if (Array.isArray(en) && Array.isArray(other)) {
        en.forEach((v, i) => scan(v, other[i] as Json, `${trail}[${i}]`));
      } else if (en && other && typeof en === "object" && typeof other === "object") {
        for (const k of Object.keys(en)) scan((en as Record<string, Json>)[k]!, (other as Record<string, Json>)[k]!, `${trail}.${k}`);
      }
    }
    for (const name of names) scan(dictionaries.en[name] as Json, dictionaries[locale][name] as Json, name);
    expect(left).toEqual([]);
  });
});

describe("Arabic text", () => {
  it("contains Arabic letters in every long text", () => {
    const missing: string[] = [];
    function scan(value: Json, trail: string) {
      if (typeof value === "string") {
        if (!isTechnical(trail) && value.length > 30 && !/[؀-ۿ]/.test(value)) missing.push(`${trail}: ${value.slice(0, 40)}`);
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => scan(v, `${trail}[${i}]`));
      } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) scan(v, `${trail}.${k}`);
      }
    }
    for (const name of names) scan(dictionaries.ar[name] as Json, name);
    expect(missing).toEqual([]);
  });
});

describe("review status file", () => {
  it("lists every content file for every language", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      expect(Object.keys(status.files[locale]).length, locale).toBe(names.length);
    }
  });
});

describe("links inside content", () => {
  it("only point to pages that exist", () => {
    const pages = ["/", "/services/", "/work/", "/about/", "/blog/", "/contact/", "/free-design/", "/referrals/", "/privacy/", "/terms/", "/cookies/"];
    const known = new Set([
      ...pages,
      ...dictionaries.en.projects.map((p) => `/work/${p.slug}/`),
      ...dictionaries.en.posts.map((p) => `/blog/${p.slug}/`),
    ]);
    const bad: string[] = [];
    function scan(value: Json, trail: string) {
      if (typeof value === "string") {
        if (trail.endsWith("href") || trail.endsWith("Href")) {
          const target = value.split("#")[0] || "/";
          if (value.startsWith("/") && !known.has(target)) bad.push(`${trail}: ${value}`);
        }
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => scan(v, `${trail}[${i}]`));
      } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) scan(v, `${trail}.${k}`);
      }
    }
    for (const locale of ["en", "fr", "ar"] as const) for (const name of names) scan(dictionaries[locale][name] as Json, `${locale}.${name}`);
    expect(bad).toEqual([]);
  });
});
