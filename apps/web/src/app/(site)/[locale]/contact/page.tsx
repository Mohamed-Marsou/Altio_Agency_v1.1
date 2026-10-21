import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import ContactForm from "@/components/sections/ContactPage/ContactForm";
import ContactMethods from "@/components/sections/ContactPage/ContactMethods";
import ContactSteps from "@/components/sections/ContactPage/ContactSteps";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getContact, getSite } from "@/lib/content";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Contact | Altio",
  description:
    "Tell us about your business on WhatsApp or with a short form. We reply with a custom design in 48 to 72 hours.",
};

// The Contact page: headline, then the ways to reach us next to the form, then
// what happens next. The Footer comes from the layout.
export default function ContactPage() {
  const { hero, form } = getContact();
  const { whatsappNumber } = getSite();

  return (
    <>
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
