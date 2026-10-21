import Link from "@/components/ui/LocaleLink/LocaleLink";
import type { Project, WorkPageContent } from "@/lib/content";
import ProjectArt from "./ProjectArt";
import styles from "./CaseNext.module.scss";

type CaseNextProps = {
  project: Project;
  content: WorkPageContent;
};

// "Next project": a banner in the NEXT project's own colour, so moving from one
// case study to the next shows how each one has its own mood.
export default function CaseNext({ project, content }: CaseNextProps) {
  const { labels } = content;

  return (
    <section className={styles.caseNextSection}>
      <div className={styles.caseNextContent}>
        <div className={styles.caseNextCard} data-vibe={project.vibe}>
          <div className={styles.caseNextText}>
            <p className={styles.caseNextKicker}>{content.case.nextKicker}</p>
            <h2 className={styles.caseNextTitle}>{project.title}</h2>
            <p className={styles.caseNextLead}>{project.teaser}</p>
            <Link href={`/work/${project.slug}/`} className={styles.caseNextButton}>
              {labels.readCase}
            </Link>
          </div>

          <ProjectArt
            kind={project.art}
            image={project.coverImage}
            url={project.url}
            isLive={project.status === "live"}
            liveLabel={labels.live}
            privateLabel={labels.privateBuild}
            privatePreviewLabel={labels.privatePreview}
          />
        </div>
      </div>
    </section>
  );
}
