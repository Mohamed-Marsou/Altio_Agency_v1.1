import { expect, test } from "@playwright/test";
import { open } from "../helpers";

test("dark mode can be switched on and is remembered after a reload", async ({ page }) => {
  await open(page, "/en/");
  await page.evaluate(() => localStorage.removeItem("altio-theme"));
  await page.reload();
  await open(page, "/en/");
  const before = await page.locator("html").getAttribute("data-theme");

  await page.getByRole("button", { name: /Toggle dark mode/ }).first().click();
  const after = await page.locator("html").getAttribute("data-theme");
  expect(after).not.toBe(before);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", after!);
});

test("the mobile menu opens, closes with Escape and shows the language list", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await open(page, "/en/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "العربية" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
});

test("the blog filter and a post page work", async ({ page }) => {
  await open(page, "/en/blog/");
  await page.getByRole("button", { name: "SEO" }).first().click();
  await expect(page.getByRole("link", { name: /Google Maps/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /Google Maps/ }).first().click();
  await expect(page).toHaveURL(/show-up-on-google-maps\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Google Maps");
});
