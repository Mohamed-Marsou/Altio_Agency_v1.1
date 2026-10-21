# 12. Cheat sheet, FAQ and known limits

## Where do I change...?

| I want to change | Edit |
|---|---|
| a text on a page | the same key in `content/en`, `content/fr`, `content/ar`, then `npm run test` |
| the phone, email, domain, hours | `content/shared/site.json` only |
| page title or description for Google | `content/<lang>/seo.json` |
| the colours | `styles/base/_tokens.scss` (and `_vibes.scss` for topic colours) |
| the form rules or messages | `lib/forms/schemas.ts`; texts in `content/<lang>/contact.json` etc. |
| menu links | `content/<lang>/nav.json` |
| add a blog post or a project | the dashboard (`npm run dev`, `/admindash`) |
| how pictures are converted | `lib/admin/mediaPipeline.ts` (`WIDTHS`, `TARGET_BYTES`, `MAX_UPLOAD_BYTES` in `schemas.ts`) |
| server rules (caching, redirects, headers) | `public/.htaccess` |
| what the checks require | `scripts/check-site-data.mjs`, `scripts/seo-lint.mjs`, `vitest.config.ts` |

## FAQ

**Why can't I edit from the live site?** The live site is static files; saving needs a server. The dashboard works only in `npm run dev` until the backend exists.

**Why does `build:release` fail?** On purpose: fake phone or email left, `verified` is false, or texts still `draft`. It prints the list.

**Why are French and Arabic marked draft?** They were written by Claude and nobody who reads those languages has checked them yet.

**A new post gives 404 in dev.** The dashboard touches the page files so Next refreshes; if it ever happens, restart `npm run dev`.

**Why is the Next.js `dev` slower to show a saved post?** Next rebuilds the page the first time it is opened.

**Do uploaded pictures go to git?** Yes: `public/uploads` and `content/shared/media.json` are part of the site and are committed.

**Why do some drawings show English words in French and Arabic?** They are decorative mock-ups with fixed English text (see `docs/content-audit.md`, section 3).

**Is the dashboard private?** It is not uploaded to Hostinger (`deploy.yml` excludes it), is `noindex`, and has no login because it has no live data. Do not add real data there before the backend login exists.

## Known limits (honest list)
1. Dashboard editing: dev only; no login, scheduling, trash or revisions.
2. The four case studies, their results and quotes are **samples**; the Work page shows a note saying so.
3. The Overview page shows sample numbers.
4. FR and AR texts are drafts; legal pages need a lawyer.
5. The case study of a project is edited as JSON (no form per chapter yet).
6. A few decorative drawing texts are English only.
7. Visual snapshots are made on Windows; CI skips them.
8. The deploy workflow and `.htaccess` were not tested on the real Hostinger server (no credentials); use the dry run and the smoke test on the first upload.
9. Largest Contentful Paint is about 3 seconds in Lighthouse's harsh mobile test (scores 89 to 95); the intro loading screen adds some, switch it off with `NEXT_PUBLIC_SITE_LOADER=off` if speed matters more.
10. Backend: skeleton only; schema still PostgreSQL.

## How to ask a detailed question
Name the feature and a file from this guide ("forms: why is `limitMessage` 1400?") and I can answer from the code.
