# finalBE: Backend and Admin Dashboard, Final Plan

Replaces the hosting section of `ADMIN-DASHBOARD.md`. Decision taken by the owner: **Node.js + Express + MySQL**.
Scope of this document: take the backend from today's skeleton to a **fully working system on a local machine** (database, seed, CRUD, auth, uploads, analytics, admin screens, tests). Deployment comes last.

Work order of the whole project: **1) finish the public front end and put it live (see `finalFE.md`), 2) build this backend locally, 3) deploy it.** Until step 3, the live site is updated by editing code.

Items that only the owner can do are collected at the very end under **"Owner tasks"**.

---

## 0. Where we are today

| Part | State |
|---|---|
| `apps/api` | Express 5 + TypeScript skeleton: env validation (Zod), helmet, CORS allow-list, request id, one error shape, `GET /v1/health`, graceful shutdown. |
| `prisma/schema.prisma` | Full schema written for **PostgreSQL**. It must be adapted to MySQL (section 2). |
| `/admindash` | Overview screen with **sample data**, light and dark, mobile drawer, sidebar listing every page (only Overview built). |
| Tests | None yet. |

---

## 1. Final decisions

| Topic | Decision |
|---|---|
| Runtime | Node.js 22, Express 5, TypeScript strict, ESM. |
| Database | **MySQL 8** (InnoDB, `utf8mb4`) through **Prisma 6**. |
| Hosting target | Hostinger **Business** (or Cloud) Node.js web app + its MySQL. Premium cannot run Node.js (Hostinger limits page: "Not available"). |
| Admins | Only the **ADMIN** role now. The `Role` enum and a role check on every route stay, so more roles are cheap later. |
| Languages | **EN, FR, AR** (the schema has EN and FR; Arabic is added, section 2). |
| Public site | Stays a **static export**. Content published in the dashboard reaches the site through a rebuild (section 9). |
| Images | Stored on disk behind a `StorageDriver` interface (local folder now, other drivers possible later). Optimized with `sharp` at upload. |
| Analytics | First-party, cookie-free, minimal (section 8). Google Analytics 4 is an optional extra. |
| Tests | Vitest + Supertest, real MySQL test database, coverage gates (section 11). |
| Hosting details to confirm | Business plan's RAM, process and inode limits, SSH access and Node build options are **not in the pages I could read**. Confirm in hPanel before step 14. |

---

## 2. Schema changes needed for MySQL

The current schema uses a few PostgreSQL-only features. Change them **once, now**, then recreate the first migration.

| Today (PostgreSQL) | Change for MySQL |
|---|---|
| `provider = "postgresql"` | `provider = "mysql"` |
| `@db.Uuid` on every id and foreign key | Remove it. Use `String @id @default(uuid()) @db.Char(36)` for ids and foreign keys (fixed width keeps indexes small). |
| `String[]` (`Project.stack`, `Post.tags`, `Pack.features`, `Service.features`) | Not supported on MySQL. Use `Json` (array of strings), validated by Zod. Tags needing a filter later get their own table. |
| `Json` | Supported on MySQL 8. Keep. |
| Long text (`body`, summaries) | Add `@db.Text` or `@db.MediumText` explicitly, because Prisma maps `String` to `VARCHAR(191)`. |
| Case sensitivity | MySQL's default collation is case-insensitive, which is good for unique emails and slugs. Do not use `mode: "insensitive"` (not supported on MySQL). |
| `Decimal` money fields | Keep. Set precision explicitly, e.g. `@db.Decimal(10, 2)`. |
| Enums | Supported. Keep. |
| `Locale` enum | Add `ar` (values `en`, `fr`, `ar`). Every `...I18n` table then supports three languages with no other change. |
| Full-text search | Add `@@fulltext` on title and summary of `PostI18n` and `ProjectI18n` if a search box is wanted. Otherwise use `LIKE` (fine at this size). |

**Done when:** `npm run db:validate` passes, `npm run db:migrate` builds every table on an empty local MySQL, and a test confirms an `Locale.ar` row can be written.

