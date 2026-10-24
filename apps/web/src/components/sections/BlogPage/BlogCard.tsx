"use client";

import Link from "@/components/ui/LocaleLink/LocaleLink";
import { formatDate } from "@/lib/format";
import { useLocale } from "@/lib/use-locale";
import type { BlogPageContent, Post } from "@/lib/content";
import BlogCover from "./BlogCover";
import styles from "./BlogCard.module.scss";

type BlogCardProps = {
  post: Post;
  content: BlogPageContent;
};

// One article in the grid. The whole card is a link. On hover the card lifts,
// the cover's circle and card drift a little and the title takes the topic's
// colour. A client component (it reads the page language for the date).
export default function BlogCard({ post, content }: BlogCardProps) {
  const locale = useLocale();
  const category = content.categories[post.category as keyof typeof content.categories];

  return (
    <article className={styles.blogCard} data-vibe={post.category}>
      <Link href={`/blog/${post.slug}/`} className={styles.blogCardLink}>
        <BlogCover kind={post.category} image={post.coverImage} />

        <span className={styles.blogCardMeta}>
          <span className={styles.blogCardTag}>{category}</span>
          <span>{formatDate(post.date, locale)}</span>
          <span>
            {post.readTime} {content.minRead}
          </span>
        </span>

        <h3 className={styles.blogCardTitle}>{post.title}</h3>
        <p className={styles.blogCardText}>{post.excerpt}</p>
      </Link>
    </article>
  );
}
