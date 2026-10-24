import Link from "@/components/ui/LocaleLink/LocaleLink";
import { Monitor } from "lucide-react";
import { getWork } from "@/lib/content";
import Button from "@/components/ui/Button/Button";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./Work.module.scss";

// Section 6 of the Home page: "Selected work". Four project cards, two per row.
// Each card is one link. The preview box is a placeholder until real
// screenshots exist (then only the <div> with the icon is swapped for an image).
// Server component (no JavaScript).
export default function Work() {
  const work = getWork();

  return (
    <section className={styles.workSection}>
      <div className={styles.workContent}>
        <div className={styles.workHeader}>
          <SectionHeading eyebrow={work.eyebrow} title={work.title} />
          <Button href={work.linkHref} variant="secondary">
            {work.linkLabel}
          </Button>
        </div>

        <ul className={styles.workList}>
          {work.items.map((item) => (
            <li key={item.id} className={styles.workItem}>
              <Link href={item.href} className={styles.workCard}>
                <span className={styles.workCardPreview}>
                  <span className={styles.workCardPlaceholder}>
                    <Monitor size={28} aria-hidden="true" />
                    {work.previewLabel}
                  </span>

                  {/* Hover: a blue outline draws itself around the preview like a
                      progress bar. pathLength={1} makes "1" = the whole outline. */}
                  <svg className={styles.workCardOutline} aria-hidden="true">
                    <rect className={styles.workCardOutlinePath} pathLength={1} />
                  </svg>
                </span>

                <span className={styles.workCardTag}>{item.tag}</span>
                <h3 className={styles.workCardTitle}>{item.title}</h3>
                <p className={styles.workCardMeta}>{item.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
