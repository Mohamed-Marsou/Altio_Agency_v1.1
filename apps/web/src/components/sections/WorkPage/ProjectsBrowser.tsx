"use client";

import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import Link from "@/components/ui/LocaleLink/LocaleLink";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button/Button";
import type { Project, WorkPageContent } from "@/lib/content";
import ProjectArt from "./ProjectArt";
import ProjectCard from "./ProjectCard";
import styles from "./ProjectsBrowser.module.scss";

type ProjectsBrowserProps = {
  projects: Project[];
  content: WorkPageContent;
  nextHref: string;
};

type TypeFilter = "all" | "websites" | "stores" | "apps" | "managed";
type StatusFilter = "any" | "live" | "private";

// The filter chips, the featured project and the grid. Client component because
// the chips change what is shown. Two independent filters: type (All, Websites,
// Stores, Apps, Managed) and status (Live, Private builds); clicking the active
// status chip again clears it.
// Before JavaScript runs everything is visible (the filters simply do nothing).
export default function ProjectsBrowser({ projects, content, nextHref }: ProjectsBrowserProps) {
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("any");
  const { filters, labels } = content;

  const typeChips: { key: TypeFilter; label: string }[] = [
    { key: "all", label: filters.all },
    { key: "websites", label: filters.websites },
    { key: "stores", label: filters.stores },
    { key: "apps", label: filters.apps },
    { key: "managed", label: filters.managed },
  ];

  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (type === "all" || project.category === type) && (status === "any" || project.status === status),
      ),
    [projects, type, status],
  );

  const featured = visible.find((project) => project.featured);
  const others = visible.filter((project) => project !== featured);

  return (
    <>
      <div className={styles.projectsBrowserFilters} role="group" aria-label={filters.typeLabel}>
        {typeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={clsx(styles.projectsBrowserChip, type === chip.key && styles.projectsBrowserChipIsOn)}
            aria-pressed={type === chip.key}
            onClick={() => setType(chip.key)}
          >
            {chip.label}
          </button>
        ))}

        <span className={styles.projectsBrowserDivider} aria-hidden="true" />

        {(["live", "private"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={clsx(styles.projectsBrowserChip, status === key && styles.projectsBrowserChipIsOn)}
            aria-pressed={status === key}
            aria-label={`${filters.statusLabel}: ${key === "live" ? filters.live : filters.private}`}
            onClick={() => setStatus(status === key ? "any" : key)}
          >
            {key === "live" ? `● ${filters.live}` : filters.private}
          </button>
        ))}
      </div>

      {featured && (
        <article className={styles.projectsBrowserFeatured} data-vibe={featured.vibe}>
          <div className={styles.projectsBrowserFeaturedText}>
            <span className={styles.projectsBrowserFeaturedTag}>
              {content.featuredTag} · {featured.tag}
            </span>
            <h2 className={styles.projectsBrowserFeaturedTitle}>{featured.featuredTitle}</h2>
            <p className={styles.projectsBrowserFeaturedLead}>{featured.teaser}</p>

            <dl className={styles.projectsBrowserStats}>
              {featured.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.projectsBrowserFeaturedActions}>
              <Link href={`/work/${featured.slug}/`} className={styles.projectsBrowserFeaturedButton}>
                {labels.readCase}
              </Link>
              {featured.status === "live" && (
                <span className={styles.projectsBrowserFeaturedUrl}>
                  {featured.url}
                  <ExternalLink size={13} aria-hidden="true" />
                </span>
              )}
            </div>
          </div>

          <ProjectArt
            kind={featured.art}
            image={featured.coverImage}
            url={featured.url}
            isLive={featured.status === "live"}
            liveLabel={labels.live}
            privateLabel={labels.privateBuild}
            privatePreviewLabel={labels.privatePreview}
            isLarge
          />
        </article>
      )}

      <h2 className={styles.projectsBrowserHeading}>{content.allProjects}</h2>

      {visible.length === 0 ? (
        <p className={styles.projectsBrowserEmpty}>{content.noResults}</p>
      ) : (
        <ul className={styles.projectsBrowserGrid}>
          {others.map((project) => (
            <li key={project.slug}>
              <ProjectCard project={project} labels={labels} />
            </li>
          ))}
          <li className={styles.projectsBrowserNext}>
            <h3>{content.next.title}</h3>
            <p>{content.next.text}</p>
            <Button href={nextHref} variant="secondary">
              {content.next.cta}
            </Button>
          </li>
        </ul>
      )}

      <p className={styles.projectsBrowserNote}>{content.sampleNote}</p>
    </>
  );
}
