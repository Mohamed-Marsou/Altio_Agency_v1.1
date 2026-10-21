import { expect, test } from "@playwright/test";
import { open } from "../helpers";

// WhatsApp is an outside site: the tests never open the real one.
test.beforeEach(async ({ context }) => {
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>WhatsApp (test)</title>" }));
});

const waitForFillTime = (page: import("@playwright/test").Page) => page.waitForTimeout(3300); // the form refuses to send in the first 3 seconds

test("an empty contact form shows errors in the page language and sends nothing", async ({ page, context }) => {
  await open(page, "/fr/contact/");
  let opened = false;
  context.on("page", () => (opened = true));
  await page.getByRole("button", { name: "Envoyer et recevoir mon design gratuit" }).click();
  await expect(page.getByText("Entrez votre nom.")).toBeVisible();
  await expect(page.getByText("Entrez un numéro joignable sur WhatsApp.")).toBeVisible();
  await expect(page.getByText("Choisissez ce dont vous avez besoin.")).toBeVisible();
  expect(opened).toBe(false);
});

test("a wrong phone number is refused, a Moroccan one in any format is accepted", async ({ page }) => {
  await open(page, "/en/contact/");
  await page.getByLabel("Your name").fill("Sara Benali");
  await page.getByRole("button", { name: "Business website" }).click();

  await page.getByLabel("WhatsApp number").fill("12345");
  await page.getByRole("button", { name: "Send and get my free design" }).click();
  await expect(page.getByText("Enter a number we can reach on WhatsApp.")).toBeVisible();

  await page.getByLabel("WhatsApp number").fill("06 12 34 56 78");
  await waitForFillTime(page);
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Send and get my free design" }).click();
  const whatsapp = await popup;
  expect(whatsapp.url()).toContain("https://wa.me/");
});

test("the WhatsApp message is written in Arabic on the Arabic site", async ({ page }) => {
  await open(page, "/ar/free-design/");
  await page.getByLabel("اسمك").fill("سارة بنعلي");
  await page.getByLabel("رقم واتساب").fill("+212 6 12 34 56 78");
  await page.getByRole("button", { name: "موقع شركة" }).click();
  await waitForFillTime(page);
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "أرسل واحصل على تصميمي المجاني" }).click();
  const url = (await popup).url();
  const message = decodeURIComponent(url.split("text=")[1] ?? "");
  expect(message).toContain("مرحباً ألتيو");
  expect(message).toContain("سارة بنعلي");
  await expect(page.getByText("تم فتح واتساب ومعه رسالتك. اضغط على إرسال هناك لتنتهي.")).toBeVisible();
  await expect(page.getByRole("link", { name: "لم يُفتح واتساب؟ اضغط هنا" })).toBeVisible();
});

test("a robot that fills the hidden field is ignored", async ({ page }) => {
  await open(page, "/en/contact/");
  await page.getByLabel("Your name").fill("Bot");
  await page.getByLabel("WhatsApp number").fill("0612345678");
  await page.getByRole("button", { name: "Business website" }).click();
  await page.locator('input[name="company_site"]').fill("http://spam.example", { force: true });
  await waitForFillTime(page);
  let opened = false;
  page.context().on("page", () => (opened = true));
  await page.getByRole("button", { name: "Send and get my free design" }).click();
  await page.waitForTimeout(500);
  expect(opened).toBe(false);
});

test("the referral form works too", async ({ page }) => {
  await open(page, "/en/referrals/");
  await page.getByLabel("Your name").fill("Sara");
  await page.getByLabel("Your WhatsApp").fill("0612345678");
  await page.getByLabel("Who are you referring?").fill("Karim");
  await waitForFillTime(page);
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Send on WhatsApp" }).click();
  expect((await popup).url()).toContain("wa.me");
});
