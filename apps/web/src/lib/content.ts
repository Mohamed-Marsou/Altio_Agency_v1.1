// =============================================================================
// CONTENT LOADER
// -----------------------------------------------------------------------------
// Components never import JSON files directly. They call these functions.
// Today the data comes from JSON files in src/content/en; later (French, then
// the backend API) only THIS file changes, and every component keeps working.
// =============================================================================
import about from "@/content/en/about.json";
import audiences from "@/content/en/audiences.json";
import contact from "@/content/en/contact.json";
import cta from "@/content/en/cta.json";
import faq from "@/content/en/faq.json";
import footer from "@/content/en/footer.json";
import freeDesign from "@/content/en/free-design.json";
import legal from "@/content/en/legal.json";
import notFound from "@/content/en/not-found.json";
import hero from "@/content/en/hero.json";
import nav from "@/content/en/nav.json";
import packs from "@/content/en/packs.json";
import problem from "@/content/en/problem.json";
import process from "@/content/en/process.json";
import proof from "@/content/en/proof.json";
import referrals from "@/content/en/referrals.json";
import services from "@/content/en/services.json";
import servicesPage from "@/content/en/services-page.json";
import site from "@/content/en/site.json";
import why from "@/content/en/why.json";
import work from "@/content/en/work.json";
import blogPage from "@/content/en/blog-page.json";
import posts from "@/content/en/posts.json";
import projects from "@/content/en/projects.json";
import workPage from "@/content/en/work-page.json";

// The TypeScript types are inferred from the JSON shape, so a typo in a
// component (hero.titel) becomes a compile error.
export type NavContent = typeof nav;
export type HeroContent = typeof hero;
export type SiteContent = typeof site;
export type ProofContent = typeof proof;
export type ProblemContent = typeof problem;
export type AudiencesContent = typeof audiences;
export type AudienceOption = AudiencesContent["options"][number];
export type ServicesContent = typeof services;
export type ServicesPageContent = typeof servicesPage;
export type ServicesPageItem = ServicesPageContent["items"][number];
export type ProcessContent = typeof process;
export type WorkContent = typeof work;
export type AboutContent = typeof about;
export type ContactContent = typeof contact;
// Legal pages are made of small typed blocks. Each page uses only some of the
// fields (a paragraph has `text`, a table has `head` and `rows`, ...), so they
// are all optional; the `type` says which ones to read.
export type LegalBlock = {
  type: string;
  text?: string;
  items?: string[];
  head?: string[];
  rows?: string[][];
  parts?: { value: string; label: string }[];
};
export type LegalDoc = {
  title: string;
  updated: string;
  short: string[];
  sections: { id: string; title: string; blocks: LegalBlock[] }[];
  ask: { title: string; cta: string; message: string };
};
export type LegalContent = { labels: typeof legal.labels; privacy: LegalDoc; terms: LegalDoc };
export type ReferralsContent = typeof referrals;
export type FreeDesignContent = typeof freeDesign;
export type NotFoundContent = typeof notFound;
export type Post = (typeof posts)[number];
export type PostBlock = Post["body"][number];
export type BlogPageContent = typeof blogPage;
export type Project = (typeof projects)[number];
export type WorkPageContent = typeof workPage;
export type PacksContent = typeof packs;
export type WhyContent = typeof why;
export type FaqContent = typeof faq;
export type CtaContent = typeof cta;
export type FooterContent = typeof footer;

export function getNav(): NavContent {
  return nav;
}

export function getHero(): HeroContent {
  return hero;
}

export function getProof(): ProofContent {
  return proof;
}

export function getAudiences(): AudiencesContent {
  return audiences;
}

export function getProblem(): ProblemContent {
  return problem;
}

export function getServices(): ServicesContent {
  return services;
}

export function getServicesPage(): ServicesPageContent {
  return servicesPage;
}

export function getProcess(): ProcessContent {
  return process;
}

export function getWork(): WorkContent {
  return work;
}

export function getProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getWorkPage(): WorkPageContent {
  return workPage;
}

export function getPosts(): Post[] {
  // Newest first.
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getBlogPage(): BlogPageContent {
  return blogPage;
}

export function getAbout(): AboutContent {
  return about;
}

export function getContact(): ContactContent {
  return contact;
}

export function getLegal(): LegalContent {
  return legal as LegalContent;
}

export function getReferrals(): ReferralsContent {
  return referrals;
}

export function getFreeDesign(): FreeDesignContent {
  return freeDesign;
}

export function getNotFound(): NotFoundContent {
  return notFound;
}

export function getPacks(): PacksContent {
  return packs;
}

export function getWhy(): WhyContent {
  return why;
}

export function getFaq(): FaqContent {
  return faq;
}

export function getCta(): CtaContent {
  return cta;
}

export function getFooter(): FooterContent {
  return footer;
}

export function getSite(): SiteContent {
  return site;
}

// Builds a WhatsApp link that opens a chat with our number and a ready-made
// first message:  getWhatsAppUrl("Hello")  ->  https://wa.me/2126...?text=Hello
export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
