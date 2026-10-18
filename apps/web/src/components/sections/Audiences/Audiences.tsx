import { getAudiences } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import AudienceCompare from "./AudienceCompare";
import styles from "./Audiences.module.scss";

// Section 3 of the Home page: "Who we work with". It is the shell (background,
// spacing, heading); the interactive part lives in AudienceCompare, which is
// the only part that needs JavaScript.
export default function Audiences() {
  const audiences = getAudiences();

  return (
    <section className={styles.audiencesSection}>
      <div className={styles.audiencesContent}>
        <SectionHeading
          eyebrow={audiences.eyebrow}
          title={audiences.title}
          subtitle={audiences.subtitle}
        />
        <AudienceCompare data={audiences} />
      </div>
    </section>
  );
}
