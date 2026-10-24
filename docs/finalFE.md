# finalFE: Public Website, Final Plan

Goal: make the public site **fully functional and launch-ready for real visitors**: three languages (English, French, Arabic with right-to-left), real contact data, working validated forms, SEO, accessibility, speed, automated tests, and a live deployment on Hostinger as a **static site**.

Order of the whole project: **1) this document (front end first, then go live), 2) backend (`finalBE.md`), 3) backend deployment.** Until the backend exists, live updates are made by changing code and redeploying.

Everything the owner must do by hand (real data, text approval, visual checks) is collected at the very end under **"Owner tasks"**, so the coding and automated testing can be done first.

---

## 0. Where we are today

| Area | State |
|---|---|
| Pages | Home, Services, Work + 4 case studies, Blog + posts, About, Contact, Free design, Referrals, Privacy, Terms, Cookies (redirect), 404, loader, dark mode, mobile menu. All built. |
| Languages | **English only.** All text lives in `src/content/en/*.json`, read by `lib/content.ts`. `next-intl` is installed but **not wired**. |
| Forms | Contact, free design and referral forms open **WhatsApp with a prefilled message** (no server). |
| Contact data | **Placeholders**: `+212 6 00 00 00 00`, `hello@yourdomain.ma`. |
| SEO | Page metadata on 14 files. **No `sitemap.xml`, no `robots.txt`, no hreflang, no structured data, no per-page social images.** |
| Tests | **None.** `lint` and `typecheck` pass. |
| Build | `npm run build:export` works (6.6 MB, 261 files). |
| Known flag | `npm audit` flags the pinned Next 16.2.0 and some dependencies. |
| Sample content | Case studies, testimonials and numbers on the site were written as samples. They must be real or clearly labelled before launch (phase F9). |

---

## 1. Final decisions

| Topic | Decision |
|---|---|
| Hosting | Static export on Hostinger (works on any plan). No server code, no middleware. |
| Languages | **EN, FR, AR.** Arabic is right-to-left. |
| URLs | `/en/...`, `/fr/...`, `/ar/...` (one folder per language, real HTML for each, good for SEO). `/` is a small language-choice page. |
| Default language | Owner decision (see Owner tasks). The code supports any of the three as `x-default`. |
| i18n engine | Keep our own JSON loader (all copy already lives in JSON) and add a `locale` argument. **Remove `next-intl`** unless it saves code in phase F2. Fewer dependencies, smaller bundle. |
| Arabic | Modern Standard Arabic by default, Western digits (0 to 9) as is common in Moroccan business use. Darija is not used for page copy. |
| Forms | Stay WhatsApp-first, with strong validation and spam control. They get a second path (email draft) and are prepared to post to the backend later without redesign. |
| Tests | Vitest + React Testing Library (unit and component), Playwright (end to end, visual snapshots, accessibility), Lighthouse CI (performance and SEO budgets). |
| Quality gate | CI blocks a merge unless lint, typecheck, tests and the static build pass. |

---

## 2. Phases (coding and automated testing, in this order)

