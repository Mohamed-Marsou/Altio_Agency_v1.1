import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer/Footer";
import ErrorReporter from "@/components/system/ErrorReporter";
import SiteLoader from "@/components/ui/SiteLoader/SiteLoader";
import CustomCursor from "@/components/ui/CustomCursor/CustomCursor";
import { dirOf, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { organizationJsonLd, siteUrl, webSiteJsonLd } from "@/lib/seo";
import { ADMIN_THEME_INIT_SCRIPT, THEME_INIT_SCRIPT } from "@/lib/theme";
import JsonLd from "@/components/system/JsonLd";
import { arabic, display, text } from "../../fonts";
import "../../globals.scss";

// The loading screen adds about one second before the first view is shown. To switch it off
// (better Google speed scores) build with NEXT_PUBLIC_SITE_LOADER=off.
const useLoader = process.env.NEXT_PUBLIC_SITE_LOADER !== "off";

// One static page set per language: /en/..., /fr/..., /ar/...
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Site-wide defaults. Every page overrides title and description (lib/seo.ts).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Altio",
  formatDetection: { telephone: false },
};

// THE root layout of the public site. It writes <html lang dir> for the page's
// language, so Arabic pages are right-to-left from the very first byte of HTML.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  setRequestLocale(locale);

  // The Arabic font class is added ONLY on /ar (see app/fonts.ts).
  const fontClasses = `${display.variable} ${text.variable}${locale === "ar" ? ` ${arabic.variable}` : ""}`;

  return (
    // data-theme is NOT written here: the small script below sets it ("light" or
    // "dark") before the page paints, from the visitor's saved choice. Without it
    // the light tokens apply by default. suppressHydrationWarning tells React that
    // this one attribute is allowed to differ from the server HTML.
    <html lang={locale} dir={dirOf(locale)} className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: useLoader ? THEME_INIT_SCRIPT : ADMIN_THEME_INIT_SCRIPT }} />
        <JsonLd data={[organizationJsonLd(locale), webSiteJsonLd(locale)]} />
      </head>
      {/* suppressHydrationWarning: browser extensions (Grammarly etc.) add attributes to
          <body> before React loads; without this React reports a false mismatch. */}
      <body suppressHydrationWarning>
        {/* The loading screen: covers the page until it is really painted */}
        {useLoader && <SiteLoader />}
        {children}
        {/* Catches errors nobody handled and writes them to the error log */}
        <ErrorReporter />
        <Footer />
        {/* The brand cursor + click ripple (only runs on devices with a mouse) */}
        <CustomCursor />
      </body>
    </html>
  );
}
