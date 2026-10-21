import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import CaseChapters from "@/components/sections/WorkPage/CaseChapters";
import CaseHero from "@/components/sections/WorkPage/CaseHero";
import CaseNext from "@/components/sections/WorkPage/CaseNext";
import Reveal from "@/components/ui/Reveal/Reveal";
import JsonLd from "@/components/system/JsonLd";
import { getProject, getProjects, getWorkPage } from "@/lib/content";
import { LOCALES, type Locale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { breadcrumbJsonLd, buildMetadata, caseStudyJsonLd } from "@/lib/seo";

type ProjectPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// Static export: one HTML page is generated per project at build time, and any
// other address is a 404 (dynamicParams = false).
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => getProjects(locale).map((project) => ({ locale, slug: project.slug })));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const project = getProject(slug, locale);
  if (!project) return {};

  return buildMetadata({ locale, path: `/work/${slug}/`, title: project.title, description: project.teaser });
}

// A project page = a case study: hero, then the story told chapter by chapter,
// then the next project and the call to action. Each project gets its own
// colour through data-vibe, so every page has its own mood.
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const project = getProject(slug);
  if (!project) notFound();

  const content = getWorkPage();
  const projects = getProjects();
  // The next project in the list (wraps around to the first).
  const next = projects[(projects.findIndex((item) => item.slug === slug) + 1) % projects.length];

  return (
    <>
      <JsonLd
        data={[
          caseStudyJsonLd(locale, project),
          breadcrumbJsonLd(locale, [
            { name: content.hero.eyebrow, path: "/work/" },
            { name: project.title, path: `/work/${project.slug}/` },
          ]),
        ]}
      />
      <Navbar currentPath="/work/" />
      <main>
        <CaseHero project={project} content={content} />
        <CaseChapters project={project} content={content} />
        <Reveal>
          <CaseNext project={next} content={content} />
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
