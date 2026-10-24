import { expect, test, type Page } from "@playwright/test";
import { canScrollSideways, open } from "../helpers";

// The language button exists twice (desktop bar and phone menu). On a phone the menu is opened first.
async function chooseLanguage(page: Page, label: string) {
  const menu = page.getByRole("button", { name: /Open menu|Ouvrir le menu|فتح القائمة/ });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole("button", { name: label }).click();
  } else {
    await page.getByRole("button", { name: /Choose language|Choisir la langue|اختيار اللغة/ }).click();
    await page.getByRole("option", { name: label }).click();
  }
}

test("switching language keeps the same page", async ({ page }) => {
  await open(page, "/en/services/");
  await chooseLanguage(page, "Français");
  await expect(page).toHaveURL(/\/fr\/services\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Quatre services");
});

test("Arabic is right to left and uses its own font only there", async ({ page }) => {
  await open(page, "/ar/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const arabicFont = await page.evaluate(() => [...document.fonts].some((f) => /IBM Plex Sans Arabic/i.test(f.family) && f.status === "loaded"));
  expect(arabicFont).toBe(true);

  await open(page, "/en/");
  const onEnglish = await page.evaluate(() => [...document.fonts].some((f) => /IBM Plex Sans Arabic/i.test(f.family) && f.status === "loaded"));
  expect(onEnglish).toBe(false);
});

test("the Arabic layout does not scroll sideways", async ({ page }) => {
  for (const path of ["/ar/", "/ar/services/", "/ar/contact/", "/ar/blog/"]) {
    await open(page, path);
    expect(await canScrollSideways(page), path).toBe(false);
  }
});

test("long French text does not break the layout", async ({ page }) => {
  for (const path of ["/fr/", "/fr/services/", "/fr/contact/", "/fr/about/"]) {
    await open(page, path);
    expect(await canScrollSideways(page), path).toBe(false);
  }
});

test("links keep the language", async ({ page }) => {
  await open(page, "/fr/");
  const hrefs = await page.locator("a[href^='/']").evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  const wrong = hrefs.filter((href) => !/^\/(en|fr|ar)\//.test(href) && !href.startsWith("/_next") && href !== "/favicon.ico");
  expect(wrong).toEqual([]);
  expect(hrefs.some((h) => h.startsWith("/en/") || h.startsWith("/ar/"))).toBe(false);
});
