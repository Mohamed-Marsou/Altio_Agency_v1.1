# 05. SEO

Everything is generated from the content files and `site.json`, in each language.

## Where each part lives

| Part | File | Detail |
|---|---|---|
| Title + description per page | `content/<lang>/seo.json`, `lib/seo.ts` (`pageMetadata`) | each page calls `generateMetadata` which returns `pageMetadata(locale, "/path/", "key")` |
| Posts and case studies | `lib/seo.ts` (`buildMetadata`) | title and description come from the item itself; posts are `og:type=article` with date |
| Canonical + hreflang | `lib/seo.ts` (`alternates`) | each page lists `en`, `fr`, `ar` and `x-default` (the `/` chooser) |
| Open Graph + Twitter | `lib/seo.ts` | image `/og/<lang>.png` 1200x630 |
| Social images | `scripts/generate-og.mjs`, `public/og/*.png` | drawn with sharp from the hero title; re-run `npm run og -w @altio/web` |
| Sitemap | `app/sitemap.ts` | all pages x 3 languages, posts, case studies, with hreflang alternates |
| robots.txt | `app/robots.ts` | allows all, disallows `/admindash/`, points to the sitemap |
| Structured data (JSON-LD) | `lib/seo.ts`, `components/system/JsonLd.tsx`, `PageSchema.tsx` | Organization + WebSite (layout), LocalBusiness + FAQPage (home), BreadcrumbList (inner pages), Service (services), Article (posts), CreativeWork (case studies) |
| 404 page | `app/global-not-found.tsx` | one page in three languages with links; Hostinger serves it via `.htaccess` |
| noindex | admin layout + `.htaccess` header + robots | the dashboard never appears in Google |

`siteUrl` (lib/seo.ts) is `https://<domain from site.json>` or `NEXT_PUBLIC_SITE_URL`.

## The SEO lint: `scripts/seo-lint.mjs`
Run after a build: `npm run seo:lint -w @altio/web`. For each of the 63 pages it checks: `<html lang dir>` correct, title 10 to 70 characters, description 50 to 200, one canonical equal to the real address, the 3 hreflang plus x-default, exactly one `<h1>`, every `<img>` has `alt`, Open Graph and Twitter tags, the social image file exists, JSON-LD is valid JSON, every internal link points to a real file, no duplicate titles or descriptions per language, the sitemap lists every page and only real pages, robots.txt points to the sitemap. It exits with 1 on any problem and runs in CI and in `build:release`.

## What is not in the code (owner tasks)
Google Search Console and Bing submission, Google Business Profile with the same name/address/phone, real reviews. See `docs/OWNER-CHECKLIST.md`.

## Measured
Lighthouse SEO 100 on all tested pages (`npm run lighthouse -w @altio/web`).
