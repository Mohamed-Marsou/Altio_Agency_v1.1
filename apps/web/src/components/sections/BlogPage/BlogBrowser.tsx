"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button/Button";
import { formatDate } from "@/lib/format";
import type { BlogPageContent, Post } from "@/lib/content";
import BlogCard from "./BlogCard";
import BlogCover from "./BlogCover";
import styles from "./BlogBrowser.module.scss";

type BlogBrowserProps = {
  posts: Post[];
  content: BlogPageContent;
  helpHref: string;
};

// Topic chips, the featured article and the grid. Client component because the
// chips change what is shown. Each chip carries the topic's colour dot and the
// number of articles. Before JavaScript runs everything is visible.
export default function BlogBrowser({ posts, content, helpHref }: BlogBrowserProps) {
  const [topic, setTopic] = useState<string>("all");
  const categories = Object.entries(content.categories);

  const visible = useMemo(
    () => posts.filter((post) => topic === "all" || post.category === topic),
    [posts, topic],
  );
  const featured = visible.find((post) => post.featured);
  const others = visible.filter((post) => post !== featured);

  return (
    <>
      <div className={styles.blogBrowserTopics} role="group" aria-label={content.filterLabel}>
        <button
          type="button"
          className={clsx(styles.blogBrowserTopic, topic === "all" && styles.blogBrowserTopicIsOn)}
          aria-pressed={topic === "all"}
          onClick={() => setTopic("all")}
        >
          {content.all} <span>{posts.length}</span>
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-vibe={key}
            className={clsx(styles.blogBrowserTopic, topic === key && styles.blogBrowserTopicIsOn)}
            aria-pressed={topic === key}
            onClick={() => setTopic(key)}
          >
            <i aria-hidden="true" />
            {label} <span>{posts.filter((post) => post.category === key).length}</span>
          </button>
        ))}
      </div>

      {featured && (
        <article className={styles.blogBrowserFeatured} data-vibe={featured.category}>
          <div className={styles.blogBrowserFeaturedText}>
            <p className={styles.blogBrowserFeaturedMeta}>
              <span className={styles.blogBrowserTag}>
                {content.featuredTag} ·{" "}
                {content.categories[featured.category as keyof typeof content.categories]}
              </span>
              <span>{formatDate(featured.date)}</span>
              <span>
                {featured.readTime} {content.minRead}
              </span>
            </p>
            <h2 className={styles.blogBrowserFeaturedTitle}>{featured.title}</h2>
            <p className={styles.blogBrowserFeaturedLead}>{featured.featuredExcerpt || featured.excerpt}</p>
            <Link href={`/blog/${featured.slug}/`} className={styles.blogBrowserFeaturedLink}>
              {content.readMore}
            </Link>
          </div>
          <BlogCover kind={featured.category} />
        </article>
      )}

      <h2 className={styles.blogBrowserHeading}>{content.latest}</h2>

      {others.length === 0 ? (
        <p className={styles.blogBrowserEmpty}>{content.noResults}</p>
      ) : (
        <ul className={styles.blogBrowserGrid}>
          {others.map((post) => (
            <li key={post.slug}>
              <BlogCard post={post} content={content} />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.blogBrowserHelp}>
        <h3>{content.help.title}</h3>
        <Button href={helpHref} variant="secondary">
          {content.help.cta}
        </Button>
      </div>
    </>
  );
}
