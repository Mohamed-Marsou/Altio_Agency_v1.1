// Small formatting helpers shared by pages.
import type { Locale } from "./i18n";

// Dates are written the local way: "Mar 12, 2026" / "12 mars 2026" / "12 مارس 2026".
// Western digits (0 to 9) are used in Arabic too, as is usual in Morocco.
const DATE_LOCALES: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA-u-nu-latn",
};

// "2026-03-12" -> "Mar 12, 2026". UTC on purpose: the date is the same for
// every visitor, whatever their time zone, and the static build matches the browser.
export function formatDate(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
