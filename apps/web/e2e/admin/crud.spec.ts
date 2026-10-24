import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

// These tests use the REAL dashboard on the dev server and really create, edit and
// delete posts, projects and pictures in the JSON files. The content folder is copied
// before and put back after, so nothing is left behind (also see the git history).
const appRoot = path.resolve(__dirname, "../..");
const contentDir = path.join(appRoot, "src", "content");
const uploadsDir = path.join(appRoot, "public", "uploads");
const API = "http://127.0.0.1:4001";
let backup: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  backup = mkdtempSync(path.join(tmpdir(), "altio-e2e-content-"));
  cpSync(contentDir, path.join(backup, "content"), { recursive: true });
  rmSync(uploadsDir, { recursive: true, force: true });
});

test.afterAll(() => {
  rmSync(contentDir, { recursive: true, force: true });
  cpSync(path.join(backup, "content"), contentDir, { recursive: true });
  rmSync(uploadsDir, { recursive: true, force: true });
  rmSync(backup, { recursive: true, force: true });
});

async function picture(width = 2400, height = 1500) {
  return sharp({ create: { width, height, channels: 3, background: { r: 20, g: 90, b: 220 } } }).jpeg({ quality: 90 }).toBuffer();
}

async function waitForList(page: Page, text: RegExp) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 15_000 });
}

test("the blog list shows the 7 existing posts", async ({ page }) => {
  await page.goto("/admindash/blog/");
  await waitForList(page, /7 of 7 posts/);
  await page.getByRole("searchbox").fill("google maps");
  await waitForList(page, /1 of 7 posts/);
});

test("a post with empty fields is refused with clear messages", async ({ page }) => {
  await page.goto("/admindash/blog/edit/");
  await expect(page.getByRole("heading", { name: "New post" })).toBeVisible();
  await page.getByRole("button", { name: "Save post" }).click();
  await expect(page.getByText("Some fields need attention")).toBeVisible();
  await expect(page.getByText("Required").first()).toBeVisible();
});

test("create a post with a cover picture, in three languages", async ({ page }) => {
  await page.goto("/admindash/blog/edit/");
  await expect(page.getByRole("heading", { name: "New post" })).toBeVisible();

  await page.getByLabel("Title", { exact: true }).fill("My test article about WhatsApp");
  await expect(page.getByLabel(/Web address/)).toHaveValue("my-test-article-about-whatsapp");
  await page.getByLabel("Short summary").fill("A short summary written by the end to end test.");
  await page.getByRole("textbox", { name: "Text", exact: true }).fill("First paragraph of the test article.");

  // Cover: upload a picture from the picker
  await page.getByRole("button", { name: "Choose a picture" }).click();
  await page.locator("dialog input[type=file]").setInputFiles({ name: "cover.jpg", mimeType: "image/jpeg", buffer: await picture() });
  await expect(page.getByRole("button", { name: "Change picture" })).toBeVisible({ timeout: 15_000 });

  // French and Arabic: copy the English text, then change the titles
  for (const [tab, title] of [["Français", "Mon article de test sur WhatsApp"], ["العربية", "مقالي التجريبي عن واتساب"]] as const) {
    await page.getByRole("tab", { name: tab }).click();
    await page.getByRole("button", { name: /Copy the English text/ }).click();
    await page.getByLabel("Title", { exact: true }).fill(title);
  }

  await page.getByRole("button", { name: "Save post" }).click();
  await expect(page.getByText("Saved. The site shows the change")).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/slug=my-test-article-about-whatsapp/);

  // It is written in the three files
  for (const [locale, title] of [["en", "My test article about WhatsApp"], ["fr", "Mon article de test sur WhatsApp"], ["ar", "مقالي التجريبي عن واتساب"]]) {
    const file = JSON.parse(readFileSync(path.join(contentDir, locale, "posts.json"), "utf8")) as { slug: string; title: string; cover?: string }[];
    const entry = file.find((p) => p.slug === "my-test-article-about-whatsapp");
    expect(entry?.title).toBe(title);
    expect(entry?.cover).toMatch(/^[0-9a-f]{12}$/);
  }
});

