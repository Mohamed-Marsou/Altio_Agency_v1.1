import { describe, expect, it } from "vitest";
import { dirOf, isLocale, localeFromPath, localePath, stripLocale } from "./i18n";

describe("i18n helpers", () => {
  it("knows the three languages", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("writes Arabic right to left and the others left to right", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("fr")).toBe("ltr");
    expect(dirOf("en")).toBe("ltr");
  });

  it("puts the language in front of internal links", () => {
    expect(localePath("fr", "/services/")).toBe("/fr/services/");
    expect(localePath("ar", "/")).toBe("/ar/");
    expect(localePath("fr", "/services/#launch")).toBe("/fr/services/#launch");
  });

  it("leaves other links alone", () => {
    expect(localePath("fr", "https://wa.me/123")).toBe("https://wa.me/123");
    expect(localePath("fr", "mailto:a@b.ma")).toBe("mailto:a@b.ma");
    expect(localePath("fr", "#top")).toBe("#top");
    expect(localePath("fr", "//cdn.example/x")).toBe("//cdn.example/x");
    expect(localePath("fr", "/en/about/")).toBe("/en/about/");
  });

  it("removes the language from a path", () => {
    expect(stripLocale("/fr/blog/")).toBe("/blog/");
    expect(stripLocale("/ar/")).toBe("/");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/blog/")).toBe("/blog/");
  });

  it("reads the language from a path", () => {
    expect(localeFromPath("/ar/work/")).toBe("ar");
    expect(localeFromPath("/work/")).toBeUndefined();
  });
});
