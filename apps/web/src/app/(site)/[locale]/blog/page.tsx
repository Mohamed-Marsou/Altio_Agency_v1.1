import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import BlogBrowser from "@/components/sections/BlogPage/BlogBrowser";
import BlogHero from "@/components/sections/BlogPage/BlogHero";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getBlogPage, getPosts, getWhatsAppUrl } from "@/lib/content";
import styles from "./blog.module.scss";

export const metadata: Metadata = {
  title: "Blog | Altio",
  description:
    "Practical articles on websites, search and selling online, written for business owners in Morocco.",
};

// The Blog page: header, then the filterable list of articles (featured first),
// then the closing call to action. The Footer comes from the layout.
export default function BlogPage() {
  const content = getBlogPage();
  const posts = getPosts();

  return (
    <>
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
