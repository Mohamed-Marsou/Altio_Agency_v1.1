import type { Page } from "@playwright/test";

export const LOCALES = ["en", "fr", "ar"] as const;

// One page of each kind, used by the accessibility, visual and smoke tests.
export const PAGES = ["/", "/services/", "/work/", "/work/atlas-immo/", "/blog/", "/blog/local-business-website-checklist/", "/about/", "/contact/", "/free-design/", "/referrals/", "/privacy/", "/terms/"];

/** Opens a page and waits until the loading screen is gone and fonts are ready. */
export async function open(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.waitForFunction(() => document.documentElement.getAttribute("data-loader") !== "on", undefined, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
}

/** Collects JavaScript errors and failed requests so a test can assert there were none. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    // our own files must never 404 (an external site such as WhatsApp is not our problem)
    if (response.status() >= 400 && response.url().startsWith("http://127.0.0.1:4173")) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

/**
 * True when a visitor can scroll the page sideways with the mouse wheel or a swipe
 * (it must never happen: a page that wobbles left and right looks broken on a phone).
 */
export async function canScrollSideways(page: Page): Promise<boolean> {
  await page.mouse.move(100, 300);
  await page.mouse.wheel(600, 0);
  await page.waitForTimeout(150);
  const right = await page.evaluate(() => window.scrollX);
  await page.mouse.wheel(-1200, 0);
  await page.waitForTimeout(150);
  const left = await page.evaluate(() => window.scrollX);
  return Math.abs(right) > 1 || Math.abs(left) > 1;
}
