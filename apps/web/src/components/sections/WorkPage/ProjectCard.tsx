import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Project, WorkPageContent } from "@/lib/content";
import ProjectArt from "./ProjectArt";
import styles from "./ProjectCard.module.scss";

type ProjectCardProps = {
  project: Project;
  labels: WorkPageContent["labels"];
};

// One project in the grid. The whole card is a link to its case study.
// data-vibe gives it the project's own colour. On hover the card lifts and a
// coloured outline draws itself around the picture (same idea as the Home
// "Selected work" cards). Server component (also used inside the client filter).
export default function ProjectCard({ project, labels }: ProjectCardProps) {
  const isLive = project.status === "live";

  return (
    <article className={styles.projectCard} data-vibe={project.vibe}>
      <Link href={`/work/${project.slug}/`} className={styles.projectCardLink}>
        <span className={styles.projectCardPicture}>
          <ProjectArt
            kind={project.art}
            url={project.url}
            isLive={isLive}
            liveLabel={labels.live}
            privateLabel={labels.privateBuild}
            privatePreviewLabel={labels.privatePreview}
          />
          <svg className={styles.projectCardOutline} aria-hidden="true">
            <rect className={styles.projectCardOutlinePath} pathLength={1} />
          </svg>
        </span>

        <span className={styles.projectCardMeta}>
          <span className={styles.projectCardTag}>{project.tag}</span>
          {isLive ? (
            <span className={styles.projectCardUrl}>
              {project.url}
              <ExternalLink size={13} aria-hidden="true" />
            </span>
          ) : (
            <span className={styles.projectCardUrlIsPrivate}>{labels.privateNoLink}</span>
          )}
        </span>

        <h3 className={styles.projectCardTitle}>{project.title}</h3>
        <p className={styles.projectCardText}>{project.teaser}</p>

        <span className={styles.projectCardFooter}>
          <span className={styles.projectCardResult}>{project.result}</span>
          <span className={styles.projectCardMore}>{labels.viewCase}</span>
        </span>
      </Link>
    </article>
  );
}