### F0. Tooling and safety net (do first)
- Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`.
- Scripts: `test`, `test:watch`, `test:coverage`, `e2e`, `e2e:update` (refresh snapshots), `lighthouse`, `check` (lint + typecheck + test + build:export).
- GitHub Actions workflow: install, `check`, Playwright on the built `out/` folder, Lighthouse CI. Required on every pull request.
- Handle the audit flags: upgrade Next to the current patched 16.x release and other flagged packages, re-run build and tests, keep a note of anything left.
- Add `.editorconfig`, a pre-commit hook (lint-staged) and a secret scan so nothing sensitive is committed.
- **Done when:** one trivial test runs green in CI, and `npm audit` shows no high or critical issue for production dependencies.

### F1. One source of truth for real data
Today contact details are repeated across several JSON files. Make them live **once**.
- `src/content/shared/site.json` holds: brand name, legal name, WhatsApp number (digits only, international format), display phone, email, address and city, opening hours, social links, domain, country.
- Everything else (footer, contact page, forms, JSON-LD, mailto and `wa.me` links, legal pages) reads from that file through one helper `getSite()`.
- A **build-time check script** fails the build if the file still contains placeholders (`yourdomain`, `00 00 00`, `TODO`, `lorem`, `example.`), and in production mode prints exactly which values are missing.
- **Unit tests:** helper output formats (`wa.me` link, `tel:` link, `mailto:`), the placeholder check catches each bad pattern.
- **Done when:** changing the phone in one file updates every page, and the build refuses to ship placeholders.

### F2. Internationalisation architecture (EN, FR, AR) and RTL
1. Routing: move pages under `src/app/[locale]/...` with `generateStaticParams` returning `en`, `fr`, `ar`. The root layout sets `<html lang dir>` per locale (`dir="rtl"` for Arabic).
2. Content: `src/content/{en,fr,ar}/*.json`. `lib/content.ts` loaders take a locale and fall back to English for a missing key **in development with a console warning, and fail the build in production**.
3. Language switcher: in the navbar and footer, keeps the user on the equivalent page. Saves the choice in `localStorage`.
4. Root `/`: static page that redirects to the saved language, else the browser language, else the default, plus a `<noscript>` link list. Hostinger `.htaccess` also maps `/` for crawlers (phase F8).
5. Fonts: add an Arabic font with `next/font` (Noto Sans Arabic or IBM Plex Sans Arabic, `arabic` subset), loaded **only on `/ar`** so EN and FR do not pay for it. Latin fonts stay as is.
6. **RTL layout audit** across all SCSS:
   - replace physical properties with logical ones (`margin-left` becomes `margin-inline-start`, `padding-right` becomes `padding-inline-end`, `left` and `right` become `inset-inline-*`, `text-align: left` becomes `start`);
   - flip directional icons (arrows, chevrons, "next" and "back"), the marquee and slider directions, the blue-outline hover origin, the mobile drawer side, the theme and language buttons order;
   - keep phone numbers, URLs and emails left-to-right inside Arabic text using `<bdi>` or `dir="ltr"`;
   - Arabic needs slightly larger line-height and no letter-spacing, so add a `[dir="rtl"]` token override.
7. Layout resilience for **longer French text** (about 20 to 30 percent longer than English): no fixed widths on buttons, cards and nav items; test every section with French.
8. `Intl` formatting through `lib/format.ts` (dates, numbers, currency) per locale.
9. SEO hooks prepared here (used in F5): per-locale `canonical`, `alternates.languages`.
- **Tests:** loader returns the right file per locale; missing key behaviour; every key in `en` exists in `fr` and `ar` (**parity test**, fails if a translation is missing or has different placeholders); `dir` and `lang` attributes per locale; language switcher keeps the path.
- **Done when:** all pages render in three languages, Arabic is fully mirrored with no overflow at 375 px, and the parity test is green.

### F3. French and Arabic content
- Claude drafts FR and AR files from the English JSON, keeping tone, placeholders and structure identical so the parity test passes.
- Rules: no machine-only legal text (Privacy, Terms, Cookies marked "draft pending review" until the owner approves); no invented facts, only translate; keep the "agency with a team" wording and the decisions already taken (free design in 48 to 72 h, no public prices).
- Each file carries a top-level `_meta` with `status: "draft" | "reviewed"` and `reviewedBy`. A script lists all drafts, and the production build can be set to fail while any public page is still `draft`.
- **Tests:** parity (F2), no leftover English in FR and AR files for key fields (heuristic check), `_meta` present.
- **Done when:** FR and AR exist for every page and the drafts list is the review checklist for the owner.

### F4. Forms: real functionality and validation
Forms: Contact, Free design, Referral (and any newsletter field if present).
- **Shared validation** with Zod, one schema per form in `src/lib/forms/schemas.ts`, with error messages in all three languages.
- Phone: accept `+212`, `00212`, `0` plus 9 digits, with spaces or dashes; normalise to `+212XXXXXXXXX`; also accept other international numbers (clients abroad). Email: standard syntax check. Name and message: trimmed, length limits, no control characters.
- UX: errors under each field (`aria-describedby`, `aria-invalid`), focus moves to the first error, submit disabled while sending, success state, message preserved on error.
- **Spam control without a server:** hidden honeypot field, minimum fill time (a form submitted in under 3 seconds is ignored), simple rate guard in `sessionStorage`.
- **Submission paths:**
  1. Primary: open WhatsApp with the prefilled, URL-encoded message (the message is built in the visitor's language, but the **internal summary line stays English** for the team).
  2. Fallback: "Send by email instead" opens a `mailto:` draft.
  3. Prepared: a `submitLead()` function whose implementation is swapped to `POST /v1/leads` when the backend exists; forms do not change.
- Consent line next to submit that links to the Privacy page.
- Edge cases handled: very long text (WhatsApp URL length limit, truncate with a note), emoji and Arabic characters in the encoded URL, pop-up blockers (fallback link shown), missing JavaScript (a plain link to WhatsApp and the email).
- **Tests:** schema tests for 30+ phone, email and text cases (valid and invalid); component tests (error display, focus, honeypot ignored, fast submit ignored, the exact WhatsApp URL produced for EN, FR and AR); e2e submit on desktop and mobile.
- **Done when:** every form refuses bad input with a clear message in the page language and produces a correct WhatsApp message for good input.

### F5. SEO (technical, per language)
- **Metadata** per page and per locale: unique `title` (50 to 60 characters), `description` (140 to 160), `canonical`, `alternates.languages` for en, fr, ar and `x-default`, Open Graph and Twitter tags, `robots` where needed.
- **`sitemap.xml`** from `app/sitemap.ts` (static, includes every locale, blog posts and case studies, with `alternates`), **`robots.txt`** from `app/robots.ts` (allow all, disallow `/admindash`, point to the sitemap).
- **Structured data (JSON-LD)**: `Organization` and `LocalBusiness` (name, address, phone, hours, geo for Tangier, `areaServed`), `WebSite`, `BreadcrumbList` on inner pages, `Service` on services, `Article` on posts, `FAQPage` on pages with FAQ, `CreativeWork` on case studies. Generated from the F1 data so it cannot disagree with the page.
- **Social images**: one generated `og:image` template per page type and language (1200 by 630), built at build time.
- **Headings and content**: exactly one `h1` per page, logical order, descriptive link text, meaningful `alt` on every image (translated), no empty headings.
- **URLs**: lowercase, hyphenated, trailing slash consistent (already `trailingSlash: true`), friendly slugs per language for blog and case studies.
- **Internal linking**: related posts and related case studies; breadcrumb on deep pages.
- **404** page per language with useful links; `noindex` on it.
- **Performance as SEO** (see F6).
- **Local SEO (code side)**: NAP (name, address, phone) identical everywhere and equal to the JSON-LD; city and service keywords in titles and headings of the relevant pages; map embed deferred until the user interacts.
- **Tests:** a build-time **SEO lint script** that walks `out/` and fails on: missing or duplicate title or description, title or description length out of range, no canonical, missing hreflang pair, more than one `h1`, image without `alt`, broken internal link, page missing from the sitemap, sitemap URL that does not exist, JSON-LD that does not parse. Unit tests for the metadata builders.
- **Done when:** the SEO lint passes on all three languages and a Lighthouse SEO score of **95 or more** on every page type.

### F6. Accessibility and performance
**Accessibility (WCAG 2.2 AA target)**
- Skip link, landmarks, keyboard order, visible focus ring on everything, focus trap and return in the mobile menu, `Escape` closes overlays.
- Colour contrast checked in light and dark (and the blue-outline states), `prefers-reduced-motion` respected by loader, reveal animations, marquee and custom cursor, custom cursor never hides the real one for keyboard or touch users.
- Forms: labels, errors, autocomplete attributes (`name`, `tel`, `email`).
- Language of parts: `lang` on inline foreign text.
- `@axe-core/playwright` runs on every page in every language and fails on serious or critical issues.

**Performance budgets (mobile, throttled)**
- LCP under 2.5 s, CLS under 0.1, INP under 200 ms, Lighthouse performance 90 or more.
- Images: serve responsive `srcset`, WebP or AVIF, explicit width and height, `loading="lazy"` below the fold, priority only for the hero.
- Static export has no image optimizer (`unoptimized: true`), so **optimize images at build time** with a script (sharp): generate 480, 960, 1600 widths and WebP, write them next to the originals, fail the build if an image exceeds 200 KB.
- Fonts: subset, `display: swap`, preload only the first-paint weights. Arabic font only on `/ar`.
- JavaScript: check bundle with `next build` output; lazy load below-the-fold sections and the custom cursor; no unused libraries (remove `next-themes` if the custom theme script replaces it, remove `next-intl` if unused).
- Loader: must never delay content by more than the real paint (existing 8 s failsafe stays); verify it does not hurt LCP.
- **Tests:** Lighthouse CI assertions (performance, accessibility, SEO, best practices at 90 or more) on home, services, one case study, blog post, contact in each language; bundle-size check in CI.
- **Done when:** budgets pass in CI on the production build.

### F7. Automated test suite (what gets written)
| Level | What | Tool |
|---|---|---|
| Unit | `lib/content` loaders, `lib/format`, `lib/theme`, `lib/chart`, form schemas, phone normaliser, `getSite()`, WhatsApp URL builder, SEO metadata builders, locale utilities | Vitest |
| Component | Navbar (open and close, keyboard, language switch), ThemeToggle (flips `data-theme`, saves choice, handles blocked storage), forms (all states), Faq (open and close, keyboard), Work filters, Blog list and share, CTA buttons (correct hrefs), Footer (data from `getSite()`), PublicOnly (hidden on `/admindash`) | RTL + user-event |
| Content integrity | JSON schema per file, parity across locales, no empty strings, every image path exists, every internal link resolves | Vitest script |
| End to end | Home to Free design to submit; language switch on every page; dark mode persists; mobile menu; blog open and share; case study navigation; 404; `/admindash` has no footer, loader or cursor | Playwright (desktop Chrome, Firefox, WebKit, Pixel 5, iPhone 13) |
| Visual regression | Screenshots of each page type in light, dark, EN, FR, AR, at 375, 768 and 1280 px; diff threshold small and reviewed on change | Playwright snapshots |
| Accessibility | axe on all pages | Playwright + axe |
| Performance and SEO | Lighthouse CI budgets | LHCI |
| Link and sitemap | Crawl `out/`, check every link and sitemap entry | Node script |

Coverage targets: libraries 90 percent, components 70 percent. Snapshot updates need a reviewer's approval.

### F8. Build, deploy and hosting configuration (static on Hostinger)
- `build:export` produces `out/`. A GitHub Actions workflow builds, runs the quality gate, then uploads `out/` to `public_html` (FTP or SSH, credentials in repository secrets, never in code). Keep the previous release folder for a one-step rollback.
- `.htaccess` (Apache or LiteSpeed on Hostinger), shipped in `public/`:
  - force HTTPS and one hostname (www or non-www, same as the canonical);
  - trailing-slash consistency;
  - `/` handling and a custom 404 per language;
  - long cache for hashed assets (`_next/static`, 1 year, immutable), short cache for HTML;
  - Brotli or gzip on;
  - security headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a CSP appropriate for a static site;
  - block `/admindash` from search (header `X-Robots-Tag: noindex`) until the backend is live.
- The `/admindash` page is built but **not linked** and can be excluded from the public upload until the backend is ready (simplest: exclude from the deploy step).
- Smoke test after each deploy (script): home returns 200 in three languages, sitemap and robots exist, one case study, 404 returns 404, HTTP redirects to HTTPS.
- Privacy by default: no analytics, no third-party scripts, no cookies set, so no cookie banner is needed at launch (the Cookies page states exactly that). When analytics arrive with the backend, the banner decision is revisited.
- **Done when:** a push to `main` deploys a tested build, and the smoke test passes against the live domain.

### F9. Content and claims audit (Claude prepares, the owner decides)
Claude scans every text and builds a **table of every factual claim** and every placeholder in all three languages, with file, key and status:
- numbers and timelines ("48 to 72 h", years, percentages, client counts, speed claims);
- case studies, testimonials, client names and logos (are they real, with permission, or concept pieces);
- team, location, hours, social links, awards, guarantees, "agency with a team" wording consistency;
- legal text accuracy against the actual practices (what data forms collect, WhatsApp as processor, no cookies);
- tone and spelling pass (EN, FR, AR), consistent brand terms, no fabricated statistics.
Output: `docs/content-audit.md` with columns **Claim | Where | Evidence needed | Action (keep, change, remove, label as concept)**. Items marked "label as concept" get a visible "concept project" label in code.
- **Tests:** a script flags any number followed by a unit or percent that is not in the approved list, so new unreviewed claims fail the check.

---

## 3. Order and dependencies

```
F0 tooling ──► F1 real-data source ──► F2 i18n + RTL ──► F3 FR/AR content
                         │                    │
                         ├──────────► F4 forms (needs F1, F2)
                         └──────────► F5 SEO (needs F1, F2)
F6 accessibility and speed runs alongside F2 to F5
F7 test suite grows with every phase (a phase is not done without its tests)
F8 deploy config can start after F0, goes live after F2 to F6 pass
F9 audit starts after F3, finishes before launch
```

Launch condition: F0 to F9 green **and** every "Owner task" below signed.

---

## 4. Definition of done (public site)

- Three languages, Arabic mirrored correctly, parity test green.
- No placeholder anywhere (build enforces it).
- Forms validate, resist basic spam and produce correct WhatsApp and email messages in each language.
- SEO lint green, sitemap and robots live, structured data valid, Lighthouse 90 or more (SEO 95 or more) on all page types.
- axe finds no serious issue; keyboard-only navigation works everywhere.
- CI green; production deploy is automatic and has a rollback; smoke test passes.
- Content audit table has no open item.

---

## Owner tasks (done by the team, last, after the code and automated tests are green)

**A. Real data (needed for phase F1; give these early so the code can use them)**
1. Real **WhatsApp number** (and the display format you want) and **business email address**.
2. Final **domain name** and whether `www` or non-www is primary.
3. Real **address or city and service area**, opening hours, and whether the exact address is shown publicly.
4. **Social links** you want shown (or none).
5. Legal details for the Privacy and Terms pages (legal name, registration number, what is true about data handling).

**B. Decisions**
6. **Default language** of the site and what `/` should show.
7. **Arabic style**: confirm Modern Standard Arabic and Western digits.
8. Which case studies and testimonials are **real**; for the rest choose "remove" or "label as concept".
9. Whether to show any **prices or ranges** (current decision: no public prices).

**C. Review and approve text (using `docs/content-audit.md` and the draft list)**
10. Read every **English** page and approve or correct the wording and the claims.
11. Have a fluent **French** reader review all French files and set `status: "reviewed"`.
12. Have a fluent **Arabic** reader review all Arabic files (grammar, tone, culture, numbers) and set `status: "reviewed"`.
13. Get a **legal review** of Privacy, Terms and Cookies in the languages you publish.

**D. Visual and manual testing (visual checks that a computer cannot judge)**
14. Go through **every page in light and dark, in EN, FR and AR**, on a **real phone** and a desktop browser: spacing, alignment, mirrored layout in Arabic, long French text not breaking, images sharp, colours on brand.
15. Approve or reject the **visual snapshot changes** produced by Playwright.
16. Submit **each form** with real data on your own phone and confirm the WhatsApp message arrives readable in the right language; also test with a bad number and an empty field.
17. Click **every phone, email and WhatsApp link** on every page.
18. Test with a **slow connection** (phone on mobile data) and confirm the site feels fast.
19. Check the site in **Safari on iPhone** and **Chrome on Android** and one older phone if available.

**E. Accounts and launch**
20. Create or confirm **Google Search Console** and **Bing Webmaster** for the domain, submit `sitemap.xml`, request indexing of the home page in each language.
21. Create or claim the **Google Business Profile** (same name, address, phone as the site).
22. Provide the **Hostinger FTP or SSH details** as repository secrets (not in chat).
23. Final **go-live sign-off** after the smoke test, then check the live site once from a phone.
