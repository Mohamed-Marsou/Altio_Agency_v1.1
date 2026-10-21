import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import FreeDesignSections from "@/components/sections/FreeDesignPage/FreeDesignSections";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getSite } from "@/lib/content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/free-design/", "freeDesign");
}

// The Free design landing page: the offer, a short form, what you get and what
// happens next.
export default async function FreeDesignPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <>
      <PageSchema locale={locale as Locale} path="/free-design/" pageKey="freeDesign" />
      <Navbar currentPath="/free-design/" />
      <main>
        <FreeDesignSections whatsappNumber={getSite().whatsappNumber} />
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
