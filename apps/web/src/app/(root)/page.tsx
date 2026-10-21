import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE } from "@/lib/i18n";
import LanguageRedirect from "./LanguageRedirect";

// "/" has no content of its own. It sends the visitor to a language:
//   1. the language they chose before (saved in the browser),
//   2. else their browser language (if we have it),
//   3. else the default language.
// Search engines and visitors without JavaScript see the plain list of links.
export default function RootPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: "2rem" }}>
      <LanguageRedirect />
      <div>
        <h1>Altio</h1>
        <p>
          <span lang="en">Choose your language</span> · <span lang="fr">Choisissez votre langue</span> ·{" "}
          <span lang="ar" dir="rtl">اختر لغتك</span>
        </p>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {LOCALES.map((locale) => (
            <li key={locale}>
              <a href={`/${locale}/`} hrefLang={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
                {LOCALE_NAMES[locale]}
              </a>
            </li>
          ))}
        </ul>
        <noscript>
          <meta httpEquiv="refresh" content={`3;url=/${DEFAULT_LOCALE}/`} />
        </noscript>
      </div>
    </main>
  );
}
