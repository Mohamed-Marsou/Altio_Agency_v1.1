# Altio Admin Dashboard: README (Phase 1, low-budget plan)

Status: plan, not built yet. Only the `/admindash` Overview screen exists, with sample data.
Written 2026-10-21 after checking Hostinger's own documentation.

---

## 1. The goal in one paragraph

A **safe, admin-only dashboard** where the team can **add, edit, publish and delete blog posts and projects** (English and French), **upload images that are optimized automatically**, and **see how the website is performing**. It has to cost **0 MAD extra** and keep the Hostinger plan nearly empty, because WordPress and another Next.js site share that plan.

Everything else in the sidebar (leads, referrals, payments, testimonials, FAQ, users and roles, settings, audit view) stays **"Soon"** until there is budget.

---

## 2. Hosting research: what Hostinger Premium can and cannot do

Checked on Hostinger's official support pages (links at the bottom).

| Question | Answer for **Premium Web Hosting** |
|---|---|
| Can it run Node.js apps (Express)? | **No.** Hostinger's limits table says "Not available". Node.js web apps are only on **Business** (5 apps) and **Cloud** plans (10 apps). |
| Which database? | **MySQL only**: 10 databases, 3 GB each at most, InnoDB only. |
| PostgreSQL? | **No** (VPS only). |
| MongoDB or Redis? | **No** (VPS only). |
| MariaDB or SQLite? | Not mentioned in the docs. Do not rely on them. |
| Storage and file count | 20 GB disk and 400,000 inodes (file count), **shared with WordPress and the other Next.js site**. |
| Server | 2 GB RAM, 1 CPU core, 40 PHP workers. |
| PHP | Yes. This is what the plan is built for. |

**About Yassine's setup:** Node.js plus MySQL on Hostinger is real, but according to their docs it needs a **Business or Cloud** plan. It does not work on Premium. Ask Yassine which plan he is on. If he is on Business, that explains it. If he says it runs on Premium, ask him to show the hPanel "Node.js" section, because the official table says it should not exist there. Our old memory note ("Premium = static only") is therefore **confirmed**.

Conclusion: **we cannot run the Express API on our current Hostinger plan.** The rest of this document is the plan that works anyway.

---

## 3. Architecture options

| | Option A (recommended): Split, all free | Option B: PHP API on Hostinger | Option C: Upgrade to Business |
|---|---|---|---|
| Public website | Static files on Hostinger | Static files on Hostinger | Static files on Hostinger |
| API | Express on a **free Node host** | PHP (rewrite of the planned API) | Express **on Hostinger** |
| Database | Free Postgres (Neon or Supabase) | Hostinger MySQL (10 DBs, 3 GB) | Hostinger MySQL |
| Images | Free object storage (Cloudflare R2) | Hostinger disk | Hostinger disk or R2 |
| Extra cost | 0 | 0 | Business plan price |
| Reuses the Express and Prisma work done | Yes, fully | No, API rewritten | Yes (Prisma switched to MySQL) |
| Risks | Free tiers can change. Cold start of about 30 to 60 s after idle on some free hosts. | Slower to build, different language from the rest of the stack. | Costs money. |

### Why Option A

- It reuses the work already done (`apps/api`, `schema.prisma`).
- The Hostinger plan only ever holds **static files, about 6.6 MB across 261 files today**, so we do not touch storage or the file-count limit.
- If money appears later, moving the API to Hostinger Business is a small change. The code stays the same, and only the database provider in Prisma changes from `postgresql` to `mysql`.

**Free-tier facts I could verify (check again before launch, they change):**
- Supabase free: 500 MB database, 1 GB files, **projects pause after 1 week of no activity**.
- Neon free: scale-to-zero after 5 minutes idle, wakes in under a second, **does not delete data** when limits are hit. Storage is reported as 0.5 GB or 1 GB depending on the source, so confirm on Neon's pricing page.
- **Not verified:** the exact free terms of Render (sleep behavior) and Cloudflare R2 (10 GB). Confirm both on their pricing pages before relying on them.

**Recommended free pieces:** Neon for the database (does not pause), Cloudflare R2 for images, and any free Node host that supports a **custom domain** for the API (see the cookie rule in section 6).

---

## 4. How a blog post reaches the public site (the important design choice)

The public site is a **static export**: plain HTML files. A new post saved in the dashboard is not on the site until the site is rebuilt. Two ways to solve it:

