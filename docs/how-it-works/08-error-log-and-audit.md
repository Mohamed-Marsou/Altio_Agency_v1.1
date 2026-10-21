# 08. Error logger and the Audit log page

## Goal
Every error of the website and the dashboard is written to a text file with date, component and page, each error clearly separated.

## The text file
`apps/web/logs/frontend-errors.txt` (git-ignored). One block per error:

```
================================================================================
#0007  ERROR  2026-10-22 14:03:11 +01:00
--------------------------------------------------------------------------------
Component : ContactForm
Source    : window.onerror
Page      : /fr/contact/
Message   : Cannot read properties of null
File      : app.js:12:5
Client    : Chrome 130 · 375x812 · dark
Stack     :
    ...
```

At 2 MB the file is archived (`frontend-errors.<date>.txt`) and a new one starts.

## What is caught
`lib/logger/client.ts`: `window` errors, unhandled promise rejections, broken images/scripts (as WARN), and your own calls `logger.error(...)`, `logger.warn(...)`, `logger.exception(err, {component})`. React crashes: `app/(site)/[locale]/error.tsx`, `app/(admin)/error.tsx`, `app/global-error.tsx`, and `components/system/ErrorBoundary.tsx` (give it a `name`, it becomes the Component line). Server render errors: `instrumentation.ts` (`onRequestError`). `components/system/ErrorReporter.tsx` switches the global catchers on.
The component name is read from the stack when possible, or given explicitly.

## How it gets to the file
A browser cannot write files. During `npm run dev`, `instrumentation.ts` starts a tiny server (`lib/logger/server.ts`, port 4001) that receives each error and appends it. The same server also carries the dashboard API (see 07).

Safety: listens on 127.0.0.1 only, accepts only our own dev origins, 16 KB body limit, 20 errors per second, every field cleaned (`lib/logger/format.ts`: control characters removed, length limits, query string removed from the page so no personal data, lines that look like our separator are indented so nobody can forge an entry). The browser also drops a repeated error within 2 seconds and sends at most 50 per page.

## Production
On the static live site nothing is written (no server). Set `NEXT_PUBLIC_ERROR_LOG_URL` to send errors to the backend later (planned `POST /v1/log`).

## Audit log page: `/admindash/audit/` (`components/admin/AuditView.tsx`)
Reads `GET /logs` from the same server: totals (errors, warnings), latest time, filters (level, source, search), cards with copy button and expandable stack, "Open .txt", auto refresh, and "Send test error". If the logger is not running it explains how to start it.

## Files and tests
`lib/logger/format.ts` (writing and reading the text, shared), `lib/logger/server.ts`, `lib/logger/client.ts`, `instrumentation.ts`, tests `lib/logger/format.test.ts` and the last test of `e2e/admin/crud.spec.ts`.