---

## 3. Target folder layout (`apps/api`)

```
src/
  server.ts  app.ts
  config/env.ts
  lib/            prisma.ts  logger.ts  crypto.ts  slug.ts  pagination.ts  clock.ts
  middleware/     requestId  error  auth  requireRole  rateLimit  validate  upload
  storage/        StorageDriver.ts  LocalDriver.ts  index.ts
  modules/
    auth/         routes  controller  service  repo  schemas  *.test.ts
    users/        (admin invite, profile, password, sessions)
    posts/
    projects/
    categories/
    media/        (upload, optimize, library)
    analytics/    (collect, rollup, reports)
    deploy/       (publish trigger and status)
    public/       (read-only endpoints for the site build)
    health/
  jobs/           rollupAnalytics.ts  purgeTrash.ts  cleanTokens.ts
prisma/           schema.prisma  migrations/  seed.ts
tests/            setup.ts  factories.ts  helpers/
docker-compose.yml   (local MySQL for dev and test)
```

Layer rule (unchanged): `routes → controller (HTTP only) → service (business rules) → repo (Prisma only)`. No Prisma call in a controller. Services never read `req` or `res`.

---

## 4. Local environment

1. Install Docker Desktop (or MySQL 8 natively).
2. `docker-compose.yml` starts MySQL 8 with two databases: `altio_dev` and `altio_test`.
3. `.env` (never committed) holds `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_ORIGIN`, `ADMIN_ORIGIN`, `UPLOAD_DIR`, `COOKIE_DOMAIN`, `BCRYPT/ARGON` tuning, `DEPLOY_HOOK_URL` (empty locally).
4. Commands (all callable from the repo root):
   - `npm run db:up` / `db:down` (docker compose)
   - `npm run db:migrate` (dev migration)
   - `npm run db:seed` (section 5)
   - `npm run db:reset` (drop, migrate, seed)
   - `npm run dev -w @altio/api`
   - `npm run test -w @altio/api`
5. `env.ts` is extended so the server **refuses to start** when a secret is missing or shorter than 32 characters in production.

**Done when:** a new developer runs 4 commands and has a seeded API on `localhost:4000` and the dashboard on `localhost:3000/admindash/`.

---

## 5. Seeding: fill the database from what exists

`prisma/seed.ts` is **idempotent** (running it twice changes nothing; it upserts by slug).