1. **Public pages ask the API at runtime.** Easy, but search engines see an empty page. Bad for a blog.
2. **Publish triggers a rebuild (recommended).** The "Publish" button in the dashboard calls the API. The API starts a free **GitHub Actions** workflow that builds the site from the API's content and uploads the new files to Hostinger by FTP or SSH. It takes about 2 to 3 minutes, produces real HTML for Google, and costs nothing.

So the dashboard shows two states on every item: **Saved** (in the database) and **Live** (included in the last deploy), plus a "Publishing... done" indicator.

---

## 5. Phase 1 features

### 5.1 Content: blog posts and projects (full CRUD)

| Action | Details |
|---|---|
| **Create** | Title, slug (auto and editable), summary, body, cover image, gallery, category, tags, language versions EN and FR, SEO title and description. |
| **Read** | List with search, filter (status, category, language), sort, pagination (20 per page). |
| **Update** | Same form. **Autosave** of drafts every 10 s. Conflict warning if two admins edit the same item. |
| **Delete** | **Soft delete** into a Trash (`deletedAt` in the schema). Restore for 30 days, then purge. Confirm dialog. |
| **Status** | Draft, Scheduled (publish at date and time), Published. |
| **Preview** | "Preview" opens the real page layout with the unsaved content before publishing. |
| **Editor** | Rich text (headings, lists, links, quotes, images, code). Stored as Markdown or JSON. Never raw HTML from users (see security). |
| **Projects extras** | Client, category, stack tags, result figures, gallery order by drag and drop, "vibe" colour, link to live site. |
| **Order** | Drag to reorder featured projects on the home page. |
| **Validation** | Every field checked on the server with Zod. Errors come back as `{ error: { code, message, fields } }` and are shown under the field. |

### 5.2 Media: upload and automatic optimization

Goal: **every image is small by default** so the site stays light.

1. Admin drops one or many images (drag and drop, or camera on mobile).
2. The **server** (not the browser) checks it:
   - real file type from the **file's bytes**, not the extension; only JPEG, PNG, WebP, AVIF (SVG refused);
   - max 10 MB upload, max 6000 px side;
   - strips EXIF data (removes GPS location from phone photos).
3. Optimization with **sharp**:
   - resize to **3 widths** (480, 960, 1600 px), never bigger than the original;
   - convert to **WebP** (AVIF later), quality about 78;
   - generate a tiny blurred placeholder (data string) for smooth loading;
   - target: **under 150 KB for a full-width image**.
4. Stored in **R2** (not on Hostinger). The database keeps one row per image (`Media`) with width, height, size, alt text per language (`MediaI18n`), and the 3 variant URLs.
5. **Alt text is required** (accessibility and SEO). The dashboard flags missing alt text.
6. **Media library**: grid, search, "used in" list, replace file, delete (blocked if used, unless forced).

Why this saves space: 3 WebP files of about 40, 90 and 140 KB replace one 4 MB phone photo, and none of it sits on the Hostinger disk.

### 5.3 Analytics (see section 7)

Overview shows visitors, top pages, sources, countries, devices, and the free-design form conversion.

### 5.4 Authentication and security (see section 6)

### 5.5 Overview page

The Overview already built shows leads, tasks and payments with sample data. Those blocks belong to later phases, so in phase 1 they change to:
- **Content**: drafts waiting, scheduled posts, last published, items missing alt text or SEO fields.
- **Traffic**: the analytics block.
- **Deploy**: status of the last publish and a manual "Rebuild site" button.
- Lead, referral and payment blocks are hidden until their pages exist.

### 5.6 Phase 1 pages in the sidebar

| Page | Phase 1 |
|---|---|
| Overview | Yes |
| Blog | Yes |
| Projects | Yes |
| Media | Yes |
| Analytics | Yes |
| Admins and security (profile, password, 2FA, sessions) | Yes (small) |
| Leads, Referrals, Payments | Soon |
| Services and packs, Testimonials, FAQ | Soon (stay as JSON files in the repo) |
| Users and roles, Settings, Audit log | Soon (the audit log is **recorded** from day one, just not shown) |

---

## 6. Authentication and security

**Who can log in:** admins only. There is **one role (ADMIN)** for now. The `Role` enum stays in the schema and every route goes through a role check, so adding an Editor role later is a one-line change.

