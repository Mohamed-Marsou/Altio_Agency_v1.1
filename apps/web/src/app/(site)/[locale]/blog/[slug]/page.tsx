import type { Metadata } from "next";
import Link from "@/components/ui/LocaleLink/LocaleLink";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar/Navbar";
import BlogCard from "@/components/sections/BlogPage/BlogCard";
import BlogCover from "@/components/sections/BlogPage/BlogCover";
import PostArticle from "@/components/sections/BlogPage/PostArticle";
import PostProgress from "@/components/sections/BlogPage/PostProgress";
import PostShare from "@/components/sections/BlogPage/PostShare";
import PostToc from "@/components/sections/BlogPage/PostToc";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import Logo from "@/components/ui/Logo/Logo";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import Reveal from "@/components/ui/Reveal/Reveal";
import JsonLd from "@/components/system/JsonLd";
import { getBlogPage, getPost, getPosts, getWhatsAppUrl } from "@/lib/content";
import { LOCALES, type Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import styles from "./post.module.scss";

type PostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// Static export: one HTML page per article, built ahead of time.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => getPosts(locale).map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const post = getPost(slug, locale);
  if (!post) return {};
  return buildMetadata({
    locale,
    path: `/blog/${slug}/`,
    title: post.title,
    description: post.excerpt,
    type: "article",
    publishedTime: post.date,
  });
}

// A single article: coloured header (the topic's colour), cover, then the text
// in a reading column with a sticky table of contents on the left and a share
// rail on the right, an end call to action and related articles.
export default async function PostPage({ params }: PostPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) notFound();

  const content = getBlogPage();
  const text = content.post;
  const category = content.categories[post.category as keyof typeof content.categories];
  const toc = post.body
    .filter((block) => block.type === "h2" && block.id)
    .map((block) => ({ id: block.id as string, text: block.text as string }));
  // Two other articles of the same topic first, then the newest ones.
  const related = getPosts()
    .filter((item) => item.slug !== slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);

  const shareLabels = {
    title: post.title,
    copyLabel: text.copyLink,
    copiedLabel: text.copied,
    whatsappLabel: text.shareWhatsapp,
  };

  return (
    <div data-vibe={post.category}>
      <JsonLd
        data={[
          articleJsonLd(locale, post),
          breadcrumbJsonLd(locale, [
            { name: text.breadcrumbRoot, path: "/blog/" },
            { name: post.title, path: `/blog/${post.slug}/` },
          ]),
        ]}
      />
      <PostProgress targetId="post-article" label={text.progressLabel} />
      <Navbar currentPath="/blog/" />
      <main>
        <header className={styles.postHeader}>
          <div className={styles.postHeaderContent}>
            <p className={styles.postHeaderCrumb}>
              <Link href="/blog/">{text.breadcrumbRoot}</Link>
              <span aria-hidden="true">/</span>
              <span className={styles.postHeaderTag}>{category}</span>
            </p>
            <h1 className={styles.postHeaderTitle}>{post.title}</h1>
            <p className={styles.postHeaderLead}>{post.excerpt}</p>
            <div className={styles.postHeaderAuthor}>
              <span className={styles.postHeaderAvatar}>
                <Logo label={`ALTIO, ${text.author}`} size={18} />
              </span>
              <p>
                <b>{text.author}</b>
                <span>{formatDate(post.date, locale)}</span>
                <span>
                  {post.readTime} {content.minRead}
                </span>
              </p>
            </div>
          </div>
        </header>

        <div className={styles.postCover}>
          <BlogCover kind={post.category} isWide image={post.coverImage} />
        </div>

        <div className={styles.postBody}>
          <aside className={styles.postBodyToc}>
            {toc.length > 1 && <PostToc title={text.toc} items={toc} />}
          </aside>

          <article id="post-article" className={styles.postBodyArticle}>
            <PostArticle post={post} />

            {/* Phones: the share buttons sit under the text instead of on the side */}
            <div className={styles.postBodyShareRow}>
              <span>{text.share}</span>
              <PostShare {...shareLabels} layout="row" />
            </div>
          </article>

          <aside className={styles.postBodyShareRail}>
            <PostShare {...shareLabels} layout="rail" />
          </aside>
        </div>

        <div className={styles.postEnd}>
          <div className={styles.postEndCard}>
            <div>
              <h2>{text.endCta.title}</h2>
              <p>{text.endCta.text}</p>
            </div>
            <MorphButton
              href={getWhatsAppUrl(text.endCta.message)}
              label={text.endCta.cta}
              hoverLabel="Send us a message"
              variant="light"
              size="large"
            />
          </div>
        </div>

        <Reveal>
          <section className={styles.postRelated}>
            <div className={styles.postRelatedContent}>
              <h2>{text.related}</h2>
              <ul className={styles.postRelatedGrid}>
                {related.map((item) => (
                  <li key={item.slug}>
                    <BlogCard post={item} content={content} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </div>
  );
}
