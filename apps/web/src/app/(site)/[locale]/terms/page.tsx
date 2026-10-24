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
  return pageMetadata(locale as Locale, "/terms/", "terms");
}

// /terms/ : the terms of service.
export default async function TermsPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <>
      <PageSchema locale={locale as Locale} path="/terms/" pageKey="terms" />
      <Navbar currentPath="/terms/" />
      <main>
        <LegalPage doc={getLegal().terms} />
      </main>
    </>
  );
}