test("the new post and its WebP cover are on the public site", async ({ page, request }) => {
  await expect.poll(async () => (await page.request.get("/en/blog/my-test-article-about-whatsapp/")).status(), { timeout: 20_000 }).toBe(200);
  await page.goto("/en/blog/my-test-article-about-whatsapp/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("My test article about WhatsApp");
  const image = page.locator("main img[srcset]").first();
  await expect(image).toBeVisible();
  const srcset = (await image.getAttribute("srcset")) ?? "";
  expect(srcset).toMatch(/\/uploads\/[0-9a-f]{12}-480\.webp 480w/);
  const first = srcset.split(",")[0]!.trim().split(" ")[0]!;
  const file = await request.get(first);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toContain("image/webp");
  expect((await file.body()).length).toBeLessThan(150 * 1024);

  await page.goto("/fr/blog/my-test-article-about-whatsapp/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mon article de test");
  await page.goto("/ar/blog/my-test-article-about-whatsapp/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("edit the post: change the title and add a section", async ({ page }) => {
  await page.goto("/admindash/blog/edit/?slug=my-test-article-about-whatsapp");
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();
  await expect(page.getByLabel(/Web address/)).toBeDisabled();

  await page.getByLabel("Title", { exact: true }).fill("My test article, edited");
  await page.getByLabel("New block type").selectOption("h2");
  await page.getByRole("button", { name: "Add block" }).click();
  await page.getByLabel("Section title").fill("A new section");
  await expect(page.getByLabel(/Link id/)).toHaveValue("a-new-section");
  await page.getByRole("button", { name: "Save post" }).click();
  await expect(page.getByText("Saved. The site shows the change")).toBeVisible({ timeout: 15_000 });

  await page.goto("/en/blog/my-test-article-about-whatsapp/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("My test article, edited");
  await expect(page.getByRole("heading", { level: 2, name: "A new section" })).toBeVisible();
});

test("deleting a picture that is used as a cover is refused", async ({ page }) => {
  await page.goto("/admindash/media/");
  await expect(page.getByText(/1 pictures/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Used by: Post: My test article, edited/)).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete picture" }).click();
  await expect(page.getByText(/is used by: Post: my-test-article-about-whatsapp/)).toBeVisible();
});

test("delete the post from the list (with a confirmation)", async ({ page }) => {
  await page.goto("/admindash/blog/");
  await waitForList(page, /8 of 8 posts/);
  const row = page.locator("li", { hasText: "My test article, edited" });
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete this post?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await waitForList(page, /8 of 8 posts/);

  await row.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete post" }).click();
  await waitForList(page, /7 of 7 posts/);
  for (const locale of ["en", "fr", "ar"]) {
    const file = JSON.parse(readFileSync(path.join(contentDir, locale, "posts.json"), "utf8")) as { slug: string }[];
    expect(file.some((p) => p.slug === "my-test-article-about-whatsapp")).toBe(false);
  }
});

test("the picture library: upload converts to WebP, wrong files are refused", async ({ page, request }) => {
  await page.goto("/admindash/media/");
  await expect(page.getByText(/0 pictures|1 pictures/)).toBeVisible({ timeout: 15_000 });

  // a good picture (a new one, so it is not a duplicate)
  await page.locator("input[type=file]").setInputFiles({ name: "team photo.png", mimeType: "image/png", buffer: await sharp({ create: { width: 1800, height: 1200, channels: 3, background: { r: 200, g: 40, b: 90 } } }).png().toBuffer() });
  await expect(page.getByText("Converted to WebP and saved.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/3 sizes/).first()).toBeVisible();

  const list = (await (await request.get(`${API}/api/media`)).json()) as { items: { variants: { path: string; bytes: number }[]; originalName: string }[] };
  const entry = list.items.find((m) => m.originalName.startsWith("team photo"))!;
  expect(entry.variants.map((v) => v.path.endsWith(".webp"))).toEqual([true, true, true]);
  for (const variant of entry.variants) {
    const response = await request.get(variant.path.startsWith("/") ? `http://localhost:3000${variant.path}` : variant.path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/webp");
    expect(variant.bytes).toBeLessThanOrEqual(150 * 1024);
  }
  expect(existsSync(path.join(uploadsDir, entry.variants[0]!.path.split("/").pop()!))).toBe(true);

  // too big (the browser refuses before sending)
  await page.locator("input[type=file]").setInputFiles({ name: "huge.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(8 * 1024 * 1024 + 10, 1) });
  await expect(page.getByText(/is 8\.0 MB\. The limit is 8 MB/)).toBeVisible();

  // wrong type
  await page.locator("input[type=file]").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(page.getByText(/is not a JPEG, PNG, WebP or AVIF picture/)).toBeVisible();

  // a disguised file: the server looks inside, not at the name
  await page.locator("input[type=file]").setInputFiles({ name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>") });
  await expect(page.getByText("Only JPEG, PNG, WebP and AVIF pictures are accepted.")).toBeVisible();
});

test("the server itself refuses an oversize file (not only the browser)", async ({ request }) => {
  const response = await request.post(`${API}/api/media?name=big.jpg`, {
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/octet-stream" },
    data: Buffer.alloc(9 * 1024 * 1024, 1),
  });
  expect(response.status()).toBe(413);
  expect((await response.json()).error.code).toBe("TOO_LARGE");
  // and the API refuses a request that does not come from our own pages
  const foreign = await request.delete(`${API}/api/posts/design-before-build`, { headers: { Origin: "http://evil.example" } });
  expect(foreign.status()).toBe(403);
});

test("the alt text can be written in the three languages", async ({ page }) => {
  await page.goto("/admindash/media/");
  await expect(page.getByText("English alt text is missing.").first()).toBeVisible({ timeout: 15_000 });
  const missingBefore = await page.getByText("English alt text is missing.").count();
  await page.getByLabel("Alt text (EN)").first().fill("Our team");
  await page.getByLabel("Alt text (FR)").first().fill("Notre équipe");
  await page.getByLabel("Alt text (AR)").first().fill("فريقنا");
  await page.getByRole("button", { name: "Save alt text" }).first().click();
  await expect(page.getByText("Alt text saved.")).toBeVisible();
  await expect(page.getByText("English alt text is missing.")).toHaveCount(missingBefore - 1);
});

test("create, edit and delete a project", async ({ page }) => {
  await page.goto("/admindash/projects/");
  await waitForList(page, /4 of 4 projects/);
  await page.getByRole("link", { name: "New project" }).click();

  await page.getByLabel("Project name").fill("Test Bakery");
  await expect(page.getByLabel(/Web address/)).toHaveValue("test-bakery");
  await page.getByLabel("Label (e.g. Real estate)").fill("Food");
  await page.getByLabel("Short description").fill("A test project created by the end to end test.");
  await page.getByLabel(/Main result/).fill("×2 orders");
  for (const tab of ["Français", "العربية"]) {
    await page.getByRole("tab", { name: tab }).click();
    await page.getByRole("button", { name: /Copy the English text/ }).click();
  }
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByText("Saved. The site shows the change")).toBeVisible({ timeout: 15_000 });

  // The dev server needs a moment to notice the changed JSON file.
  await expect.poll(async () => (await page.request.get("/en/work/test-bakery/")).status(), { timeout: 20_000 }).toBe(200);
  await page.goto("/en/work/test-bakery/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Client name,");

  // a broken case study is refused
  await page.goto("/admindash/projects/edit/?slug=test-bakery");
  await expect(page.getByRole("heading", { name: "Edit project" })).toBeVisible();
  await page.getByLabel(/Case study/).fill("{ not json");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByText(/not valid JSON/)).toBeVisible();

  // delete
  await page.goto("/admindash/projects/");
  await waitForList(page, /5 of 5 projects/);
  await page.locator("li", { hasText: "Test Bakery" }).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete project" }).click();
  await waitForList(page, /4 of 4 projects/);
});

test("a project that the home page links to cannot be deleted", async ({ page }) => {
  await page.goto("/admindash/projects/");
  await waitForList(page, /4 of 4 projects/);
  await page.locator("li", { hasText: "Atlas Immo" }).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(page.getByText(/linked from the home page/)).toBeVisible();
});

test("errors from the site appear in the Audit log with date and component", async ({ page }) => {
  await page.goto("/admindash/audit/");
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  await page.getByRole("button", { name: "Send test error" }).click();
  await expect(page.getByText("Test error sent from the Audit log page").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("AuditView").first()).toBeVisible();
});
