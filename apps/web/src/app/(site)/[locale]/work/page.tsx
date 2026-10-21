import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import ProjectsBrowser from "@/components/sections/WorkPage/ProjectsBrowser";
import WorkHero from "@/components/sections/WorkPage/WorkHero";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getProjects, getWhatsAppUrl, getWorkPage } from "@/lib/content";
import styles from "./work.module.scss";

export const metadata: Metadata = {
  title: "Work | Altio",
  description:
    "Real projects built by Altio: websites, online stores, web apps and managed care for businesses in Morocco, each with its own story.",
};

// The Work page: header, then the filterable list of projects (featured project
// first), then the closing call to action. The Footer comes from the layout.
export default function WorkPage() {
  const content = getWorkPage();
  const projects = getProjects();

  return (
    <>
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
