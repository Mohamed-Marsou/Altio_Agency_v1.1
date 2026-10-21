import type { Metadata } from "next";
import PageSchema from "@/components/system/PageSchema";
import type { Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { pageMetadata } from "@/lib/seo";
import type { LocaleParams } from "@/lib/types";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import ProjectsBrowser from "@/components/sections/WorkPage/ProjectsBrowser";
import WorkHero from "@/components/sections/WorkPage/WorkHero";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getProjects, getWhatsAppUrl, getWorkPage } from "@/lib/content";
import styles from "./work.module.scss";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "/work/", "work");
}

// The Work page: header, then the filterable list of projects (featured project
// first), then the closing call to action. The Footer comes from the layout.
export default async function WorkPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const content = getWorkPage();
  const projects = getProjects();

  return (
    <>
      <PageSchema locale={locale as Locale} path="/work/" pageKey="work" />
      <Navbar currentPath="/work/" />
      <main>
        <WorkHero />
        <Reveal>
          <section className={styles.workPageSection}>
            <div className={styles.workPageContent}>
              <ProjectsBrowser
                projects={projects}
                content={content}
                nextHref={getWhatsAppUrl(content.next.message)}
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
