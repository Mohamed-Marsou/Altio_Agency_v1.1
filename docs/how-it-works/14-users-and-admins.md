# 14. Users and admins (accounts, own passwords, who made what)

Page: `/admindash/users/` (sidebar: System, "Users and admins"). Today only **admins** exist (people who log into the dashboard). Visitors of the public site have no account. The same screens will later hold end-user data from the real backend.

## What you can do
| Screen | Address | What it does |
|---|---|---|
| List | `/admindash/users/` | all admins, status, last login, "Full page", Edit, Delete |
| Create / edit | `/admindash/users/edit/` and `?id=...` | name, email, description, status (active or disabled), a separate card to set a new password |
| **Full page of one admin** | `/admindash/users/profile/?id=...` | details, totals, **blog posts / projects / pictures this admin created**, what they edited, what they deleted, recent activity (each item has an "Open" link; deleted ones are marked "Deleted since") |

## Password model (answering "one password for all admins?")
Each admin has **their own password**. Only a one-way fingerprint (scrypt) is stored, never the password. Rules: 12 characters at least, not a common password, not made of the name or the email. The login now has three modes, picked by itself (`lib/admin/auth.ts`):

| Mode | When | Login |
|---|---|---|
| `accounts` | at least one active admin exists | **email + own password** |
| `shared` | no admin yet, `ADMIN_PASSWORD_HASH` set (see 13) | the one shared password |
| `open` | no admin, no shared password | no login (your own computer) |

So the shared password is the starting point: create the first admin on the Users page and from then on the shared password **stops working** (the screen warns you before). Same protections as before: same message for wrong email, wrong password or disabled account, 5 wrong tries lock (per address **and** per email) for 15 minutes, 8-hour sessions. Sessions end at once when an admin is disabled, deleted, or gets a new password from someone else.

Safety rules: the last active admin cannot be disabled or deleted, nobody can delete their own account, emails are unique (stored in lower case). If everybody is locked out: stop the server and delete `apps/web/.admin-data/` (back to shared/open mode).

## "Public must not know who made it"
The posts, projects and pictures **do not store the author at all**. The link "admin -> item" exists only in a private log. Result: the public HTML, JSON-LD, sitemap and every JSON under `content/` contain no admin name, email or id (a test checks the whole content folder; the fixed "Altio team" label is the only author text).

Private files, both in `apps/web/.admin-data/` (git-ignored, never imported by the site, not part of the export):
- `admins.json`: accounts (with the password fingerprint).
- `activity.json`: one line per create / edit / delete: when, who (id and the name at that time), what (post, project, picture, admin), title. The last 5000 are kept. Deleting an admin keeps their lines, so history stays readable. Posts, projects and pictures made **before** accounts existed have no owner and appear on nobody's page.

Because the folder is git-ignored, each computer has its own admins and history until the backend (a shared MySQL) replaces it.

## How it is built (files)
| File | Role |
|---|---|
| `lib/admin/adminSchemas.ts` | rules (Zod), password checker, types |
| `lib/admin/adminStore.ts` | accounts, activity log, `profile()` that builds the full page |
| `lib/admin/auth.ts` | the three login modes, sessions that know the admin |
| `lib/admin/devApi.ts` | `/api/admins`, `/api/me`; logs create/update/delete of posts, projects, pictures (`ApiContext`) |
| `lib/logger/server.ts` | creates the store, finds who is behind each request, `/api/session` also returns the mode and the name |
| `components/admin/UserListView.tsx`, `UserFormView.tsx`, `UserProfileView.tsx` | the three screens; `LoginScreen.tsx` asks for the email in `accounts` mode; the sidebar shows the logged-in name |
| `lib/admin/adminStore.test.ts` | 14 tests: password rules, CRUD, last-admin rule, login modes, lock, attribution, "no author in the content files" |

Endpoints: `GET/POST /api/admins`, `GET/PUT/DELETE /api/admins/:id`, `POST /api/admins/:id/password`, `GET /api/admins/:id/profile`, `GET /api/me`.

## Later (backend)
`apps/api/prisma/schema.prisma` already has `User` (role), and a audit table will take the place of `activity.json`. Planned there: invite by email, argon2id, roles beyond admin, optional 2FA (`docs/finalBE.md`).
