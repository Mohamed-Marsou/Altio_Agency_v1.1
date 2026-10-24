# 10. Build and deploy

Full steps are in `docs/DEPLOY.md`. This page explains how it works.

## The build
`npm run build:export` = `NEXT_OUTPUT=export next build` then `scripts/fix-rsc-paths.mjs`. `next.config.ts` turns on `output: "export"`, `trailingSlash: true`, `images.unoptimized` (no image server; images are pre-sized WebP). The result is `apps/web/out` (about 20 MB, 673 files, 63 pages).

- **Why `fix-rsc-paths`**: when visitors move between pages Next downloads small data files named with dots (`__next.!KHNpdGUp.$d$locale.services.__PAGE__.txt`) but the export writes them in folders. A static host cannot map them, which produced 404s and slow page loads. The script copies each to its dotted name (about 140 small files).
- `experimental.globalNotFound` gives one 404 page for the whole site.
- `agentRules: false` stops Next creating an AGENTS.md file.
- JavaScript is minified by Next. Text is compressed by the server (`.htaccess`).

## Local check of the built site
`node scripts/serve-out.mjs 4173` serves `out/` like Hostinger (folders to index.html, 404 page with status 404, gzip). Tests, Lighthouse and the smoke test use it.

## `public/.htaccess` (Apache/LiteSpeed on Hostinger)
HTTPS and no-www redirects (any domain), trailing slash, `ErrorDocument 404`, gzip/brotli, caching (1 year for hashed js/css/fonts and WebP, none for pages), security headers (HSTS, CSP, nosniff, frame, referrer, permissions), `X-Robots-Tag: noindex` for any `/admindash`, hides dotfiles, maps and logs, no directory listing. Not yet tested on the real server: use the smoke test after the first upload.

## Strict release: `npm run build:release`
`check:release` (placeholders, `verified`, drafts) then image budget then build then SEO lint. See 03.

## GitHub Actions
- `ci.yml`: see 09.
- `deploy.yml`: on push to `main` or manual run (with dry run option): tests, strict build, keeps the `out` folder as an artifact for 30 days (rollback), FTP upload with `SamKirkland/FTP-Deploy-Action` (secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`; variables `FTP_DIR`, `SITE_URL`), never cleans the server folder (other sites on the plan are safe), excludes `/admindash`, then runs `scripts/smoke.mjs` on the live address.

## `scripts/smoke.mjs`
Asks the live site for the home page of each language (checks `lang`, `dir`), a case study, a blog post, contact, sitemap, robots, social image, a 404, a page data file, and on https: http to https redirect, security headers, compression.

## Environment variables
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_LOADER=off`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_API_URL`, `NEXT_PUBLIC_ERROR_LOG_URL` (all optional, explained in `docs/DEPLOY.md`). The dashboard and logger servers only exist in `npm run dev`.

## Dependencies and security
Next.js upgraded to 16.4.2 (fixes the flagged vulnerabilities). `npm audit --omit=dev` for the website: 0 vulnerabilities. Remaining audit lines are development tools only (ESLint config chain, Prisma in `apps/api`).
