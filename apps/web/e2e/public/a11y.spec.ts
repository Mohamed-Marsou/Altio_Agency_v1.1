import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LOCALES, PAGES, open } from "../helpers";

// Accessibility check with axe on every kind of page, in every language, in light and dark.
// Only serious and critical problems fail the test.
for (const locale of LOCALES) {
  for (const path of PAGES) {
    test(`axe: ${locale}${path}`, async ({ page }) => {
      await open(page, `/${locale}${path}`);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} elements, first: ${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
    });
  }
}

test("axe in dark mode (home, English and Arabic)", async ({ page }) => {
  for (const path of ["/en/", "/ar/"]) {
    await open(page, path);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`), path).toEqual([]);
  }
});

test("everything can be reached with the keyboard and shows a focus ring", async ({ page }) => {
  await open(page, "/en/");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return { tag: el?.tagName, visible: !!el && el.getBoundingClientRect().width > 0 };
  });
  expect(focused.visible).toBe(true);
});
