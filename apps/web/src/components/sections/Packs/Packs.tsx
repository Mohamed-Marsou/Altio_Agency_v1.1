import clsx from "clsx";
import { Check, Star } from "lucide-react";
import { getPacks, getWhatsAppUrl } from "@/lib/content";
import Button from "@/components/ui/Button/Button";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import PacksSwipe from "./PacksSwipe";
import styles from "./Packs.module.scss";

// Section 7 of the Home page: the four packs. NO prices are shown on purpose;
// the button opens WhatsApp with a message that names the pack.
// The "featured" pack (Custom, the most used) is highlighted. On hover it also
// reveals a "Most used pack" badge from behind the card and a blue outline that
// draws itself around the card. On phones the cards are a swipe row (PacksSwipe
// adds a small "swipe me" hint when nobody touches it).
export default function Packs() {
  const packs = getPacks();

  return (
    <section className={styles.packsSection}>
      <div className={styles.packsContent}>
        <SectionHeading
          eyebrow={packs.eyebrow}
          title={packs.title}
          subtitle={packs.subtitle}
        />

        <PacksSwipe className={styles.packsList}>
          {packs.items.map((pack) => (
            <li key={pack.id} className={styles.packsItem}>
              {/* Sits BEHIND the card (the card is drawn on top of it) */}
              {pack.featured && (
                <span className={styles.packsBadge}>
                  <Star size={14} aria-hidden="true" />
                  {packs.badge}
                </span>
              )}

              <article className={clsx(styles.packsCard, pack.featured && styles.packsCardIsFeatured)}>
                <p className={styles.packsCardNumber}>{pack.number}</p>
                <h3 className={styles.packsCardName}>{pack.name}</h3>
                <p className={styles.packsCardTagline}>{pack.tagline}</p>

                <ul className={styles.packsCardFeatures}>
                  {pack.features.map((feature) => (
                    <li key={feature} className={styles.packsCardFeature}>
                      <Check size={16} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {pack.featured ? (
                  <MorphButton
                    href={getWhatsAppUrl(pack.message)}
                    label={packs.ctaLabel}
                    hoverLabel={packs.hoverLabel}
                    fullWidth
                    className={styles.packsCardButton}
                  />
                ) : (
                  <Button
                    href={getWhatsAppUrl(pack.message)}
                    variant="secondary"
                    fullWidth
                    className={styles.packsCardButton}
                  >
                    {packs.ctaLabel}
                  </Button>
                )}

                {/* Hover outline: a rectangle drawn as a stroke, like a progress bar */}
                {pack.featured && (
                  <svg className={styles.packsCardOutline} aria-hidden="true">
                    <rect className={styles.packsCardOutlinePath} pathLength={1} />
                  </svg>
                )}
              </article>
            </li>
          ))}
        </PacksSwipe>

        <p className={styles.packsNote}>{packs.note}</p>
      </div>
    </section>
  );
}
