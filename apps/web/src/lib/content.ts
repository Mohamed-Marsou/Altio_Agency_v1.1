// =============================================================================
// CONTENT LOADER
// -----------------------------------------------------------------------------
// Components never import JSON files directly. They call these functions.
// Today the data comes from JSON files in src/content/en; later (French, then
// the backend API) only THIS file changes, and every component keeps working.
// =============================================================================
import audiences from "@/content/en/audiences.json";
import cta from "@/content/en/cta.json";
import faq from "@/content/en/faq.json";
import footer from "@/content/en/footer.json";
import hero from "@/content/en/hero.json";
import nav from "@/content/en/nav.json";
import packs from "@/content/en/packs.json";
import problem from "@/content/en/problem.json";
import process from "@/content/en/process.json";
import proof from "@/content/en/proof.json";
import services from "@/content/en/services.json";
import site from "@/content/en/site.json";
import why from "@/content/en/why.json";
import work from "@/content/en/work.json";

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
export type ProcessContent = typeof process;
export type WorkContent = typeof work;
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

export function getProcess(): ProcessContent {
  return process;
}

export function getWork(): WorkContent {
  return work;
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