| Topic | Rule |
|---|---|
| Accounts | **Invite only.** No public sign-up. The first admin is created by a one-time script, then admins invite admins (`Invite` table, link valid 48 h, single use). |
| Passwords | Hashed with **argon2id**. Minimum 12 characters, checked against common passwords. Never logged, never returned by the API. |
| Sessions | Short **access token** (15 min) kept in memory. **Refresh token** (7 days) in an **httpOnly, Secure, SameSite cookie**, rotated at every use. |
| Token theft | Refresh tokens are grouped in families (`RefreshToken`). If an old token is used again, the **whole family is revoked** and the admin must log in again. |
| Same-site cookie rule | The API must live on a **subdomain of our own domain** (e.g. `api.altio.ma`), not on the free host's default address. Otherwise browsers block the login cookie. Free hosts that allow custom domains are required. |
| Brute force | Rate limit on login (5 attempts per 15 min per IP and per email), then a temporary lock. Same generic message whether the email exists or not. |
| 2FA (extra) | Optional **TOTP** (Google Authenticator or similar) with 10 recovery codes. Recommended to be mandatory for the owner. |
| Password reset | One-time link by email, 30 min, then all sessions are revoked. Email through Hostinger's mailbox SMTP if the plan includes one, otherwise a free transactional email tier (confirm limits). |
| Sessions page | List of devices, "log out everywhere". |
| CORS | Allow-list: the site and admin domains only, with credentials. |
| Headers | helmet defaults, strict Content-Security-Policy on `/admindash`. |
| Admin pages | `noindex, nofollow` (already in `page.tsx`), `robots.txt` disallow, no links from the public site. |
| Input | Zod on every request; Prisma parameters (no SQL injection); body size limits. |
| Rich text | Stored as Markdown or a safe JSON tree and rendered by our code. No raw HTML, so no XSS from the editor. |
| Uploads | Type from bytes, size limits, re-encoded by sharp (a re-encoded image cannot carry a hidden script). |
| Audit log | Every create, update, delete, login, failed login and permission change goes into `AuditLog` (who, what, when, IP hash). |
| Secrets | Only in environment variables on the host. `.env` is never committed. Rotating a secret does not need a code change. |
| Backups | Free-tier Postgres has limited backups, so a **weekly `pg_dump` by GitHub Actions** to a private R2 bucket. Test a restore once. |

---

## 7. Analytics: two layers

### Layer 1 (core): our own minimal, privacy-friendly collection

Works even if Google Analytics is not available. Uses tables already in the schema (`AnalyticsEvent`, `AnalyticsDaily`).

