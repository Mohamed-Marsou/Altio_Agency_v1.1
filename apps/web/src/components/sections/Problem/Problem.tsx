import { getProblem } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./Problem.module.scss";

// Section 2 of the Home page: names the visitor's pain in three short points.
// A plain ordered list (<ol>) because the points have a number. Server component.
export default function Problem() {
  const problem = getProblem();

  return (
    <section className={styles.problemSection}>
      <div className={styles.problemContent}>
        {/* Left column on desktop / first block on phones */}
        <div className={styles.problemIntro}>
          <SectionHeading
            eyebrow={problem.eyebrow}
            title={problem.title}
            subtitle={problem.subtitle}
          />
          {/* Small decorative accent line under the intro */}
          <span className={styles.problemAccentLine} aria-hidden="true" />
        </div>

        {/* Right column on desktop / below the intro on phones */}
        <ol className={styles.problemList}>
          {problem.items.map((item) => (
            <li key={item.number} className={styles.problemItem}>
              <span className={styles.problemItemNumber}>{item.number}</span>
              <div className={styles.problemItemBody}>
                <h3 className={styles.problemItemTitle}>{item.title}</h3>
                <p className={styles.problemItemText}>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
