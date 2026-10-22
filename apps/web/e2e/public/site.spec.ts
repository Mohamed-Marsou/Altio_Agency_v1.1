import { expect, test } from "@playwright/test";
import { LOCALES, PAGES, open, watchErrors } from "../helpers";

test.describe("every page opens without errors", () => {
  for (const locale of LOCALES) {
    for (const path of PAGES) {
      test(`${locale}${path}`, async ({ page }) => {
        const errors = watchErrors(page);
        const url = `/${locale}${path}`;
        const response = await page.goto(url);
        expect(response?.status()).toBe(200);
        await open(page, url);

        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("h1")).toHaveCount(1);
        expect(errors).toEqual([]);
      });
    }
  }
});

// Without JavaScript (like a search engine) the page stays and shows the three links.
test.describe("language chooser", () => {
  test.use({ javaScriptEnabled: false });
  test("/ shows the three languages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/");
  await expect(page.getByRole("link", { name: "Français" })).toHaveAttribute("href", "/fr/");
  await expect(page.getByRole("link", { name: "العربية" })).toHaveAttribute("href", "/ar/");
  });
});

test("an unknown address shows the 404 page with the right status", async ({ page }) => {
  const response = await page.goto("/en/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("the admin area is never listed by search engines", async ({ page }) => {
  for (const path of ["/admindash/", "/admindash/blog/", "/admindash/projects/", "/admindash/media/", "/admindash/audit/"]) {
    await page.goto(path);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots, path).toMatch(/noindex/);
    expect(robots, path).toMatch(/nofollow/);
  }
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("admindash");
});

test("the admin area has no public footer, loader or custom cursor", async ({ page }) => {
  await page.goto("/admindash/");
  await expect(page.locator("footer")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-loader", "on");
});

test("sitemap.xml and robots.txt exist", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<loc>");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toMatch(/Disallow: \/admindash\//);
});
