import { describe, expect, it } from "vitest";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata, faqJsonLd, localBusinessJsonLd, organizationJsonLd, pageMetadata, pagePath, siteUrl } from "./seo";

describe("page addresses", () => {
  it("puts the language in front", () => {
    expect(pagePath("fr", "/about/")).toBe("/fr/about/");
    expect(pagePath("ar", "/")).toBe("/ar/");
  });
});

describe("page metadata", () => {
  it("has a title with the brand, a description and the same page in every language", () => {
    const meta = pageMetadata("fr", "/services/", "services");
    expect(String(meta.title)).toMatch(/\| Altio$/);
    expect(String(meta.description).length).toBeGreaterThan(50);
    expect(meta.alternates?.canonical).toBe("/fr/services/");
    expect(meta.alternates?.languages).toEqual({
      en: "/en/services/",
      fr: "/fr/services/",
      ar: "/ar/services/",
      "x-default": "/",
    });
  });

  it("uses the share image of the language and the right Open Graph language", () => {
    const meta = pageMetadata("ar", "/", "home");
    expect(meta.openGraph).toMatchObject({ locale: "ar_MA", images: [expect.objectContaining({ url: "/og/ar.png", width: 1200, height: 630 })] });
  });

  it("marks an article and can hide a page from search engines", () => {
    const article = buildMetadata({ locale: "en", path: "/blog/x/", title: "T", description: "D".repeat(60), type: "article", publishedTime: "2026-03-12" });
    expect(article.openGraph).toMatchObject({ type: "article", publishedTime: "2026-03-12" });
    expect(pageMetadata("en", "/x/", "notFound").robots).toMatchObject({ index: false });
  });
});

describe("structured data", () => {
  it("describes the business with the shared phone, email and city", () => {
    const business = localBusinessJsonLd("en");
    expect(business["@type"]).toContain("LocalBusiness");
    expect(business.telephone).toMatch(/^\+\d+$/);
    expect(business.address).toMatchObject({ addressCountry: "MA" });
    expect(organizationJsonLd("fr").inLanguage).toBe("fr");
  });

  it("builds breadcrumbs, articles and questions", () => {
    const crumbs = breadcrumbJsonLd("en", [{ name: "Home", path: "/" }, { name: "Blog", path: "/blog/" }]);
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[1]!.item).toBe(`${siteUrl}/en/blog/`);

    const article = articleJsonLd("en", { slug: "a", title: "A", excerpt: "E", date: "2026-01-01" });
    expect(article.mainEntityOfPage).toBe(`${siteUrl}/en/blog/a/`);

    const faq = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(faq.mainEntity[0]).toMatchObject({ "@type": "Question", name: "Q?" });
  });
});
