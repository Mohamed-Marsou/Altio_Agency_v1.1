import { getServicesPage, getWhatsAppUrl } from "@/lib/content";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import styles from "./ServicesHero.module.scss";

// The top of the Services page. Left: headline, lead and ONE WhatsApp button
// (blue, turns green on hover). Right: the four services drawn as floating
// layers, like a stack of cards seen from above. Server component.
export default function ServicesHero() {
  const { hero, stackLabel } = getServicesPage();

  return (
    <header className={styles.servicesHero}>
      <div className={styles.servicesHeroContent}>
        <div className={styles.servicesHeroText}>
          <p className={styles.servicesHeroEyebrow}>{hero.eyebrow}</p>
          <h1 className={styles.servicesHeroTitle}>
            {hero.title} <span className={styles.servicesHeroAccent}>{hero.accent}</span>
          </h1>
          <p className={styles.servicesHeroLead}>{hero.lead}</p>
          <MorphButton
            href={getWhatsAppUrl(hero.cta.message)}
            label={hero.cta.label}
            hoverLabel={hero.cta.hoverLabel}
            size="large"
          />
        </div>

        <div className={styles.servicesHeroStack} role="img" aria-label={stackLabel}>
          <div className={styles.servicesHeroLayers}>
            {hero.layers.map((layer, index) => (
              <div
                key={layer.name}
                className={styles.servicesHeroLayer}
                style={{ "--index": index } as React.CSSProperties}
              >
                <span className={styles.servicesHeroLayerName}>{layer.name}</span>
                <span className={styles.servicesHeroLayerBars}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.servicesHeroLayerText}>{layer.text}</span>
              </div>
            ))}
          </div>

          {hero.pins.map((pin, index) => (
            <span
              key={pin}
              className={styles.servicesHeroPin}
              style={{ "--pin-index": index } as React.CSSProperties}
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
