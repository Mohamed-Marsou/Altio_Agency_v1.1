# 11. Backend (apps/api): what exists and what is planned

Decision: **Node.js + Express + MySQL**, hosted on a Hostinger plan that supports Node.js (Business or Cloud; Premium cannot). Plan: `docs/finalBE.md`.

## What exists today (a skeleton)
`apps/api`: Express 5 + TypeScript (strict, ESM).
- `src/server.ts` starts the server and closes politely on SIGTERM.
- `src/app.ts` builds the app: helmet, CORS allow-list with credentials, JSON body, routes, errors.
- `src/config/env.ts` reads environment variables with Zod and refuses to start when wrong.
- `src/middleware/error.ts` one error shape for the whole API; `requestId.ts`.
- `src/modules/health` gives `GET /v1/health`.
- `prisma/schema.prisma` the full database design.
- `.env.example`, `README.md` (how to run). Scripts avoid problems with spaces in Windows paths.

## The database design (`prisma/schema.prisma`)
Users, refresh tokens, password resets, invites; media; posts, projects, categories, services, packs (with an internal-only `PackPrice`), testimonials, FAQ, each with a translations table per language; leads and activity; payments (30/30/40); referrers, referrals, rewards (a reward only after the client has fully paid); analytics events and daily totals; settings; audit log. Soft delete on content. UUID ids.

**It is written for PostgreSQL and must be adapted to MySQL** (no `@db.Uuid`, no `String[]`, add Arabic to the `Locale` enum, explicit text sizes): the list is in `docs/finalBE.md`, section 2.

## How the website and the dashboard will connect
The dashboard already speaks to a small typed client (`lib/admin/client.ts`) and shares its rules with the backend through `lib/admin/schemas.ts`. The dev server's `store.ts` has the same set of operations the database layer will have. Forms already post to `/v1/leads` when `NEXT_PUBLIC_API_URL` is set. Errors go to `/v1/log` when `NEXT_PUBLIC_ERROR_LOG_URL` is set. So connecting the backend is mostly writing the server side and adding login.

## Not built yet
Authentication (invite-only admins, argon2id, rotating refresh tokens, optional 2FA), CRUD endpoints on MySQL, picture storage on the server, analytics collection, publish pipeline, seeds from the JSON files, backend tests. Build order and test plan: `docs/finalBE.md`.
