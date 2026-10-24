// The list of every content file per language (generated once, edit by hand when adding a file).
// To add a new JSON file: create it in content/en, content/fr and content/ar, then add its three import lines here.

import enAbout from "./en/about.json";
import enAudiences from "./en/audiences.json";
import enBlogPage from "./en/blog-page.json";
import enContact from "./en/contact.json";
import enCta from "./en/cta.json";
import enFaq from "./en/faq.json";
import enFooter from "./en/footer.json";
import enFreeDesign from "./en/free-design.json";
import enHero from "./en/hero.json";
import enLegal from "./en/legal.json";
import enNav from "./en/nav.json";
import enNotFound from "./en/not-found.json";
import enPacks from "./en/packs.json";
import enPosts from "./en/posts.json";
import enProblem from "./en/problem.json";
import enProcess from "./en/process.json";
import enProjects from "./en/projects.json";
import enProof from "./en/proof.json";
import enReferrals from "./en/referrals.json";
import enServices from "./en/services.json";
import enServicesPage from "./en/services-page.json";
import enWhy from "./en/why.json";
import enWork from "./en/work.json";
import enWorkPage from "./en/work-page.json";
import enSeo from "./en/seo.json";
import frAbout from "./fr/about.json";
import frAudiences from "./fr/audiences.json";
import frBlogPage from "./fr/blog-page.json";
import frContact from "./fr/contact.json";
import frCta from "./fr/cta.json";
import frFaq from "./fr/faq.json";
import frFooter from "./fr/footer.json";
import frFreeDesign from "./fr/free-design.json";
import frHero from "./fr/hero.json";
import frLegal from "./fr/legal.json";
import frNav from "./fr/nav.json";
import frNotFound from "./fr/not-found.json";
import frPacks from "./fr/packs.json";
import frPosts from "./fr/posts.json";
import frProblem from "./fr/problem.json";
import frProcess from "./fr/process.json";
import frProjects from "./fr/projects.json";
import frProof from "./fr/proof.json";
import frReferrals from "./fr/referrals.json";
import frServices from "./fr/services.json";
import frServicesPage from "./fr/services-page.json";
import frWhy from "./fr/why.json";
import frWork from "./fr/work.json";
import frWorkPage from "./fr/work-page.json";
import frSeo from "./fr/seo.json";
import arAbout from "./ar/about.json";
import arAudiences from "./ar/audiences.json";
import arBlogPage from "./ar/blog-page.json";
import arContact from "./ar/contact.json";
import arCta from "./ar/cta.json";
import arFaq from "./ar/faq.json";
import arFooter from "./ar/footer.json";
import arFreeDesign from "./ar/free-design.json";
import arHero from "./ar/hero.json";
import arLegal from "./ar/legal.json";
import arNav from "./ar/nav.json";
import arNotFound from "./ar/not-found.json";
import arPacks from "./ar/packs.json";
import arPosts from "./ar/posts.json";
import arProblem from "./ar/problem.json";
import arProcess from "./ar/process.json";
import arProjects from "./ar/projects.json";
import arProof from "./ar/proof.json";
import arReferrals from "./ar/referrals.json";
import arServices from "./ar/services.json";
import arServicesPage from "./ar/services-page.json";
import arWhy from "./ar/why.json";
import arWork from "./ar/work.json";
import arWorkPage from "./ar/work-page.json";
import arSeo from "./ar/seo.json";

const en = {
  about: enAbout,
  audiences: enAudiences,
  blogPage: enBlogPage,
  contact: enContact,
  cta: enCta,
  faq: enFaq,
  footer: enFooter,
  freeDesign: enFreeDesign,
  hero: enHero,
  legal: enLegal,
  nav: enNav,
  notFound: enNotFound,
  packs: enPacks,
  posts: enPosts,
  problem: enProblem,
  process: enProcess,
  projects: enProjects,
  proof: enProof,
  referrals: enReferrals,
  services: enServices,
  servicesPage: enServicesPage,
  why: enWhy,
  work: enWork,
  workPage: enWorkPage,
  seo: enSeo,
};
const fr = {
  about: frAbout,
  audiences: frAudiences,
  blogPage: frBlogPage,
  contact: frContact,
  cta: frCta,
  faq: frFaq,
  footer: frFooter,
  freeDesign: frFreeDesign,
  hero: frHero,
  legal: frLegal,
  nav: frNav,
  notFound: frNotFound,
  packs: frPacks,
  posts: frPosts,
  problem: frProblem,
  process: frProcess,
  projects: frProjects,
  proof: frProof,
  referrals: frReferrals,
  services: frServices,
  servicesPage: frServicesPage,
  why: frWhy,
  work: frWork,
  workPage: frWorkPage,
  seo: frSeo,
};
const ar = {
  about: arAbout,
  audiences: arAudiences,
  blogPage: arBlogPage,
  contact: arContact,
  cta: arCta,
  faq: arFaq,
  footer: arFooter,
  freeDesign: arFreeDesign,
  hero: arHero,
  legal: arLegal,
  nav: arNav,
  notFound: arNotFound,
  packs: arPacks,
  posts: arPosts,
  problem: arProblem,
  process: arProcess,
  projects: arProjects,
  proof: arProof,
  referrals: arReferrals,
  services: arServices,
  servicesPage: arServicesPage,
  why: arWhy,
  work: arWork,
  workPage: arWorkPage,
  seo: arSeo,
};

export type Locale = "en" | "fr" | "ar";
export type Dictionary = typeof en;
export const dictionaries: Record<Locale, Dictionary> = { en, fr, ar };