**What we collect (and nothing else):**
- page path, referrer domain, UTM campaign, language
- country (from the request's country header, no IP lookup), device type, browser family
- events: `page_view`, `cta_click`, `free_design_form_submit`, `whatsapp_click`
- a **daily rotating hash** for unique visitors (no cookie, no IP stored, cannot track a person across days)

**What we do not collect:** names, emails, phone numbers, full IP, any persistent ID. With this design a cookie banner is not needed for it. Confirm with Moroccan data-protection rules (Law 09-08, CNDP) before launch.

**Storage control (keeps the database tiny):**
- raw events are kept **30 days**, then a nightly job rolls them into `AnalyticsDaily` and deletes the raw rows;
- roughly 1,000 visits per day is about 3,000 events per day, about 1 MB per day before rollup, so the free 0.5 to 1 GB database is far from full;
- bots are filtered (known user agents, and no JavaScript means no count).

**How the site sends data:** a tiny script (under 1 KB) uses `navigator.sendBeacon` to `POST /v1/collect`. That endpoint is rate-limited and accepts only a fixed list of event names.

### Layer 2 (optional): Google Analytics 4 inside the dashboard

**Possible and free**, with caveats:
- The **GA4 Data API** is free. The standard quota is about 200,000 tokens per property per day and 40,000 per hour, shared by everything that reads that property (figures from third-party sources dated 2022 to 2023, so check the Google Cloud quota page).
- The API reads GA4 through a **service account** added as a viewer on the property. The key lives only in the API's environment variables.
- The API **caches the answer for 1 hour**, so the quota is never an issue for a small team.
- Showing GA in the dashboard does not remove the need for a **cookie consent banner** on the public site, since GA sets cookies. If that is not wanted, use Layer 1 only.

**Recommendation:** ship **Layer 1 first** (full control, no banner), add Layer 2 only if the owner wants Google's audience reports.

**Dashboard shows:** visitors and page views (7 / 30 days, with change versus the previous period), top pages, top sources, countries, devices, top blog posts and projects, free-design form conversion rate.

---

## 8. Storage budget (what lives where)

| Item | Where | Size today / target |
|---|---|---|
| Static site (HTML, JS, CSS) | Hostinger | **6.6 MB, 261 files today**. Expect 15 to 30 MB with content. |
| Images | Cloudflare R2 (free tier) | About 3 variants of 40 to 150 KB each |
| Database | Neon or Supabase (free) | Well under 100 MB in year one |
| Raw analytics | Database, 30 days only | About 30 MB at 1,000 visits per day |
| Backups | Private R2 bucket | A few MB per week |
| API runtime | Free Node host | Nothing on Hostinger |

Hostinger plan impact: **about 30 MB of 20 GB and a few hundred files out of 400,000.** The shared WordPress and Next.js sites are not affected.

---

## 9. API plan (extends `apps/api`)

Layers: `routes → controller → service → repo (Prisma)`. No database call inside a controller. Base path `/v1`.

| Area | Endpoints (admin = needs login) |
|---|---|
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/accept-invite`, `/auth/forgot`, `/auth/reset`, `/auth/2fa/*`, `GET /auth/sessions` |
| Posts | `GET/POST /admin/posts`, `GET/PATCH/DELETE /admin/posts/:id`, `POST /admin/posts/:id/restore` |
| Projects | same shape under `/admin/projects` |
| Categories | `/admin/categories` |
| Media | `POST /admin/media` (upload and optimize), `GET /admin/media`, `PATCH/DELETE /admin/media/:id` |
| Analytics | `POST /collect` (public), `GET /admin/analytics/overview`, `/pages`, `/sources` |
| Deploy | `POST /admin/deploy` (start rebuild), `GET /admin/deploy/status` |
| Public (for the build only) | `GET /public/posts`, `/public/projects` (published items, **never** internal prices) |
| Health | `GET /health` (exists) |

The build job reads the public endpoints (or a signed export), so the public site never depends on the API being awake when a visitor arrives.

---

## 10. Dashboard UI rules

- **Mobile first.** Touch targets of at least 44 px, a drawer menu on phones, tables become cards under 768 px.
- Light and dark mode (done).
- Function over animation. Reduced motion respected.
- Every list has loading, empty and error states. Every destructive action has a confirm step and an undo or trash.
- Unsaved changes warning when leaving a form.
- Keyboard accessible, visible focus ring, labels on every field.
- The dashboard is a **client-side app** inside the static export. It calls the API with `fetch`, so it needs no Next.js server.

---

## 11. Build order

| Step | What | Done when |
|---|---|---|
| 0 | Decide the hosting option (section 3) and ask Yassine which plan he uses | Owner signs off |
| 1 | Deploy the empty API on a free host with a custom `api.` domain, connect Neon, run `db:migrate` | `GET /v1/health` answers over HTTPS |
| 2 | Auth: first-admin script, login, refresh rotation, rate limit, `/me`, login screen | Can log in, wrong password locks, refresh works |
| 3 | Media: upload, validate, sharp variants, R2, library page | A 4 MB photo becomes 3 WebP files under 150 KB |
| 4 | Posts CRUD plus editor, trash, preview | Create, edit, publish, delete, restore |
| 5 | Projects CRUD | Same as posts plus gallery order |
| 6 | Publish pipeline (GitHub Actions to Hostinger) | Publish shows on the live site in about 3 minutes |
| 7 | Analytics Layer 1: collect, rollup, charts | Overview shows real numbers |
| 8 | 2FA, sessions page, audit recording, backups job | A restore test passes |
| 9 | (Optional) GA4 Data API layer | Numbers match GA within a few percent |

---

## 12. Things we need from the owner

1. Choice of Option A, B or C (section 3).
2. Yassine's plan name (Premium, Business, Cloud) and a screenshot of the hPanel Node.js section.
3. The domain for the API subdomain, and whether DNS is on Hostinger.
4. Admin emails to invite.
5. Cookie-banner decision (own analytics only, or GA4 too).
6. Whether Hostinger's mailbox SMTP can be used for invite and reset emails.

---

## 13. Known limits of this plan

- Free tiers can change or sleep. A free Node host may take 30 to 60 s to wake after idle, which only affects the dashboard, **never the public site**.
- A publish is not instant (about 3 minutes).
- Free Postgres backups are limited, so we add our own weekly dump.
- Without an Editor role, every admin can do everything. Add roles when the team grows.

---

## Sources

- Hostinger, [Parameters and limits of hosting plans](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
- Hostinger, [Which databases and data tools are supported](https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/)
- Hostinger, [How to add a Node.js web app](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- Hostinger, [Node.js hosting launch](https://www.hostinger.com/blog/nodejs-hosting-launch/)
- Neon, [Neon vs Supabase free plan](https://neon.com/guides/neon-vs-supabase-free-plan)
- MakerKit, [Supabase pricing in 2026](https://makerkit.dev/blog/saas/supabase-pricing)
- Whatagraph, [GA4 API limits](https://whatagraph.com/blog/articles/google-analytics-4-api-limits)
