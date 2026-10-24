import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import ContactForm from "@/components/sections/ContactPage/ContactForm";
import ContactMethods from "@/components/sections/ContactPage/ContactMethods";
import ContactSteps from "@/components/sections/ContactPage/ContactSteps";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getContact, getSite } from "@/lib/content";
import styles from "./contact.module.scss";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/contact/", "contact");
}

// The Contact page: headline, then the ways to reach us next to the form, then
// what happens next. The Footer comes from the layout.
export default async function ContactPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { hero, form } = getContact();
  const { whatsappNumber } = getSite();

  return (
    <>
      <PageSchema locale={locale as Locale} path="/contact/" pageKey="contact" />
      <Navbar currentPath="/contact/" />
      <main>
        <header className={styles.contactHero}>
          <div className={styles.contactHeroContent}>
            <p className={styles.contactHeroEyebrow}>{hero.eyebrow}</p>
            <h1 className={styles.contactHeroTitle}>
              {hero.title} <span className={styles.contactHeroAccent}>{hero.accent}</span>
            </h1>
            <p className={styles.contactHeroLead}>{hero.lead}</p>
          </div>
        </header>

        <section className={styles.contactMain}>
          <div className={styles.contactMainContent}>
            <ContactMethods />
            <ContactForm form={form} whatsappNumber={whatsappNumber} />
          </div>
        </section>

        <Reveal>
          <ContactSteps />
        </Reveal>
      </main>
    </>
  );
}
