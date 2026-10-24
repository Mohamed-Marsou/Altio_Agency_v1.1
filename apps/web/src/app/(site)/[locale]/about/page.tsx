import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import AboutBody from "@/components/sections/AboutPage/AboutBody";
import AboutHero from "@/components/sections/AboutPage/AboutHero";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import Reveal from "@/components/ui/Reveal/Reveal";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/about/", "about");
}

// The About page: hero, the facts, our story, principles, how the team works,
// where we are, and the closing call to action. The Footer comes from the layout.
export default async function AboutPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <>
      <PageSchema locale={locale as Locale} path="/about/" pageKey="about" />
      <Navbar currentPath="/about/" />
      <main>
        <AboutHero />
        <AboutBody />
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
