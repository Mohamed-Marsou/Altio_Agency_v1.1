import type { MetadataRoute } from "next";
import { getPosts, getProjects } from "@/lib/content";
import { LOCALES } from "@/lib/i18n";
import { absoluteUrl, pagePath } from "@/lib/seo";

// Needed for the static export: the file is written once, at build time.
export const dynamic = "force-static";

// Pages every language has (the language is added in front by pagePath()).
const PAGES = ["/", "/services/", "/work/", "/blog/", "/about/", "/contact/", "/free-design/", "/referrals/", "/privacy/", "/terms/"];

// sitemap.xml: the list of every page for search engines. Each entry also tells
// Google where the same page is in the other languages (hreflang).
export default function sitemap(): MetadataRoute.Sitemap {
  const alternatesFor = (path: string) => ({
    languages: Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(pagePath(l, path))])),
  });

  const entries: MetadataRoute.Sitemap = [];

  for (const path of PAGES) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(pagePath(locale, path)),
        changeFrequency: path === "/" || path === "/blog/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : path === "/privacy/" || path === "/terms/" ? 0.3 : 0.8,
        alternates: alternatesFor(path),
      });
    }
  }

  // Blog posts and case studies (same slug in every language).
  for (const post of getPosts("en")) {
    const path = `/blog/${post.slug}/`;
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(pagePath(locale, path)),
        lastModified: post.date,
        changeFrequency: "yearly",
        priority: 0.6,
        alternates: alternatesFor(path),
      });
    }
  }
  for (const project of getProjects("en")) {
    const path = `/work/${project.slug}/`;
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(pagePath(locale, path)),
        changeFrequency: "yearly",
        priority: 0.6,
        alternates: alternatesFor(path),
      });
    }
  }

  return entries;
}
