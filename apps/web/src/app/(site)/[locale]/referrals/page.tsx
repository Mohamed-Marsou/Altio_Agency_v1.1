import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import ReferralsSections from "@/components/sections/ReferralsPage/ReferralsSections";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getSite } from "@/lib/content";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/referrals/", "referrals");
}

// The Referrals page: how it works, the reward choices, the rules and the form.
export default async function ReferralsPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <>
      <PageSchema locale={locale as Locale} path="/referrals/" pageKey="referrals" />
      <Navbar currentPath="/referrals/" />
      <main>
        <ReferralsSections whatsappNumber={getSite().whatsappNumber} />
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
