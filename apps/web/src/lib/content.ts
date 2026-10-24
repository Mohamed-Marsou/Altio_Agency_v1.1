// =============================================================================
// CONTENT LOADER
// -----------------------------------------------------------------------------
// Components never import JSON files directly. They call these functions.
// The text comes from src/content/{en,fr,ar}/*.json. Every getter reads the
// language of the page being rendered (see lib/locale-server.ts) unless you pass
// one explicitly. Later the backend API can replace the JSON; only THIS file
// changes and every component keeps working.
//
// Contact details live ONCE in src/content/shared/site.json. Inside any text,
// {{email}}, {{phone}}, {{domain}} and {{city}} are replaced by those values.
// =============================================================================
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { dictionaries, type Dictionary } from "@/content";
import sharedSite from "@/content/shared/site.json";
import mediaJson from "@/content/shared/media.json";
import { type Locale } from "./i18n";
import { getRequestLocale } from "./locale-server";

type D = Dictionary;

// ---- cover pictures ----------------------------------------------------------
// Posts and projects can point to a picture of the media library by id (`cover`).
// We turn the id into everything an <img> needs: the WebP sizes, the real size and
// the alt text in the page language.
type MediaItem = {
  id: string;
  alt: { en: string; fr: string; ar: string };
  width: number;
  height: number;
  variants: { width: number; path: string }[];
};
// While developing (`npm run dev`) the dashboard rewrites the posts, projects and media JSON files.
// Next.js can keep an old copy of an imported JSON file in some of its workers, so in development
// these three files are read from disk (and cached until the file changes). In the real build
// the normal imports are used, so nothing here exists in the site that goes online.
const IS_DEV = process.env.NODE_ENV === "development";
const diskCache = new Map<string, { mtime: number; data: unknown }>();

function fromDisk<T>(relative: string, fallback: T): T {
  const file = path.join(process.cwd(), "src", "content", relative);
  try {
    const mtime = statSync(file).mtimeMs;
    const hit = diskCache.get(file);
    if (hit && hit.mtime === mtime) return hit.data as T;
    const data = JSON.parse(readFileSync(file, "utf8")) as T;
    diskCache.set(file, { mtime, data });
    return data;
  } catch {
    return fallback;
  }
}

const getMedia = (): MediaItem[] => (IS_DEV ? fromDisk<MediaItem[]>("shared/media.json", []) : (mediaJson as MediaItem[]));

export type CoverImage = { src: string; srcSet: string; width: number; height: number; alt: string };

function coverFor(id: string | undefined, locale: Locale): CoverImage | undefined {
  const item = id ? getMedia().find((m) => m.id === id) : undefined;
  if (!item || item.variants.length === 0) return undefined;
  const sorted = [...item.variants].sort((a, b) => a.width - b.width);
  const main = sorted.find((v) => v.width >= 960) ?? sorted[sorted.length - 1]!;
  return {
    src: main.path,
    srcSet: sorted.map((v) => `${v.path} ${v.width}w`).join(", "),
    width: item.width,
    height: item.height,
    alt: item.alt[locale] || item.alt.en,
  };
}
export type SharedSite = typeof sharedSite;

// The TypeScript types come from the English files, so a typo in a component
// (hero.titel) becomes a compile error, and French and Arabic must match them.
export type NavContent = D["nav"];
export type HeroContent = D["hero"];
export type SiteContent = SharedSite;
export type ProofContent = D["proof"];
export type ProblemContent = D["problem"];
export type AudiencesContent = D["audiences"];
export type AudienceOption = AudiencesContent["options"][number];
export type ServicesContent = D["services"];
export type ServicesPageContent = D["servicesPage"];
export type ServicesPageItem = ServicesPageContent["items"][number];
export type ProcessContent = D["process"];
export type WorkContent = D["work"];
export type AboutContent = D["about"];
export type ContactContent = D["contact"];
// Legal pages are made of small typed blocks. Each page uses only some of the
// fields (a paragraph has `text`, a table has `head` and `rows`, ...), so they
// are all optional; the `type` says which ones to read.
export type LegalBlock = {
  type: string;
  text?: string;
  items?: string[];
  head?: string[];
  rows?: string[][];
  parts?: { value: string; label: string }[];
};
export type LegalDoc = {
  title: string;
  updated: string;
  short: string[];
  sections: { id: string; title: string; blocks: LegalBlock[] }[];
  ask: { title: string; cta: string; message: string };
};
export type LegalContent = { labels: D["legal"]["labels"]; privacy: LegalDoc; terms: LegalDoc };
export type ReferralsContent = D["referrals"];
export type FreeDesignContent = D["freeDesign"];
export type NotFoundContent = D["notFound"];
export type Post = D["posts"][number] & { cover?: string; coverImage?: CoverImage };
export type PostBlock = Post["body"][number];
export type BlogPageContent = D["blogPage"];
export type Project = D["projects"][number] & { cover?: string; coverImage?: CoverImage };
export type WorkPageContent = D["workPage"];
export type PacksContent = D["packs"];
export type WhyContent = D["why"];
export type FaqContent = D["faq"];
export type CtaContent = D["cta"];
export type FooterContent = D["footer"];
export type SeoContent = D["seo"];

