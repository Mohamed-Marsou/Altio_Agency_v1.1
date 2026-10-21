// =============================================================================
// SMOKE TEST  (F8): after an upload, checks that the LIVE site really works.
//   node scripts/smoke.mjs https://yourdomain.ma
//   node scripts/smoke.mjs                 (tests a local copy: http://127.0.0.1:4173)
// It does not need a browser: it just asks the server for the important addresses
// and checks the answers. Exit code 1 = something is wrong (the deploy job fails).
// =============================================================================
const base = (process.argv[2] ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const LOCALES = ["en", "fr", "ar"];
let failures = 0;

async function check(name, run) {
  try {
    await run();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures++;
    console.log(`  FAIL ${name}: ${error.message}`);
  }
}

const get = (path, options = {}) => fetch(base + path, { redirect: "manual", ...options });
const expectStatus = async (path, status, options) => {
  const response = await get(path, options);
  if (response.status !== status) throw new Error(`${path} answered ${response.status}, expected ${status}`);
  return response;
};

console.log(`Smoke test of ${base}\n`);

for (const locale of LOCALES) {
  await check(`/${locale}/ opens and is in the right language`, async () => {
    const response = await expectStatus(`/${locale}/`, 200);
    const html = await response.text();
    if (!html.includes(`<html lang="${locale}"`)) throw new Error("wrong <html lang>");
    if (locale === "ar" && !html.includes('dir="rtl"')) throw new Error("Arabic page is not right to left");
    if (!/<title>[^<]{10,}/.test(html)) throw new Error("empty title");
  });
}

await check("a case study opens", async () => void (await expectStatus("/en/work/atlas-immo/", 200)));
await check("a blog post opens", async () => void (await expectStatus("/fr/blog/local-business-website-checklist/", 200)));
await check("the contact page opens", async () => void (await expectStatus("/ar/contact/", 200)));
await check("sitemap.xml lists pages", async () => {
  const text = await (await expectStatus("/sitemap.xml", 200)).text();
  if ((text.match(/<loc>/g) ?? []).length < 30) throw new Error("sitemap is too short");
});
await check("robots.txt points to the sitemap", async () => {
  const text = await (await expectStatus("/robots.txt", 200)).text();
  if (!/Sitemap:/i.test(text)) throw new Error("no Sitemap line");
});
await check("the social image exists", async () => void (await expectStatus("/og/en.png", 200)));
await check("an unknown address answers 404", async () => void (await expectStatus("/en/this-page-does-not-exist/", 404)));
await check("the page data files (no 404 when moving between pages)", async () => {
  await expectStatus("/en/services/__next.!KHNpdGUp.$d$locale.services.__PAGE__.txt", 200);
});

if (base.startsWith("https://")) {
  await check("http redirects to https", async () => {
    const response = await fetch(base.replace("https://", "http://") + "/en/", { redirect: "manual" });
    if (![301, 302, 308].includes(response.status)) throw new Error(`answered ${response.status}`);
    if (!(response.headers.get("location") ?? "").startsWith("https://")) throw new Error("does not go to https");
  });
  await check("security headers are present", async () => {
    const headers = (await get("/en/")).headers;
    for (const name of ["strict-transport-security", "x-content-type-options", "content-security-policy"]) {
      if (!headers.get(name)) throw new Error(`missing ${name}`);
    }
  });
  await check("text is compressed", async () => {
    const response = await get("/en/", { headers: { "accept-encoding": "gzip, br" } });
    if (!response.headers.get("content-encoding")) throw new Error("no compression");
  });
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nEverything works.");
process.exit(failures ? 1 : 0);
