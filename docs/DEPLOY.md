# Deploying the public site to Hostinger (static)

The website is a **static export**: plain HTML, CSS, JavaScript and pictures. It runs on any Hostinger plan, including Premium, and uses almost no space (about 20 MB). The backend (Node.js + MySQL, `finalBE.md`) is a separate step and needs a plan that supports Node.js.

## Everyday commands (from the project root)

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site and the dashboard locally (http://localhost:3000). Also starts the dev error logger and the dashboard server. |
| `npm run check` | Lint, type check, unit tests, build and SEO check in one go. |
| `npm run test` | Unit and component tests (195 tests). |
| `npm run e2e` | Browser tests of the built site (`npm run build:export` first): pages, languages, forms, accessibility, screenshots. |
| `npm run e2e:admin` | Browser tests of the dashboard (create, edit, delete, upload). It puts the content back afterwards. |
| `npm run build:export` | Builds the static site into `apps/web/out`. |
| `npm run build:release` | Same, but **strict**: stops if a placeholder is left or a text is a draft. This is what goes online. |
| `npm run lighthouse -w @altio/web` | Speed, accessibility and SEO scores of the built site. |
| `npm run claims -w @altio/web` | Rewrites `docs/content-audit.md`. |

## Automatic deploy (recommended)

`.github/workflows/deploy.yml` builds and uploads on every push to `main`.

One-time setup in GitHub (Settings, Secrets and variables, Actions):

- **Secrets:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (from hPanel, Files, FTP accounts)
- **Variables:** `FTP_DIR` (the folder of this site, for example `/domains/yourdomain.ma/public_html/`), `SITE_URL` (`https://yourdomain.ma`)

The job: tests, strict release build, SEO check, keeps the finished folder for 30 days (rollback copy), uploads, then runs the smoke test on the live address. The upload never deletes files it did not put there, so the WordPress and other Next.js sites on the same plan are safe. The `/admindash` pages are **not** uploaded until the backend exists.

First time: run the workflow by hand with **Dry run** ticked. It lists what would be uploaded and changes nothing.

## Manual deploy (if you prefer)

1. `npm run build:release`
2. Upload the **contents** of `apps/web/out` (including the hidden file `.htaccess`) to the site folder in hPanel File Manager or FTP.
3. `node apps/web/scripts/smoke.mjs https://yourdomain.ma`

## Rollback

- **Automatic:** GitHub, Actions, "Deploy to Hostinger", Run workflow, choose the older commit. Or download the `release-<commit>` artifact and upload it.
- **Manual:** keep the previous `out` folder zipped on your computer before each upload.

## What `.htaccess` does (apps/web/public/.htaccess)

HTTPS everywhere and one address (no `www`), folders with a final slash, the 404 page, gzip/brotli, long cache for files with a hash in the name and no cache for pages, security headers (HSTS, CSP, no framing...), `noindex` for any admin address, and it hides private files. It works for any domain name, nothing to edit.

If a **backend address** is added later, add it to `connect-src` in the Content-Security-Policy line.

## Why the extra copies of `__next...txt` files

When a visitor moves between pages Next.js downloads small data files whose names use dots, but the static export writes them in folders. A static host cannot map one to the other, so every move gave a 404 and a slower page. `scripts/fix-rsc-paths.mjs` (run automatically by `build:export`) copies each file to the dotted name. About 140 small files; nothing to do.

## Size and limits on Hostinger Premium

- The whole site is about 20 MB and about 670 files (Premium allows 20 GB and 400,000 files, shared with the other sites).
- Pictures uploaded in the dashboard are converted to WebP (480, 960, 1600 px, about 15 to 60 KB each), so photos never fill the plan.

## Environment variables (all optional)

| Variable | Effect |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The public address used in the sitemap, canonical links and social cards (defaults to `https://<domain in site.json>`). |
| `NEXT_PUBLIC_SITE_LOADER=off` | Removes the intro loading screen (better speed score). |
| `NEXT_PUBLIC_API_URL` | When the backend exists, the forms send the lead there and use WhatsApp only as a fallback. |
| `NEXT_PUBLIC_ADMIN_API_URL` | Address of the dashboard API (real backend). |
| `NEXT_PUBLIC_ERROR_LOG_URL` | Where browser errors are sent in production (the backend). |