// ---- {{token}} replacement -------------------------------------------------
const TOKENS: Record<string, string> = {
  email: sharedSite.email,
  phone: sharedSite.phoneDisplay,
  domain: sharedSite.domain,
  city: sharedSite.city,
};

function fill(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => TOKENS[key] ?? match);
}

// Walks any JSON value and fills the tokens in every string (cached per object).
const cache = new WeakMap<object, unknown>();
function resolve<T>(value: T): T {
  if (typeof value === "string") return fill(value) as T;
  if (value === null || typeof value !== "object") return value;
  const hit = cache.get(value as object);
  if (hit) return hit as T;
  const result = Array.isArray(value)
    ? value.map(resolve)
    : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
  cache.set(value as object, result);
  return result as T;
}

// One reader for every section: dictionaries[locale][key], tokens filled.
function read<K extends keyof D>(key: K, locale?: Locale): D[K] {
  const language = locale ?? getRequestLocale();
  if (IS_DEV && (key === "posts" || key === "projects")) {
    return resolve(fromDisk(`${language}/${key}.json`, dictionaries[language][key]));
  }
  return resolve(dictionaries[language][key]);
}

export function getNav(locale?: Locale): NavContent {
  return read("nav", locale);
}
export function getHero(locale?: Locale): HeroContent {
  return read("hero", locale);
}
export function getProof(locale?: Locale): ProofContent {
  return read("proof", locale);
}
export function getAudiences(locale?: Locale): AudiencesContent {
  return read("audiences", locale);
}
export function getProblem(locale?: Locale): ProblemContent {
  return read("problem", locale);
}
export function getServices(locale?: Locale): ServicesContent {
  return read("services", locale);
}
export function getServicesPage(locale?: Locale): ServicesPageContent {
  return read("servicesPage", locale);
}
export function getProcess(locale?: Locale): ProcessContent {
  return read("process", locale);
}
export function getWork(locale?: Locale): WorkContent {
  return read("work", locale);
}
export function getProjects(locale?: Locale): Project[] {
  const language = locale ?? getRequestLocale();
  return (read("projects", language) as Project[]).map((project) => ({ ...project, coverImage: coverFor(project.cover, language) }));
}
export function getProject(slug: string, locale?: Locale): Project | undefined {
  return getProjects(locale).find((project) => project.slug === slug);
}
export function getWorkPage(locale?: Locale): WorkPageContent {
  return read("workPage", locale);
}
export function getPosts(locale?: Locale): Post[] {
  // Newest first.
  const language = locale ?? getRequestLocale();
  return (read("posts", language) as Post[])
    .map((post) => ({ ...post, coverImage: coverFor(post.cover, language) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function getPost(slug: string, locale?: Locale): Post | undefined {
  return getPosts(locale).find((post) => post.slug === slug);
}
export function getBlogPage(locale?: Locale): BlogPageContent {
  return read("blogPage", locale);
}
export function getAbout(locale?: Locale): AboutContent {
  return read("about", locale);
}
export function getContact(locale?: Locale): ContactContent {
  return read("contact", locale);
}
export function getLegal(locale?: Locale): LegalContent {
  return read("legal", locale) as LegalContent;
}
export function getReferrals(locale?: Locale): ReferralsContent {
  return read("referrals", locale);
}
export function getFreeDesign(locale?: Locale): FreeDesignContent {
  return read("freeDesign", locale);
}
export function getNotFound(locale?: Locale): NotFoundContent {
  return read("notFound", locale);
}
export function getPacks(locale?: Locale): PacksContent {
  return read("packs", locale);
}
export function getWhy(locale?: Locale): WhyContent {
  return read("why", locale);
}
export function getFaq(locale?: Locale): FaqContent {
  return read("faq", locale);
}
export function getCta(locale?: Locale): CtaContent {
  return read("cta", locale);
}
export function getFooter(locale?: Locale): FooterContent {
  return read("footer", locale);
}
export function getSeo(locale?: Locale): SeoContent {
  return read("seo", locale);
}

/** The shared business data (phone, email, domain...). Same in every language. */
export function getSite(): SharedSite {
  return sharedSite;
}

// Builds a WhatsApp link that opens a chat with our number and a ready-made
// first message:  getWhatsAppUrl("Hello")  ->  https://wa.me/2126...?text=Hello
export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${sharedSite.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
