import { isLocale, stripLocale, type Locale } from "./i18n";

// Key under which the visitor's language choice is saved in the browser.
export const LOCALE_STORAGE_KEY = "altio-locale";

/**
 * Opens the same page in another language and remembers the choice.
 * It is a full page load on purpose: the language changes <html lang dir> and the
 * fonts, and a clean load guarantees everything matches the new language.
 */
export function switchLocale(code: string) {
  if (!isLocale(code)) return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    // storage blocked: the switch still works, it just is not remembered
  }
  const rest = stripLocale(window.location.pathname);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full page load on purpose (see above)
  window.location.assign(`/${code}${rest === "/" ? "/" : rest}${window.location.search}${window.location.hash}`);
}

export type { Locale };
