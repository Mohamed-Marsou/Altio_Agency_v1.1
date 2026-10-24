import { cache } from "react";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

// The language of the page being rendered, shared by every server component of
// ONE page render without passing it through props.
//
// React's cache() gives each page render its own box. The layout and each page
// put the language in the box first (setRequestLocale), then the content
// loaders (getHero(), getNav() ...) read it. It is the same idea next-intl uses.
const box = cache(() => ({ locale: DEFAULT_LOCALE as Locale }));

export function setRequestLocale(locale: Locale) {
  box().locale = locale;
}

export function getRequestLocale(): Locale {
  return box().locale;
}
