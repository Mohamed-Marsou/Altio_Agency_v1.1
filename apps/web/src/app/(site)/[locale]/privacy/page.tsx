import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import LegalPage from "@/components/sections/LegalPage/LegalPage";
import { getLegal } from "@/lib/content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/privacy/", "privacy");
}

// /privacy/ : the privacy policy, with the cookies section inside it.
export default async function PrivacyPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <>
      <PageSchema locale={locale as Locale} path="/privacy/" pageKey="privacy" />
      <Navbar currentPath="/privacy/" />
      <main>
        <LegalPage doc={getLegal().privacy} />
      </main>
    </>
  );
}
