# @altio/api

The Altio backend: Express 5, TypeScript (strict), PostgreSQL with Prisma. It is
built after the website launch (see `planning/.../02-BACKEND.md`). Today it only
contains the skeleton and the database schema.

## What is here

```
src/
  server.ts            starts the server, closes it politely on SIGTERM
  app.ts               builds the Express app (helmet, CORS allow-list, JSON, routes, errors)
  config/env.ts        reads and validates environment variables (Zod); the server refuses to start if they are wrong
  middleware/          requestId.ts, error.ts (AppError + one error shape for the whole API)
  modules/health/      GET /v1/health
prisma/schema.prisma   the full database schema (users, content, leads, payments, referrals, analytics, audit)
```

Planned layers (not built yet): `routes -> controller (HTTP only) -> service (business rules) -> repo (Prisma)`.
No database call inside a controller.

## Run it

```bash
cp .env.example .env        # then edit it
npm run dev                 # from this folder, or: npm run dev -w @altio/api from the repo root
```

`GET http://localhost:4000/v1/health` should answer `{ "status": "ok", ... }`.

Scripts: `dev`, `build`, `start`, `typecheck`, `db:validate`, `db:format`, `db:generate`, `db:migrate`.
(They call Node directly because the project path contains spaces on Windows.)

## Database

1. Start PostgreSQL (Docker or a managed one) and put its address in `DATABASE_URL`.
2. `npm run db:migrate` creates the tables from `prisma/schema.prisma`.
3. Next steps: seed from the website JSON (`apps/web/src/content/en`), then auth.

Rules baked into the schema:
- text in several languages lives in `<Thing>I18n` tables (EN and FR);
- internal pack prices are in `PackPrice`, never selected by public endpoints;
- a referral reward is only granted after the referred client has fully paid (`Payment`);
- content tables are soft-deleted (`deletedAt`).

## Error shape

Every error leaves the API as `{ "error": { "code", "message", "fields?" } }`.
