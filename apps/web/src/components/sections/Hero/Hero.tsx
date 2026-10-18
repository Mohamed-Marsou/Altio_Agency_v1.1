import { getHero, getWhatsAppUrl } from "@/lib/content";
import Button from "@/components/ui/Button/Button";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import HeroHeadline from "./HeroHeadline";
import HeroVisual from "./HeroVisual";
import styles from "./Hero.module.scss";

// The first section of the Home page: promise, two WhatsApp buttons, a visual.
// A SERVER component (it only prints HTML); only HeroHeadline needs JavaScript.
//
// `data-hero` is a plain attribute (not a hashed class) so that the hover rules
// in HeroVisual.module.scss can react when the mouse is anywhere over the hero.
export default function Hero() {
  const hero = getHero();

  return (
    <section className={styles.heroSection} data-hero>
      <div className={styles.heroGrid}>
        {/* Left column on desktop / first block on phones */}
        <div className={styles.heroTextColumn}>
          <span className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden="true" />
            {hero.badge}
          </span>

          <HeroHeadline title={hero.title} headlines={hero.headlines} />

          <p className={styles.heroLeadText}>{hero.lead}</p>

          <div className={styles.heroButtonRow}>
            <MorphButton
              href={getWhatsAppUrl(hero.primaryCta.message)}
              label={hero.primaryCta.label}
              hoverLabel={hero.primaryCta.hoverLabel}
              size="large"
            />
            <Button
              href={getWhatsAppUrl(hero.secondaryCta.message)}
              size="large"
              variant="secondary"
            >
              {hero.secondaryCta.label}
            </Button>
          </div>

          <p className={styles.heroSmallNote}>{hero.microcopy}</p>
        </div>

        {/* Right column on desktop / below the text on phones */}
        <HeroVisual {...hero.visual} />
      </div>
    </section>
  );
}
