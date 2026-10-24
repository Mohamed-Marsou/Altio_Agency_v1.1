import { expect, test } from "@playwright/test";
import { LOCALES, open } from "../helpers";

// Visual regression: a screenshot of each important page is compared with the saved one.
// When a change is wanted: npm run e2e:update, then LOOK at the new pictures before committing.
// The pictures are in e2e/__snapshots__ (one per page, language, light/dark and screen size).
const PAGES: [string, string][] = [
  ["home", "/"],
  ["services", "/services/"],
  ["contact", "/contact/"],
  ["blog-post", "/blog/local-business-website-checklist/"],
  ["case-study", "/work/atlas-immo/"],
];

for (const locale of LOCALES) {
  for (const [name, path] of PAGES) {
    test(`visual ${name} ${locale}`, async ({ page }) => {
      await open(page, `/${locale}${path}`);
      // The top of the page: everything below is the same components again.
      await expect(page).toHaveScreenshot(`${name}-${locale}.png`, { fullPage: false });
    });
  }
}

test("visual home dark", async ({ page }) => {
  await open(page, "/en/");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expect(page).toHaveScreenshot("home-en-dark.png", { fullPage: false });
});
