import { getProcess } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./Process.module.scss";

// Section 5 of the Home page: "How it works". Four numbered steps in an
// ordered list. Server component (no JavaScript).
export default function Process() {
  const process = getProcess();

  return (
    <section className={styles.processSection}>
      <div className={styles.processContent}>
        <SectionHeading
          eyebrow={process.eyebrow}
          title={process.title}
          subtitle={process.subtitle}
        />

        <ol className={styles.processList}>
          {process.steps.map((step) => (
            <li key={step.number} className={styles.processStep}>
              {/* The blue line above each step: on hover it turns green */}
              <span className={styles.processStepLine} aria-hidden="true" />
              <span className={styles.processStepNumber}>{step.number}</span>
              <h3 className={styles.processStepTitle}>{step.title}</h3>
              <p className={styles.processStepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
