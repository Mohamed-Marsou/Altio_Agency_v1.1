import { getWorkPage } from "@/lib/content";
import styles from "./WorkHero.module.scss";

// The top of the Work page: eyebrow, big headline with an accent line, intro.
// Server component.
export default function WorkHero() {
  const { hero } = getWorkPage();

  return (
    <header className={styles.workHero}>
      <div className={styles.workHeroContent}>
        <p className={styles.workHeroEyebrow}>{hero.eyebrow}</p>
        <h1 className={styles.workHeroTitle}>
          {hero.title} <span className={styles.workHeroAccent}>{hero.accent}</span>
        </h1>
        <p className={styles.workHeroLead}>{hero.lead}</p>
      </div>
    </header>
  );
}
