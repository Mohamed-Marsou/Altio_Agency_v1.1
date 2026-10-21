import type { Metadata } from "next";
import JsonLd from "@/components/system/JsonLd";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import ProofStrip from "@/components/sections/ProofStrip/ProofStrip";
import Included from "@/components/sections/ServicesPage/Included";
import ServiceBlock from "@/components/sections/ServicesPage/ServiceBlock";
import ServicesHero from "@/components/sections/ServicesPage/ServicesHero";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getServicesPage } from "@/lib/content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/services/", "services");
}

// The Services page: hero, the trust strip, the four services (one per pack),
// what every pack includes, and the closing call to action. The Footer comes
// from the root layout. Every section below the hero slides up with <Reveal>.
export default async function ServicesPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { items } = getServicesPage();

  return (
    <>
      <JsonLd data={serviceJsonLd(locale as Locale, items.map((item) => ({ name: item.title, description: item.lead })))} />
      <PageSchema locale={locale as Locale} path="/services/" pageKey="services" />
      <Navbar currentPath="/services/" />
      <main>
        <ServicesHero />
        <Reveal>
          <ProofStrip />
        </Reveal>
        {items.map((item, index) => (
          <Reveal key={item.id}>
            <ServiceBlock item={item} index={index} />
          </Reveal>
        ))}
        <Reveal>
          <Included />
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
