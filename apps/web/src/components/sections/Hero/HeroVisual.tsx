import { Check, MessageCircle } from "lucide-react";
import styles from "./HeroVisual.module.scss";

type HeroVisualProps = {
  url: string;
  chipReady: string;
  chipTime: string;
};

// The hero "picture" is NOT an image file: it is a browser window drawn with
// HTML + CSS (grey blocks pretending to be a page) plus three floating chips
// (design ready, 48h, WhatsApp). Why no image:
//   - it loads instantly (nothing to download) and is razor sharp everywhere;
//   - it switches to dark mode by itself (it uses the colour tokens);
//   - every part can be animated and the texts can be translated.
// It is purely decorative, so screen readers skip it (aria-hidden).
// All the hover animation is in the stylesheet (pure CSS).
export default function HeroVisual({ url, chipReady, chipTime }: HeroVisualProps) {
  return (
    <div className={styles.heroVisual} aria-hidden="true">
      {/* Two halos stacked: blue by default, green fades in on hover */}
      <div className={styles.heroVisualGlowBlue} />
      <div className={styles.heroVisualGlowGreen} />

      <div className={styles.heroVisualBrowser}>
        <div className={styles.heroVisualBrowserBar}>
          <span className={styles.heroVisualBrowserDot} />
          <span className={styles.heroVisualBrowserDot} />
          <span className={styles.heroVisualBrowserDot} />
          <span className={styles.heroVisualBrowserUrl}>{url}</span>
        </div>

        <div className={styles.heroVisualPage}>
          <span className={styles.heroVisualPageEyebrow} />
          <span className={styles.heroVisualPageTitleLong} />
          <span className={styles.heroVisualPageTitleShort} />
          <span className={styles.heroVisualPageTextLong} />
          <span className={styles.heroVisualPageTextShort} />
          <span className={styles.heroVisualPageButton} />
          <div className={styles.heroVisualPageCardsRow}>
            <span className={styles.heroVisualPageCard} />
            <span className={styles.heroVisualPageCard} />
            <span className={styles.heroVisualPageCard} />
          </div>
        </div>
      </div>

      <div className={styles.heroVisualChipReady}>
        <span className={styles.heroVisualChipReadyIcon}>
          <Check size={16} />
        </span>
        {chipReady}
      </div>

      <div className={styles.heroVisualChipTime}>{chipTime}</div>

      <div className={styles.heroVisualChipWhatsApp}>
        <MessageCircle size={24} />
      </div>
    </div>
  );
}
