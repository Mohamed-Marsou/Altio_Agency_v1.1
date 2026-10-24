import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import Link from "@/components/ui/LocaleLink/LocaleLink";
import type { Project, WorkPageContent } from "@/lib/content";
import ProjectArt from "./ProjectArt";
import styles from "./CaseHero.module.scss";

type CaseHeroProps = {
  project: Project;
  content: WorkPageContent;
};

// The top of a project page: breadcrumb, headline in the project's colour,
// the live link (or a "Private project" note when it is not hosted publicly)
// and the facts card that overlaps the hero. data-vibe tints everything inside.
export default function CaseHero({ project, content }: CaseHeroProps) {
  const { case: study } = project;
  const isLive = project.status === "live";
  const { labels } = content;
  const factLabels = content.case.factLabels;

  return (
    <div data-vibe={project.vibe}>
      <header className={styles.caseHero}>
        <div className={styles.caseHeroContent}>
          <div className={styles.caseHeroText}>
            <p className={styles.caseHeroCrumb}>
              <Link href="/work/">{content.case.breadcrumbRoot}</Link>
              <span aria-hidden="true">/</span>
              <span>{project.title}</span>
            </p>

            <h1 className={styles.caseHeroTitle}>
              {study.heroTitle} <span className={styles.caseHeroAccent}>{study.heroAccent}</span>
            </h1>
            <p className={styles.caseHeroLead}>{study.heroLead}</p>

            <div className={styles.caseHeroActions}>
              {isLive ? (
                <a
                  className={styles.caseHeroButton}
                  href={`https://${project.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {labels.visit} {project.url}
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : (
                <span className={styles.caseHeroPrivate}>{labels.privateNoLink}</span>
              )}
              <span className={clsx(styles.caseHeroStatus, !isLive && styles.caseHeroStatusIsPrivate)}>
                <i />
                {study.liveSince}
              </span>
            </div>
          </div>

          <ProjectArt
            kind={project.art}
            image={project.coverImage}
            url={project.url}
            isLive={isLive}
            liveLabel={labels.live}
            privateLabel={labels.privateBuild}
            privatePreviewLabel={labels.privatePreview}
            isLarge
          />
        </div>
      </header>

      <div className={styles.caseFactsWrap}>
        <dl className={styles.caseFacts}>
          {(Object.keys(factLabels) as (keyof typeof factLabels)[]).map((key) => (
            <div key={key}>
              <dt>{factLabels[key]}</dt>
              <dd>{study.facts[key]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
