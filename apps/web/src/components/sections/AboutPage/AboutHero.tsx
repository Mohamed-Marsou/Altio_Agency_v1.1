import type { CSSProperties } from "react";
import { getAbout, getWhatsAppUrl } from "@/lib/content";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import styles from "./AboutHero.module.scss";

// The top of the About page. Left: headline and one WhatsApp button. Right: an
// "orbit" with the Altio mark in the middle and the three roles (design,
// engineering, support) floating around it. No faces or names on purpose.
// Server component.
export default function AboutHero() {
  const { hero } = getAbout();

  return (
    <header className={styles.aboutHero}>
      <div className={styles.aboutHeroContent}>
        <div className={styles.aboutHeroText}>
          <p className={styles.aboutHeroEyebrow}>{hero.eyebrow}</p>
          <h1 className={styles.aboutHeroTitle}>
            {hero.title} <span className={styles.aboutHeroAccent}>{hero.accent}</span>
          </h1>
          <p className={styles.aboutHeroLead}>{hero.lead}</p>
          <MorphButton
            href={getWhatsAppUrl(hero.cta.message)}
            label={hero.cta.label}
            hoverLabel={hero.cta.hoverLabel}
            size="large"
          />
        </div>

        <div className={styles.aboutHeroOrbit} role="img" aria-label={hero.orbitLabel}>
          <span className={styles.aboutHeroRingInner} />
          <span className={styles.aboutHeroRingOuter} />
          <span className={styles.aboutHeroCore}>
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M32 6 58 58H46L32 28 20 52h13l3 6H6L32 6Z" fill="currentColor" />
            </svg>
          </span>

          {hero.nodes.map((node, index) => (
            <span
              key={node.title}
              className={styles.aboutHeroNode}
              data-index={index}
              style={{ "--node": index } as CSSProperties}
            >
              <i>{node.letter}</i>
              <b>{node.title}</b>
              {node.text}
            </span>
          ))}

          {hero.pins.map((pin, index) => (
            <span
              key={pin}
              className={styles.aboutHeroPin}
              data-index={index}
              style={{ "--pin": index } as CSSProperties}
            >
              <i />
              {pin}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
