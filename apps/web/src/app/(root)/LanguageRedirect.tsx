"use client";

import { useEffect } from "react";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";

import { LOCALE_STORAGE_KEY } from "@/lib/i18n-client";

export { LOCALE_STORAGE_KEY };

// Runs in the browser on "/": picks the language and jumps to it.
export function pickLocale(saved: string | null, browserLanguages: readonly string[]): Locale {
  if (isLocale(saved)) return saved;
  for (const tag of browserLanguages) {
    const short = tag.toLowerCase().split("-")[0];
    if (isLocale(short)) return short;
  }
  return DEFAULT_LOCALE;
}

export default function LanguageRedirect() {
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      // storage blocked: use the browser language
    }
    window.location.replace(`/${pickLocale(saved, navigator.languages ?? [navigator.language])}/`);
  }, []);
  return null;
}
