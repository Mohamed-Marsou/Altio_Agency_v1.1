// =============================================================================
// CONTENT LOADER
// -----------------------------------------------------------------------------
// Components never import JSON files directly. They call these functions.
// Today the data comes from JSON files in src/content/en; later (French, then
// the backend API) only THIS file changes, and every component keeps working.
// =============================================================================
import audiences from "@/content/en/audiences.json";
import hero from "@/content/en/hero.json";
import nav from "@/content/en/nav.json";
import problem from "@/content/en/problem.json";
import site from "@/content/en/site.json";

// The TypeScript types are inferred from the JSON shape, so a typo in a
// component (hero.titel) becomes a compile error.
export type NavContent = typeof nav;
export type HeroContent = typeof hero;
export type SiteContent = typeof site;
export type ProblemContent = typeof problem;
export type AudiencesContent = typeof audiences;
export type AudienceOption = AudiencesContent["options"][number];

export function getNav(): NavContent {
  return nav;
}

export function getHero(): HeroContent {
  return hero;
}

export function getAudiences(): AudiencesContent {
  return audiences;
}

export function getProblem(): ProblemContent {
  return problem;
}

export function getSite(): SiteContent {
  return site;
}

// Builds a WhatsApp link that opens a chat with our number and a ready-made
// first message:  getWhatsAppUrl("Hello")  ->  https://wa.me/2126...?text=Hello
export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