| Source | Becomes |
|---|---|
| `apps/web/src/content/en/posts.json` | `Post` + `PostI18n(en)`, categories, tags |
| `apps/web/src/content/en/projects.json` and `work.json` | `Project` + `ProjectI18n(en)`, stack, story JSON |
| `apps/web/public/...` images referenced by content | `Media` rows (files copied through the same optimizer as uploads) |
| FR and AR JSON (from `finalFE.md`, when they exist) | the matching `...I18n(fr/ar)` rows |
| Packs, services, FAQ, testimonials | **not seeded in phase 1** (stay JSON files, pages are "Soon") |
| First admin | From env vars `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (dev only; production uses a one-time CLI script) |
| Demo data (dev only) | 40 fake page views per day for 30 days so charts are not empty |

**Done when:** after `db:reset` the dashboard lists every existing post and project, and the **seed test** proves a second run creates no duplicates.

---

## 6. Authentication (build first, everything else depends on it)

### 6.1 Model
- `User` (email unique, `passwordHash`, `role`, `totpSecret?`, `lastLoginAt`, `disabledAt?`).
- `Invite` (token hash, expiry 48 h, single use). **No public sign-up.**
- `RefreshToken` (token hash, `familyId`, `expiresAt`, `revokedAt`, `replacedById`, user agent, IP hash).
- `PasswordReset` (token hash, expiry 30 min, single use).

### 6.2 Rules
| Rule | Detail |
|---|---|
| Password hashing | argon2id (`argon2` package). Minimum 12 characters, common-password list check. |
| Access token | JWT, 15 min, sent as `Authorization: Bearer`, **kept in memory** in the dashboard (never localStorage). |
| Refresh token | Opaque random 256-bit value, stored **hashed**. Cookie: `httpOnly; Secure; SameSite=Lax; Path=/v1/auth`. Rotated on every use. |
| Reuse detection | Using an already-rotated token revokes the whole family. |
| Brute force | `express-rate-limit`: 5 login attempts per 15 min per IP and per email. Then a 15 min lock. Identical error text for "unknown email" and "wrong password". |
| Timing | Dummy hash comparison when the user does not exist, so response time does not leak accounts. |
| 2FA (TOTP) | `otplib`. Setup with QR, 10 hashed recovery codes. Login becomes two steps when enabled. Recommended mandatory for the owner. |
| CSRF | Refresh and logout endpoints require `SameSite` cookie **plus** a custom header (`X-Requested-With`) and an `Origin` check against the allow-list. |
| Sessions | `GET /auth/sessions`, `DELETE /auth/sessions/:id`, "log out everywhere". |
| Password change | Needs the current password, revokes all other sessions. |
| Emails | Invite and reset emails go through a `Mailer` interface. Local: logs the link to the console. Production: SMTP (the Hostinger mailbox). |
| Audit | Login success and failure, password change, 2FA change, invite, role change all write `AuditLog`. |

### 6.3 Endpoints
`POST /v1/auth/login` · `POST /v1/auth/2fa/verify` · `POST /v1/auth/refresh` · `POST /v1/auth/logout` · `POST /v1/auth/accept-invite` · `POST /v1/auth/forgot` · `POST /v1/auth/reset` · `GET /v1/me` · `PATCH /v1/me` · `POST /v1/me/password` · `POST /v1/me/2fa/setup|enable|disable` · `GET|DELETE /v1/auth/sessions` · `POST /v1/users/invite` (ADMIN)

### 6.4 Tests (must exist before moving on)
- Unit: password policy, token hashing, refresh rotation, reuse detection, TOTP window, lock after 5 failures.
- Integration (Supertest + real MySQL): login happy path, wrong password, unknown email (same message), expired invite, reused invite, refresh rotation, replayed refresh revokes family, disabled user cannot log in, protected route returns 401 without token and 403 with the wrong role.

---

## 7. Content CRUD (posts, projects, categories)

One reusable pattern, written once on **posts**, copied to **projects**:

| Endpoint | Behaviour |
|---|---|
| `GET /v1/admin/posts?search=&status=&category=&locale=&page=&pageSize=&sort=` | Paginated list (default 20, max 100). Excludes trashed. |
| `GET /v1/admin/posts/trash` | Trashed items only. |
| `GET /v1/admin/posts/:id` | Full item with every language. |
| `POST /v1/admin/posts` | Creates a draft. Slug auto-generated per language, unique, editable. |
| `PATCH /v1/admin/posts/:id` | Partial update. Sends `version`; stale version returns `409 CONFLICT` (two admins editing). |
| `POST /v1/admin/posts/:id/publish` · `/unpublish` · `/schedule` | Status transitions with rules (cannot publish without title, summary, cover alt text, SEO fields for each enabled language). |
| `DELETE /v1/admin/posts/:id` | **Soft delete** (`deletedAt`). |
| `POST /v1/admin/posts/:id/restore` | Within 30 days. |
| `jobs/purgeTrash` | Nightly: hard delete after 30 days (and unlink unused media). |

**Projects extras:** client name, category, stack tags, results, structured `story` JSON, gallery order (`ProjectMedia.position`), featured order for the home page, `vibe` colour token.

**Rich text:** stored as a restricted JSON tree (or Markdown), validated by Zod against an allow-list of node types. The server never stores raw HTML. A shared `renderBody()` turns it into React on the site.

**Validation:** one Zod schema per request body, query and params, applied by a `validate()` middleware. Failures return `400 VALIDATION_ERROR` with `fields`.

**Tests per module:** list filters and pagination edges, create with duplicate slug, partial update, optimistic-lock conflict, publish rule failures, soft delete hides from list, restore, purge job, auth required on every route (table-driven test over the whole router).

---

## 8. Media and analytics

### 8.1 Media pipeline
1. `POST /v1/admin/media` (multipart, `multer` memory storage, 10 MB cap, max 10 files).
2. Detect the real type from bytes (`file-type`). Allow JPEG, PNG, WebP, AVIF. Reject SVG and anything else.
3. Reject over 6000 px; strip EXIF (removes GPS).
4. `sharp`: widths **480 / 960 / 1600** (never upscale), WebP quality about 78, plus a tiny blur placeholder.
5. Save through `StorageDriver.put(key, buffer)`; `LocalDriver` writes to `UPLOAD_DIR` (git-ignored). Filenames are random ids, never the user's filename.
6. Insert `Media` (+ `MediaI18n` alt text per language). **Alt text is required before an image can be used on a published item.**
7. `GET /v1/admin/media` (search, pagination, "used in"), `PATCH` (alt, caption), `DELETE` (blocked while in use).

Target: a 4 MB phone photo becomes three WebP files, the largest under 150 KB.
**Tests:** type spoofing (a `.jpg` that is really an `.exe`), oversize, EXIF removed, variants have expected widths and are not larger than the source, delete blocked while referenced, driver contract test run against `LocalDriver`.

### 8.2 Analytics (first party)
- `POST /v1/collect` (public). Accepts only: `page_view`, `cta_click`, `whatsapp_click`, `free_design_submit`. Body validated, 1 KB max, rate-limited, bots filtered by user agent.
- Stored in `AnalyticsEvent`: path, referrer domain, UTM, locale, country (from request header, no IP lookup), device class, browser family, and a **daily-rotating visitor hash** (no cookie, no IP stored).
- `jobs/rollupAnalytics` (nightly, also callable on demand): events older than 30 days are summed into `AnalyticsDaily` and deleted.
- Reports: `GET /v1/admin/analytics/overview?period=7d|30d` (visitors, page views, change vs previous period, top pages, sources, countries, devices, conversion rate), `/pages`, `/sources`.
- Optional later: GA4 Data API through a service account, cached 1 hour.
**Tests:** unknown event name rejected, bot ignored, rollup totals equal raw totals, retention deletes only rows older than 30 days, period math (7d vs previous 7d), visitor hash changes the next day.

---

## 9. Publish pipeline

The site is static, so publishing means rebuilding it.

1. Public read-only endpoints for the build: `GET /v1/public/posts`, `/public/posts/:slug`, `/public/projects`, `/public/projects/:slug` (published items only, all languages). They never return internal fields or `PackPrice`.
2. `POST /v1/admin/deploy` calls `DEPLOY_HOOK_URL` (a GitHub Actions `workflow_dispatch`). `Deploy` state (queued, building, live, failed) is stored and shown in the dashboard.
3. The workflow: install, fetch the public endpoints into a content cache, `build:export`, upload `out/` to Hostinger (FTP or SSH).
4. Scheduled posts: a job checks every minute and triggers a deploy when a post's time arrives.
5. Locally the hook is a no-op that logs; the front end can be built against `localhost:4000` to test the whole chain.

**Tests:** unpublished and trashed items never appear in public endpoints, public payload has no internal fields (snapshot), deploy endpoint requires auth, the hook is called once per request (mocked).

---

## 10. Admin dashboard (front end of the backend)

Built in `apps/web/src/app/admindash/...` as a client app inside the static export (no Next server needed). It calls the API with `fetch` through one typed client.

| Layer | Plan |
|---|---|
| API client | `lib/admin/api.ts`: base URL from env, attaches the access token, on `401` tries one refresh then redirects to login, maps `{ error }` to a typed `ApiError`. |
| Auth state | In-memory store plus an `AuthGate` component. Route guard is client-side (the real protection is the API). |
| Server data | TanStack Query (cache, loading, retry, invalidation). |
| Forms | React Hook Form + the same Zod schemas (shared package `@altio/shared`, so the rules cannot drift). |
| Editor | TipTap, output restricted to the allowed node list. |
| Uploads | Drag and drop, progress, per-file errors, alt-text prompt. |

**Screens (phase 1):** Login (with 2FA step) · Accept invite · Forgot and reset password · Overview (content status, traffic, deploy status) · Posts list and editor · Projects list and editor · Trash · Media library · Analytics · My account (password, 2FA, sessions) · Admins (invite, disable).
The lead, referral and payment blocks currently in the sample Overview are hidden until those pages exist. All other sidebar items stay "Soon".

**Rules:** mobile first, 44 px touch targets, empty, loading and error state on every list, confirm on destructive actions, unsaved-changes warning, autosave drafts every 10 s, visible focus, labels on every field.

**Tests:** see section 11.

---

## 11. Testing plan

### 11.1 Tools
| Need | Tool |
|---|---|
| Runner and assertions | **Vitest** (API and web) |
| HTTP tests | **Supertest** against `createApp()` (no port opened) |
| Database | Real MySQL `altio_test`, schema reset between files, factories for data |
| Component tests | **React Testing Library** + `user-event` + `jest-dom` |
| API mocking in the dashboard | **MSW** (same handlers reused in tests and Storybook-style demos) |
| End to end | **Playwright** (login, create post with image, publish, delete, restore) against a seeded local stack |
| Accessibility | `@axe-core/playwright` on every admin screen |
| Time | A `clock` module so tests control "now" (token expiry, scheduling, rollup) |

### 11.2 Levels
- **Unit** (fast, no DB): password policy, token logic, slugging, pagination math, Zod schemas, rich-text allow-list, analytics math, sharp options, state transitions of posts.
- **Integration** (Supertest + MySQL): every endpoint, success, validation error, auth error, permission error, not found, conflict.
- **Contract:** one test walks the router and asserts that every `/v1/admin/*` route returns `401` without a token.
- **Security tests:** SQL injection strings in search, oversize body, wrong content type, XSS payloads in titles (stored escaped, never executed), CORS from a foreign origin, upload spoofing, rate-limit triggers.
- **Front end:** component tests for forms (validation messages, disabled while submitting, error from API), list (loading, empty, error, pagination), auth gate (redirect, refresh on 401); Playwright for the 5 core journeys on desktop and a 375 px phone.

### 11.3 Gates
- Coverage thresholds fail the build: **services and utils 90 percent lines, controllers and routes 80 percent, dashboard components 70 percent**.
- CI (GitHub Actions) runs: install, `lint`, `typecheck`, API tests with a MySQL service container, web tests, `build:export`, Playwright smoke. A pull request cannot merge on red.
- A bug fix always starts with a failing test that reproduces it.

---

## 12. Security checklist (each item gets a test or a config check)

helmet defaults and strict CSP on the admin page · CORS allow-list with credentials · request body limits · Zod on everything · Prisma only (no raw SQL, or parameterized if unavoidable) · argon2id · rate limits on login, forgot, collect and upload · uploads re-encoded and renamed · no stack traces in production responses (already done) · structured logs with request id and **no passwords, tokens or full IPs** · `.env` never committed (git hook scans for secrets) · `npm audit` in CI · dependency updates monthly · admin pages `noindex`.

---

### 12.1 Error log (already built on the front end)
The front end has an error logger (`apps/web/src/lib/logger`): browser errors, unhandled promises, broken resources and React crashes are written to `apps/web/logs/frontend-errors.txt` during `npm run dev`, and listed in the dashboard **Audit log** page. When the backend exists: `POST /v1/log` replaces the dev file writer (same payload, set `NEXT_PUBLIC_ERROR_LOG_URL`), entries go to a table with 30-day retention, the API's own errors use the same text format, and the Audit log page also shows the `AuditLog` table (who did what).

## 13. Build order (each step is done only when its tests pass)

| # | Step | Done when |
|---|---|---|
| 1 | MySQL schema adaptation, Docker MySQL, first migration | Section 2 test passes |
| 2 | Test harness: Vitest, Supertest, factories, DB reset, CI skeleton | One green test in CI |
| 3 | Shared package `@altio/shared` (Zod schemas, types) | API and web import it |
| 4 | Auth backend (section 6) | All auth tests green |
| 5 | Dashboard login, guard, API client, account page | Playwright login journey green |
| 6 | Media module + library screen | Optimization test green |
| 7 | Posts module + editor screens | CRUD, trash, publish tests green |
| 8 | Projects module + screens | Same, plus gallery order |
| 9 | Seed from existing JSON | Seed test green, dashboard shows real content |
| 10 | Analytics collect, rollup, reports, Analytics screen, Overview rewired | Math tests green |
| 11 | Public endpoints + site build reading from API | Build output equals JSON build |
| 12 | Publish pipeline (hook, status, scheduler) | Mocked hook test green |
| 13 | Security pass, load check (autocannon, 50 concurrent, p95 under 300 ms on list endpoints), backup and restore script test | Checklist ticked |
| 14 | Deploy to Hostinger Business (section 14) | Production health check and smoke journey green |

Everything up to step 13 runs and is tested **locally**.

---

## 14. Deployment (last)

1. In hPanel create the **Node.js web app** (Node 22), connect it to the repo or upload the build, set the start file (`dist/server.js`) and the environment variables.
2. Create the MySQL database and user in hPanel; put its `localhost` URL in `DATABASE_URL`.
3. Run `prisma migrate deploy` (via SSH if the plan allows it; otherwise run it from the local machine with the host's Remote MySQL allow-list for your IP, then remove the rule).
4. Put the API on a subdomain of the main domain (e.g. `api.`) so the refresh cookie is same-site.
5. Uploads folder outside the web root, served by the API or mapped as a static path; monitor inodes (3 files per image).
6. Weekly `mysqldump` (cron or GitHub Actions) stored off the server; restore tested once.
7. Health check monitoring (free uptime service) on `/v1/health`.
8. First admin created by a one-time CLI script, then 2FA enabled.

Rollback: keep the previous build folder and the pre-migration dump; migrations are forward-only, so every migration is written to be backward compatible with the previous app version.

---

## Definition of done (whole backend)

- Fresh clone to working local system in 4 commands.
- Every endpoint documented in section 6 to 9 exists and is tested.
- Login, refresh rotation, lockout, 2FA, invite and reset work end to end.
- An admin can create, edit, publish, schedule, trash and restore posts and projects in EN, FR and AR, with optimized images, from a phone.
- Analytics show real numbers from the site.
- CI is green with the coverage gates; security checklist ticked.

---

## Owner tasks (done by the team, last)

1. Confirm the **Business plan** limits in hPanel (RAM, processes, inodes, SSH, Node build options) and confirm Yassine's setup details.
2. Provide the **domain and DNS access** for the `api.` subdomain.
3. Provide the **admin emails** to invite and decide who is mandatory 2FA.
4. Create the **GitHub repository secrets** and the Hostinger FTP or SSH credentials for the deploy workflow (never in chat or in code).
5. Provide an **SMTP mailbox** for invites and password resets.
6. Decide the **retention periods** (analytics 30 days, trash 30 days) and confirm the cookie-free analytics is acceptable under Moroccan data-protection rules (Law 09-08, CNDP), including a legal review if needed.
7. Choose whether to add **Google Analytics 4** (needs a cookie banner) and, if yes, create the property and the service account.
8. **Test the dashboard by hand** on a real phone and a desktop: create, edit, upload, publish, delete, restore, log in and out, 2FA, lost password.
9. Write or approve the **FR and AR text** for blog posts and projects (not machine-only).
10. Run the **restore drill** once with a real backup file and sign off.
