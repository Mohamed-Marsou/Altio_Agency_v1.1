// =============================================================================
// SEO HELPERS
// -----------------------------------------------------------------------------
// One place builds, for every page and every language:
//   - the title and description (text comes from content/<lang>/seo.json),
//   - the canonical address and the hreflang links (the same page in en, fr, ar),
//   - Open Graph and Twitter cards,
//   - the structured data (JSON-LD) Google reads.
// Business facts (name, phone, city...) come from content/shared/site.json only,
// so the data in the page and the structured data can never disagree.
// =============================================================================
import type { Metadata } from "next";
import sharedSite from "@/content/shared/site.json";
import { getSeo } from "./content";
import { LOCALES, OG_LOCALES, type Locale } from "./i18n";

/** Public address of the site, no trailing slash. Override with NEXT_PUBLIC_SITE_URL. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${sharedSite.domain}`).replace(/\/$/, "");

export type SeoPageKey =
  | "home"
  | "services"
  | "work"
  | "blog"
  | "about"
  | "contact"
  | "freeDesign"
  | "referrals"
  | "privacy"
  | "terms"
  | "notFound";

/** "/services/" + "fr" -> "/fr/services/" */
export function pagePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}/` : `/${locale}${path}`;
}

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path}`;
}

/** Every language version of a page, for <link rel="alternate" hreflang>. */
function alternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = pagePath(l, path);
  languages["x-default"] = "/";
  return { canonical: pagePath(locale, path), languages };
}

type BuildInput = {
  locale: Locale;
  /** the page address WITHOUT the language, e.g. "/blog/my-post/" */
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  /** Optional article details */
  publishedTime?: string;
  /** Social image path (defaults to the language's generated card) */
  image?: string;
  noindex?: boolean;
};

export function buildMetadata(input: BuildInput): Metadata {
  const { locale, path, title, description, type = "website", publishedTime, noindex } = input;
  const seo = getSeo(locale);
  const fullTitle = `${title} | ${seo.siteName}`;
  const image = input.image ?? `/og/${locale}.png`;

  return {
    title: fullTitle,
    description,
    alternates: alternates(locale, path),
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: pagePath(locale, path),
      siteName: seo.siteName,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      images: [{ url: image, width: 1200, height: 630, alt: seo.ogAlt }],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}

/** Metadata of a normal page: the text comes from content/<lang>/seo.json. */
export function pageMetadata(locale: Locale, path: string, key: SeoPageKey): Metadata {
  const page = getSeo(locale).pages[key];
  return buildMetadata({ locale, path, title: page.title, description: page.description, noindex: key === "notFound" });
}

// ---- Structured data (JSON-LD) ---------------------------------------------
const logoUrl = () => absoluteUrl("/altio-logo.webp");
const phoneE164 = () => `+${sharedSite.whatsappNumber}`;

export function organizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: sharedSite.legalName,
    url: siteUrl,
    logo: logoUrl(),
    email: sharedSite.email,
    telephone: phoneE164(),
    areaServed: "MA",
    inLanguage: locale,
    ...(sharedSite.social.length ? { sameAs: sharedSite.social } : {}),
  };
}

export function webSiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: sharedSite.brand,
    url: absoluteUrl(pagePath(locale, "/")),
    inLanguage: locale,
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function localBusinessJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": `${siteUrl}/#localbusiness`,
    name: sharedSite.legalName,
    url: absoluteUrl(pagePath(locale, "/")),
    image: logoUrl(),
    telephone: phoneE164(),
    email: sharedSite.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: sharedSite.city,
      addressCountry: sharedSite.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: sharedSite.geo.lat, longitude: sharedSite.geo.lng },
    openingHours: sharedSite.openingHours,
    areaServed: { "@type": "Country", name: "Morocco" },
  };
}

export function breadcrumbJsonLd(locale: Locale, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(pagePath(locale, item.path)),
    })),
  };
}

export function articleJsonLd(
  locale: Locale,
  post: { slug: string; title: string; excerpt: string; date: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(pagePath(locale, `/blog/${post.slug}/`)),
    image: absoluteUrl(`/og/${locale}.png`),
    author: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function serviceJsonLd(locale: Locale, services: { name: string; description: string }[]) {
  return services.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: "MA",
    inLanguage: locale,
  }));
}

export function caseStudyJsonLd(
  locale: Locale,
  project: { slug: string; title: string; teaser: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.teaser,
    inLanguage: locale,
    url: absoluteUrl(pagePath(locale, `/work/${project.slug}/`)),
    creator: { "@id": `${siteUrl}/#organization` },
  };
}
