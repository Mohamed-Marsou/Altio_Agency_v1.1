import { describe, expect, it } from "vitest";
import { getFooter, getHero, getPost, getPosts, getProjects, getSeo, getSite, getWhatsAppUrl } from "./content";

describe("content loaders", () => {
  it("read the language they are asked for", () => {
    expect(getHero("en").badge).toMatch(/Free design/);
    expect(getHero("fr").badge).toMatch(/Design gratuit/);
    expect(getHero("ar").badge).toMatch(/[؀-ۿ]/);
  });

  it("fill {{email}} and {{phone}} from the one shared file", () => {
    const site = getSite();
    for (const locale of ["en", "fr", "ar"] as const) {
      const footer = getFooter(locale);
      expect(footer.contact.email).toBe(site.email);
      expect(footer.contact.whatsapp).toContain(site.phoneDisplay);
      expect(JSON.stringify(footer)).not.toContain("{{");
    }
  });

  it("builds a WhatsApp link with the shared number and an encoded message", () => {
    const url = getWhatsAppUrl("Hello Sara & friends");
    expect(url).toBe(`https://wa.me/${getSite().whatsappNumber}?text=Hello%20Sara%20%26%20friends`);
  });

  it("returns posts newest first and finds one by address", () => {
    const posts = getPosts("fr");
    expect(posts.length).toBeGreaterThan(3);
    expect(posts.map((p) => p.date)).toEqual([...posts.map((p) => p.date)].sort().reverse());
    expect(getPost(posts[0]!.slug, "fr")?.title).toBe(posts[0]!.title);
    expect(getPost("does-not-exist", "en")).toBeUndefined();
  });

  it("gives every language the same posts and projects", () => {
    expect(getPosts("ar").map((p) => p.slug).sort()).toEqual(getPosts("en").map((p) => p.slug).sort());
    expect(getProjects("fr").map((p) => p.slug)).toEqual(getProjects("en").map((p) => p.slug));
  });

  it("has search texts for every page in every language", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const pages = getSeo(locale).pages;
      for (const key of Object.keys(pages) as (keyof typeof pages)[]) {
        expect(pages[key].title.length, `${locale}.${key}.title`).toBeGreaterThan(8);
        expect(pages[key].description.length, `${locale}.${key}.description`).toBeGreaterThan(50);
      }
    }
  });
});
