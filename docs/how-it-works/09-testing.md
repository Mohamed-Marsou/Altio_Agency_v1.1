# 09. Testing: what is checked and how

Five layers, from fast to slow. All run with plain commands; CI runs most of them on every change.

| Layer | Command | Count | What it protects | Files |
|---|---|---|---|---|
| Unit and component | `npm run test` | 195 | rules and logic: translations parity, forms, phones, SEO data, dashboard store and API, picture pipeline, error log format, placeholder detector | `**/*.test.ts(x)` (Vitest + Testing Library, jsdom or node) |
| Coverage | `npm run test:coverage -w @altio/web` | thresholds: lines 85, branches 75 | the logic files listed in `vitest.config.ts` (about 90 percent now) | `vitest.config.ts` |
| Browser, public site | `npm run build:export` then `npm run e2e` | 213 (desktop Chrome and Pixel 5) | every page in 3 languages opens without errors and with the right `lang`/`dir`; language switch; Arabic font only on /ar; no sideways scroll; forms; theme and menu; 404; sitemap/robots; **accessibility (axe) on 12 pages x 3 languages**; screenshots | `e2e/public/*.spec.ts` |
| Browser, dashboard | `npm run e2e:admin` | 13 | create, edit, delete a post with a cover; WebP files exist and are under 150 KB; upload limit and wrong files refused (browser and server); alt text; project create/edit/delete and the "linked from home page" guard; the audit log | `e2e/admin/crud.spec.ts` |
| Quality gates | `seo:lint`, `lighthouse`, `optimize-images --check`, `smoke` | n/a | SEO of all 63 pages; speed/accessibility/SEO scores; image sizes; the live site answers | `scripts/*.mjs` |

## Details worth knowing
- **Translation parity** (`content/content.test.ts`): the most important unit test. Fails if French or Arabic lack a key, change a link or id, lose a `{{token}}`, keep a long English sentence, or an Arabic text has no Arabic letters.
- **Dashboard store tests** (`lib/admin/store.test.ts`) copy the real content to a temp folder, so the project files are never touched. Picture tests generate images with sharp (EXIF removal, rotation, sizes, fake types, 8 MB limit).
- **e2e admin** starts `npm run dev`, backs the content up first and restores it at the end (checked: no leftover difference). Dashboard files are formatted by the store, so JSON may be re-indented after real use.
- **Visual snapshots** (`e2e/__snapshots__`, about 2.7 MB) are Windows screenshots of 5 page types x 3 languages x desktop and phone, plus dark mode. Update with `npm run e2e:update` and look at the pictures before committing. CI skips them (Linux draws fonts slightly differently).
- **Accessibility**: `e2e/public/a11y.spec.ts` uses axe (WCAG 2 A and AA) and fails on serious or critical issues in light and dark.
- **Lighthouse**: `scripts/lighthouse.mjs` serves `out/` with gzip and runs mobile Lighthouse on 7 page types; budget performance 80, accessibility 95, best practices 90, SEO 95, LCP 4.2 s.

## CI: `.github/workflows/ci.yml`
install, lint, type check, unit tests, build, SEO lint, image budget, install Chromium, browser tests without screenshots, smoke test; plus `npm audit` of what goes on the live site (0 problems). A change cannot be merged on red.

## Writing a new test
Put `name.test.ts` next to the file. Use `// @vitest-environment node` for code that uses files or sharp.
