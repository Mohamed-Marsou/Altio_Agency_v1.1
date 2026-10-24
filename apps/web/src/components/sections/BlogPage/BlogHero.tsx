import { getBlogPage } from "@/lib/content";
import styles from "./BlogHero.module.scss";

// The top of the Blog page. Server component.
export default function BlogHero() {
  const { hero } = getBlogPage();

  return (
    <header className={styles.blogHero}>
      <div className={styles.blogHeroContent}>
        <p className={styles.blogHeroEyebrow}>{hero.eyebrow}</p>
        <h1 className={styles.blogHeroTitle}>
          {hero.title} <span className={styles.blogHeroAccent}>{hero.accent}</span>
        </h1>
        <p className={styles.blogHeroLead}>{hero.lead}</p>
      </div>
    </header>
  );
}
