import type { CSSProperties } from "react";
import { getContact } from "@/lib/content";
import InView from "@/components/ui/InView/InView";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./ContactSteps.module.scss";

// "What happens next": three steps that light up one after the other when
// they scroll into view (<InView>). Server component.
export default function ContactSteps() {
  const { next } = getContact();

  return (
    <section className={styles.contactSteps}>
      <div className={styles.contactStepsContent}>
        <SectionHeading eyebrow={next.eyebrow} title={next.title} />

        <InView>
          <ol className={styles.contactStepsList}>
            {next.steps.map((step, index) => (
              <li
                key={step.title}
                className={styles.contactStep}
                style={{ "--step": index } as CSSProperties}
              >
                <span className={styles.contactStepDot}>{index + 1}</span>
                <small>{step.when}</small>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </InView>
      </div>
    </section>
  );
}
