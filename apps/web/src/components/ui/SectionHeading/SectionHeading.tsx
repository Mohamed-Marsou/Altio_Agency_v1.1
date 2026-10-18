import styles from "./SectionHeading.module.scss";

type SectionHeadingProps = {
  /** Small uppercase label above the title ("The problem"). */
  eyebrow: string;
  /** The section title (rendered as an <h2>). */
  title: string;
  /** Optional sentence under the title. */
  subtitle?: string;
};

// The same intro block opens most sections: eyebrow, big title, short sentence.
// Using one component keeps every section heading identical.
export default function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <div className={styles.sectionHeading}>
      <p className={styles.sectionHeadingEyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionHeadingTitle}>{title}</h2>
      {subtitle && <p className={styles.sectionHeadingSubtitle}>{subtitle}</p>}
    </div>
  );
}
