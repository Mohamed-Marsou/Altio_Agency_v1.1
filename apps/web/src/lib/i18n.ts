// =============================================================================
// i18n HELPERS (languages: English, French, Arabic)
// -----------------------------------------------------------------------------
// Pure functions, no React: safe to use on the server, in the browser and in tests.
// URLs always start with the language:  /en/services/  /fr/services/  /ar/services/
// =============================================================================

export const LOCALES = ["en", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

// The language used when a visitor has no saved choice (see the "/" page).
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

/** Open Graph locale codes. */
export const OG_LOCALES: Record<Locale, string> = { en: "en_US", fr: "fr_FR", ar: "ar_MA" };

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Text direction of a language. Arabic is written right to left. */
export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** True for links that leave the site or do not point at a page (mailto:, #top, https://). */
function isSpecialHref(href: string): boolean {
  return !href.startsWith("/") || href.startsWith("//");
}

/**
 * Adds the language in front of an internal address.
 *   localePath("fr", "/services/#launch")  ->  "/fr/services/#launch"
 * Addresses that already have a language, external links and anchors are unchanged.
 */
export function localePath(locale: Locale, href: string): string {
  if (isSpecialHref(href)) return href;
  const first = href.split("/")[1]?.split(/[?#]/)[0];
  if (isLocale(first)) return href;
  return href === "/" ? `/${locale}/` : `/${locale}${href}`;
}

/**
 * Removes the language from a path.  "/fr/blog/" -> "/blog/"   "/fr/" -> "/"
 * Used to find the same page in another language and to highlight the nav link.
 */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    const rest = `/${parts.slice(2).join("/")}`;
    return rest === "/" || rest === "" ? "/" : rest;
  }
  return pathname || "/";
}

/** The language found at the start of a path, or undefined. */
export function localeFromPath(pathname: string): Locale | undefined {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : undefined;
}
