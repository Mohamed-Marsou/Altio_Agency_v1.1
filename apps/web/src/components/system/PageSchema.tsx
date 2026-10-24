import JsonLd from "./JsonLd";
import { getNav, getSeo } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { breadcrumbJsonLd, type SeoPageKey } from "@/lib/seo";

// Adds the breadcrumb ("Home > Services") structured data to an inner page.
export default function PageSchema({ locale, path, pageKey }: { locale: Locale; path: string; pageKey: SeoPageKey }) {
  const home = getNav(locale).links.find((link) => link.href === "/")?.label ?? "Altio";
  const page = getSeo(locale).pages[pageKey].title;
  return <JsonLd data={breadcrumbJsonLd(locale, [{ name: home, path: "/" }, { name: page, path }])} />;
}
