import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import BlogBrowser from "@/components/sections/BlogPage/BlogBrowser";
import BlogHero from "@/components/sections/BlogPage/BlogHero";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getBlogPage, getPosts, getWhatsAppUrl } from "@/lib/content";
import styles from "./blog.module.scss";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/blog/", "blog");
}

// The Blog page: header, then the filterable list of articles (featured first),
// then the closing call to action. The Footer comes from the layout.
export default async function BlogPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const content = getBlogPage();
  const posts = getPosts();

  return (
    <>
      <PageSchema locale={locale as Locale} path="/blog/" pageKey="blog" />
      <Navbar currentPath="/blog/" />
      <main>
        <BlogHero />
        <Reveal>
          <section className={styles.blogPageSection}>
            <div className={styles.blogPageContent}>
              <BlogBrowser
                posts={posts}
                content={content}
                helpHref={getWhatsAppUrl(content.help.message)}
              />
            </div>
          </section>
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
