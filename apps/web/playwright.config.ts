import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: a real browser opens the site and clicks like a visitor.
//
//   npm run build:export && npm run e2e         public site (built files, desktop + phone)
//   npm run e2e:admin                           dashboard (starts `npm run dev`, edits then RESTORES content)
//
// On your computer the tests use the Chrome you already have installed. On the CI
// server Playwright installs its own browser (npx playwright install chromium).
const isCI = Boolean(process.env.CI);
const browser = isCI ? {} : { channel: "chrome" as const };
const adminOnly = process.env.E2E_ADMIN === "1";

const PUBLIC_URL = "http://127.0.0.1:4173";
const ADMIN_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 8_000, toHaveScreenshot: { maxDiffPixelRatio: 0.03, animations: "disabled" } },
  fullyParallel: !adminOnly,
  workers: adminOnly ? 1 : isCI ? 2 : 3,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}-{projectName}{ext}",

  projects: adminOnly
    ? [{ name: "admin", testMatch: /admin\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"], ...browser, baseURL: ADMIN_URL } }]
    : [
        { name: "desktop", testMatch: /public\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"], ...browser, baseURL: PUBLIC_URL } },
        { name: "mobile", testMatch: /public\/.*\.spec\.ts/, use: { ...devices["Pixel 5"], ...browser, baseURL: PUBLIC_URL } },
      ],

  webServer: adminOnly
    ? { command: "npm run dev", url: `${ADMIN_URL}/admindash/`, reuseExistingServer: true, timeout: 120_000 }
    : { command: "node scripts/serve-out.mjs 4173", url: `${PUBLIC_URL}/en/`, reuseExistingServer: true, timeout: 30_000 },
});
