"use client";

import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./i18n";

/** The language of the current page, for client components (reads /<lang>/ from the address). */
export function useLocale(): Locale {
  const params = useParams<{ locale?: string }>();
  return isLocale(params?.locale) ? params.locale : DEFAULT_LOCALE;
}
