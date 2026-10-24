# 01. Project map, commands and tools

## Repository layout (a "monorepo": two apps in one repository)

```
Altio_Agency_v1.1/
  apps/
    web/            the website + dashboard (Next.js)      <- almost all the work
    api/            the backend skeleton (Express + Prisma)
  docs/             plans and guides (you are here)
  .github/workflows ci.yml (checks) and deploy.yml (upload to Hostinger)
  package.json      root commands that call the apps
```

### Inside `apps/web`

```
src/
  app/
    (root)/          "/" : the language chooser page
    (site)/[locale]/ every public page, one copy per language (/en, /fr, /ar)
    (admin)/admindash/ the dashboard pages
    fonts.ts, globals.scss, sitemap.ts, robots.ts, global-not-found.tsx
  components/
    layout/          Navbar, Footer
    sections/        one folder per page section (Hero, Packs, Faq, BlogPage, WorkPage...)
    ui/              small reusable parts (Button, Tooltip, LocaleLink, CoverImage, SiteLoader...)
    admin/           the dashboard screens
    system/          ErrorBoundary, ErrorReporter, JsonLd, PageSchema
  content/           ALL the text: en/, fr/, ar/ and shared/ (business data, media list)
  lib/               logic without screens (content loaders, forms, seo, admin, logger, i18n)
  styles/            design tokens, reset, typography, vibes
  instrumentation.ts starts the dev-only server (error logger + dashboard API)
scripts/             command-line tools (checks, audits, images, smoke test)
e2e/                 browser tests (Playwright) and their screenshots
public/              files copied as they are (logo, social cards, .htaccess)
```

The two routing groups `(site)` and `(admin)` have their **own `<html>`**: that is why the dashboard has no footer, loader or custom cursor, and why each public page can have `lang` and `dir` for its language.

## Commands (run from the project root)

| Command | Meaning |
|---|---|
| `npm run dev` | Site + dashboard on http://localhost:3000 and the dev server on port 4001 |
| `npm run build:export` | Build the static site into `apps/web/out` |
| `npm run build:release` | Strict build: placeholders and unreviewed texts stop it |
| `npm run check` | lint + types + unit tests + build + SEO lint |
| `npm run test` | Unit and component tests |
| `npm run e2e` | Browser tests of the built site |
| `npm run e2e:admin` | Browser tests of the dashboard (restores content after) |
| `npm run lighthouse -w @altio/web` | Speed and quality scores |
| `npm run claims -w @altio/web` | Rewrites `docs/content-audit.md` |
| `npm run og -w @altio/web` | Redraws the social share images |

## Main tools and why

| Tool | Used for | Where |
|---|---|---|
| Next.js 16 (App Router) | pages, static export | `next.config.ts` |
| React 19 + TypeScript (strict) | components, types | everywhere |
| SCSS modules | styles, one file per component | `*.module.scss`, `styles/` |
| Zod | rules for forms and dashboard data | `lib/forms/schemas.ts`, `lib/admin/schemas.ts` |
| sharp | pictures to WebP | `lib/admin/mediaPipeline.ts`, `scripts/` |
| lucide-react | icons | components |
| Vitest + Testing Library | unit and component tests | `*.test.ts(x)` |
| Playwright + axe | browser, accessibility, screenshots | `e2e/` |
| Lighthouse | speed score | `scripts/lighthouse.mjs` |
| Express 5 + Prisma | backend (skeleton) | `apps/api` |

Removed because unused: `next-intl`, `next-themes`.
