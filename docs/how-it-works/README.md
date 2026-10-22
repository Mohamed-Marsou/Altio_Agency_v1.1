# How the Altio project works (guide)

Written so you can read one page, find the right file, and ask a precise question.
Paths are relative to `apps/web/src` unless they start with `apps/`, `docs/` or `.github/`.

## The whole thing in one picture

```
Visitor                         You (admin)                      Later
   |                                |                              |
   v                                v                              v
 static website  <--- JSON ---  dashboard (/admindash)  --->  backend API + MySQL
 /en  /fr  /ar                  (works in `npm run dev`)       (apps/api, not connected yet)
   |
   +-- forms open WhatsApp (or email)
```

- The **public site** is a static export: plain HTML files, no server. It lives on Hostinger.
- All the **text** is in JSON files (`content/en`, `content/fr`, `content/ar`).
- The **dashboard** edits those JSON files (blog, projects, pictures). Today it works only while you run `npm run dev` on your computer, because a static site has no server to save files.
- The **backend** (`apps/api`) is a skeleton with the database design. It is the next phase.

## Read in this order

| File | Topic | Ask me about |
|---|---|---|
| [01-project-map.md](01-project-map.md) | Folders, commands, tools | "where is X?", "what does npm run ... do?" |
| [02-languages.md](02-languages.md) | English, French, Arabic, right-to-left | translations, routes, language switch, Arabic font |
| [03-business-data.md](03-business-data.md) | Phone, email, placeholders, release checks | changing the phone, why the release build stops |
| [04-forms.md](04-forms.md) | Contact, free design, referral forms | validation, phone formats, spam guard, WhatsApp |
| [05-seo.md](05-seo.md) | Titles, sitemap, hreflang, structured data | Google, social cards, SEO lint |
| [06-design-and-accessibility.md](06-design-and-accessibility.md) | Styles, themes, loader, contrast, speed | colours, dark mode, Lighthouse |
| [07-dashboard.md](07-dashboard.md) | Admin: blog, projects, media CRUD | how saving works, WebP conversion, limits |
| [08-error-log-and-audit.md](08-error-log-and-audit.md) | The error logger and Audit log page | the txt file, what is recorded |
| [09-testing.md](09-testing.md) | Unit, browser, visual, Lighthouse, CI | what each test protects |
| [10-build-and-deploy.md](10-build-and-deploy.md) | Static build, .htaccess, workflows | upload, rollback, environment variables |
| [11-backend.md](11-backend.md) | Express API and database schema | what exists, what is planned |
| [12-faq-and-limits.md](12-faq-and-limits.md) | Cheat sheet and known limits | "why does it do that?" |
| [13-dashboard-login-and-privacy.md](13-dashboard-login-and-privacy.md) | Dashboard password and search-engine privacy | login, `.env`, noindex |

Other documents: `docs/finalFE.md` and `docs/finalBE.md` (the plans), `docs/OWNER-CHECKLIST.md` (what is needed to go live), `docs/DEPLOY.md`, `docs/content-audit.md` (claims to verify).

## Words used in this guide

- **Locale**: a language, here `en`, `fr` or `ar`.
- **Slug**: the address part of a post or project (`/blog/design-before-build/`).
- **Static export**: Next.js writes finished HTML files into `apps/web/out`.
- **Dev API**: the small server that runs inside `npm run dev` so the dashboard can save.
- **Placeholder**: a fake value (fake phone) that must be replaced before launch.
- **RTL**: right to left, how Arabic is written.
