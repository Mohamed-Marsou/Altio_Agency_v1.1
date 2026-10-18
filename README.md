# Altio Agency — Website v2

> **Internal repository. Proprietary and confidential. Not for public use, sharing or redistribution.**
> See [LICENSE](./LICENSE). Do not fork, publish, screenshot, paste into public tools, or reuse this code outside Altio projects without written permission from the Owners.

## What this is
The source code of the Altio Agency website and, later, its backend API and admin dashboard.

| Part | Status | Location |
|---|---|---|
| Public website (Next.js, static export for launch) | In progress | `apps/web` |
| Backend API (Express + PostgreSQL) | Planned (after front-end launch) | `apps/api` |
| Admin dashboard (Next.js) | Planned | `apps/admin` |
| Shared schemas and types | Planned | `packages/shared` |

## Stack
Next.js (App Router) + TypeScript, Tailwind CSS v4, next-intl (EN primary, FR at launch, Arabic later), content in typed JSON/MDX. Launch hosting: static export on Hostinger Premium. Later: Express, PostgreSQL and a VPS.

## Requirements
- Node.js 22 or newer (see `.nvmrc`)
- npm 10 or newer

## Getting started
```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run build        # normal build
npm run build:export # static export (output in apps/web/out)
```

## Rules for contributors
- Work on a feature branch (`feat/...`), open a pull request, get one review before merging to `main`.
- Never commit secrets, `.env` files, client data or customer information.
- No hard-coded text or raw colours in components: content lives in `content/` and design tokens in `tokens.css`.
- Keep the repository **private**. If it is ever public by mistake, tell the Owners immediately.

## Documentation
Engineering plan, hosting notes and design references are kept in the internal planning folder (`planing/`) outside this repository.

© 2026 Altio Agency. All rights reserved.

## Windows note (paths with spaces)
Inside `apps/web/package.json` the `dev`, `build` and `start` scripts call Next directly (`node ./node_modules/next/dist/bin/next ...`) instead of the `next` shortcut. With a project path that contains spaces, the Windows `next.cmd` shortcut makes the production build fail with "Expected workStore to be initialized". The root `.npmrc` sets `install-strategy=nested` and the root `package.json` pins `next` and `react` through `overrides`, so there is exactly one copy of each. Next is pinned to 16.2.0 because 16.4.2 failed to prerender in this setup.
