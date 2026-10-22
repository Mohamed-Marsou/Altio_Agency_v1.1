# 13. Dashboard: login password and keeping it out of search engines

## A. Never listed in search engines (4 layers)

| Layer | What it does | Where |
|---|---|---|
| 1. Page tag | every dashboard page says `noindex, nofollow, noarchive, nosnippet, noimageindex, nocache` | `lib/admin/robots.ts` (`ADMIN_ROBOTS`), used by `app/(admin)/layout.tsx` and every admin `page.tsx` |
| 2. robots.txt | `Disallow: /admindash/` | `app/robots.ts` |
| 3. Server header | `X-Robots-Tag: noindex, nofollow` for any `/admindash` address | `public/.htaccess` |
| 4. Not uploaded | the deploy workflow excludes the dashboard files from Hostinger | `.github/workflows/deploy.yml` (`exclude: **/admindash/**`) |

Also: the dashboard is not in `sitemap.xml`, has no link from the public site, and its pages have no SEO texts. Checked automatically: `scripts/seo-lint.mjs` fails the build if any dashboard page lacks `noindex`, `e2e/public/site.spec.ts` checks the tag on 5 pages and that the sitemap never mentions it.

> Update: admins can now have their own accounts (email + own password), see [14](14-users-and-admins.md). The shared password below is the starting mode and stops working once the first admin exists.

## B. Shared password (the starting mode, until the first admin is created)

### The idea, answering "can the password live in .env?"
Yes, and that is what is built. A `.env` value is read only by the **server**; it is not in the browser files. A static page alone can never check a password safely (everything in it can be read), so the check is done by the dev server (`npm run dev`):

```
you type password --> browser sends it --> dev server compares with the stored fingerprint
                                          --> correct: sends back a session token (8 hours)
```
We do not keep the password in `.env`, only a **one-way fingerprint** of it (scrypt, with a random salt). Even if someone reads `.env.local` they cannot get the password back.

### Use it
```
npm run admin:password          (asks twice; nothing is shown while you type; min 12 characters)
npm run dev                     (restart)
```
Open `/admindash/`: a password screen appears. Remove the password: `npm run admin:password -- --remove`.
The line is written to `apps/web/.env.local` (git ignores it; `apps/web/.env.example` shows the format).
Without a password the dashboard is open and shows a small note (fine on your own computer).

### What is protected
Every `/api/*` call of the dashboard server (posts, projects, pictures) and the error log (`/logs`, `/logs.txt`). Kept open on purpose: `/api/health`, the login itself, and the browser error reporting `POST /log` (it only writes to your local file).

### Rules
- Wrong password: same answer every time and the same work done, so timing reveals nothing.
- **5 wrong tries lock that address for 15 minutes** (even the right password is refused during the lock).
- Session: random 256-bit token, kept by the server as a hash, lives 8 hours, ends on "Log out" (button in the top bar) or when the dev server restarts. The browser keeps it in `localStorage` with the expiry, so a refresh or a closed browser does not ask again until it ends. If any request gets "please log in" the dashboard returns to the password screen.
- The dev server listens on `127.0.0.1` only and accepts only the local dashboard as origin.

### Files
| File | Role |
|---|---|
| `lib/admin/passwordHash.mjs` | fingerprint and compare (used by the server and by the command) |
| `lib/admin/auth.ts` | sessions, lock after wrong tries, expiry |
| `lib/logger/server.ts` | the routes `/api/session`, `/api/login`, `/api/logout` and the guard on the others |
| `lib/admin/auth-client.ts` | browser side: token storage, `fetchSession`, `login`, `logout`, headers |
| `lib/admin/client.ts` | adds the token to every request, reacts to 401 |
| `components/admin/LoginScreen.tsx` | the password screen |
| `components/admin/AdminShell.tsx` | shows the login screen instead of the dashboard when needed, "Log out" button |
| `scripts/admin-password.mjs` | the `npm run admin:password` command |
| `lib/admin/auth.test.ts` | 9 tests (fingerprint, sessions, expiry, lock) |

A technical note: a fingerprint is written with `:` between its parts (`scrypt:salt:key`), because a `$` in a `.env` file is read as a variable and would damage the value.

## C. What this does NOT cover (and the options)

The login protects the dashboard **server**, which exists only on your computer today. If the dashboard pages were put on the live site they would show (read-only, no data) without any server to check a password. Options until the backend exists:

| Option | Real protection? | Notes |
|---|---|---|
| Keep the dashboard local (current) | Yes | nothing public, plus the password above |
| Hostinger **Password protect directories** (hPanel, Advanced) on the `/admindash` folder | Yes, the server refuses the page | needs no code; but the dashboard still cannot save on the live site |
| A page whose content is encrypted with a passphrase | Partly | protects static data only, can be guessed offline; not built |
| Backend login (`docs/finalBE.md`): invite-only admins, argon2id, rotating tokens, optional 2FA | Yes | the next phase; it will replace this temporary login and reuse the same screens |

Never put real data (leads, payments) behind anything but the backend login.
