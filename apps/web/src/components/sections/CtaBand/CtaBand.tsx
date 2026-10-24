import { getCta, getWhatsAppUrl } from "@/lib/content";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import Button from "@/components/ui/Button/Button";
import styles from "./CtaBand.module.scss";

// The closing call to action: a big blue band with the final promise and the
// two buttons (free design / WhatsApp). Server component (no JavaScript).
export default function CtaBand() {
  const cta = getCta();

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <div className={styles.ctaBand}>
          <div className={styles.ctaText}>
            <h2 className={styles.ctaTitle}>{cta.title}</h2>
            <p className={styles.ctaLead}>{cta.text}</p>
          </div>

          <div className={styles.ctaButtons}>
            <MorphButton
              href={getWhatsAppUrl(cta.primary.message)}
              label={cta.primary.label}
              hoverLabel={cta.primary.hoverLabel}
              variant="light"
              size="large"
              fullWidth
            />
            <Button href={getWhatsAppUrl(cta.secondary.message)} variant="dark" size="large" fullWidth>
              {cta.secondary.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
