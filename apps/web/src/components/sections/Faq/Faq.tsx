import { getFaq, getWhatsAppUrl } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import FaqList from "./FaqList";
import styles from "./Faq.module.scss";

// Section 9 of the Home page: frequently asked questions. This file is the
// shell (heading + WhatsApp link); the open/close behaviour lives in FaqList,
// the only part that needs JavaScript.
export default function Faq() {
  const faq = getFaq();

  return (
    <section className={styles.faqSection}>
      <div className={styles.faqContent}>
        <div className={styles.faqIntro}>
          <SectionHeading eyebrow={faq.eyebrow} title={faq.title} />
          <p className={styles.faqHelp}>
            {faq.subtitle}{" "}
            <a
              className={styles.faqHelpLink}
              href={getWhatsAppUrl(faq.linkMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {faq.linkLabel}
            </a>
          </p>
        </div>

        <FaqList items={faq.items} />
      </div>
    </section>
  );
}
