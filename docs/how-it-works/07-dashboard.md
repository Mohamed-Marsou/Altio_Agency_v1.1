# 07. The dashboard (/admindash): blog, projects and media CRUD

CRUD = Create, Read, Update, Delete. Today it works on the **JSON files** while you run `npm run dev`. Later the same screens talk to the real backend.

## Pages
`/admindash/` Overview (sample numbers), `/blog/` list, `/blog/edit/?slug=...` editor (no slug = new post), `/projects/` and `/projects/edit/`, `/media/` library, `/audit/` error log (see 08). The sidebar (`lib/admin/nav.ts`) lists every planned page; unbuilt ones are shown "Soon" and are not clickable.

## How saving works (the chain)

```
Editor screen  --fetch-->  dev server :4001  --functions-->  JSON files + public/uploads
(components/admin)         (lib/logger/server.ts)            (lib/admin/store.ts)
```

1. **Screens** (`components/admin/*`) call `adminApi` in `lib/admin/client.ts` (one typed client; `ApiError` for every failure; offline notice if the server is not running).
2. The **dev server** (`lib/logger/server.ts`) is a small Node HTTP server started by `instrumentation.ts` when `npm run dev` starts. It listens on `127.0.0.1:4001` only, accepts only our own origins (localhost:3000), requires an Origin header for anything that changes data, and limits body sizes.
3. `lib/admin/devApi.ts` is the router: plain functions `handleApi(store, request) -> {status, body}` (easy to test). One error shape: `{ error: { code, message, fields? } }`.
4. `lib/admin/store.ts` reads and writes the files. A post is stored once per language (`content/en|fr|ar/posts.json`). The editor shows a **record** (three languages together); saving splits it back. Writes are "all or nothing" (temp files then rename). Slugs cannot change after creation.
5. The pages read the JSON again; in dev `lib/content.ts` reads `posts`, `projects` and `media` from disk (`fromDisk`) so changes appear at once, and `onChange` touches the two `[slug]` page files so Next rebuilds its list of addresses. (Both are workarounds for Next.js dev caching; none of it exists in the real build.)

Endpoints: `GET/POST /api/posts`, `GET/PUT/DELETE /api/posts/:slug`, same for `/api/projects`, `GET/POST /api/media?name=`, `PATCH/DELETE /api/media/:id`, `GET /api/health`.

## Rules (shared with the future backend): `lib/admin/schemas.ts`
Zod schemas for posts, blocks, projects, case studies and media. Examples: slug lowercase with single dashes (3 to 80), date `YYYY-MM-DD`, title 140, body at least one block, section ids unique per article, case study structure, `visual` from a fixed list, cover must exist. The editor checks the same rules before sending, so errors appear next to fields.

Business rules in the store: duplicate slug refused (409), unknown item 404, **a picture used as a cover cannot be deleted**, **a project linked from the home page ("Selected work") cannot be deleted**, the site keeps at least one post and one project.

## Blog editor (`PostEditorView.tsx`, `BlockEditor.tsx`)
Details (slug auto from the English title, topic, date, reading time, cover, featured) and three language tabs (English, Français, العربية; Arabic inputs are RTL). "Copy the English text here" starts a translation. The body is a list of blocks (paragraph, section title, quote, tip box, picture caption) you can add, delete and move. A section's link id follows its title. Autosave is not built; a warning appears if you leave with unsaved changes. Delete asks for confirmation (`ConfirmDialog`, a real `<dialog>`).

## Project editor (`ProjectEditorView.tsx`)
Common fields (address, type, status live/private, colour style, website address, cover, featured) and per-language text (name, label, description, main result, up to 4 key figures). The **case study** (the story chapters) is edited as JSON text with an "Insert the template" button and is validated against `caseSchema` before saving. This is a pragmatic first version; a form for each chapter can replace it later.

## Pictures: `lib/admin/mediaPipeline.ts`, `UploadDropzone.tsx`, `MediaPicker.tsx`, `MediaLibraryView.tsx`
On upload the **server**:
1. refuses empty files and anything over **8 MB** (the browser also checks first and shows the size);
2. reads the real type from the first bytes: only JPEG, PNG, WebP, AVIF (SVG and renamed files are refused);
3. limits pixels (decompression-bomb protection);
4. rotates by the camera orientation and **removes all metadata** (GPS);
5. converts to **WebP** at 480, 960 and 1600 px wide (never enlarged), each kept under about 150 KB (quality lowers step by step);
6. does not store the same picture twice (SHA-256);
7. writes `public/uploads/<id>-<width>.webp` and a record in `content/shared/media.json` (paths, size, alt text per language).
Posts and projects store only the picture `cover: "<id>"`. `lib/content.ts` turns it into `coverImage {src, srcSet, width, height, alt}` and `components/ui/CoverImage` renders `<img srcset>` so phones download the small file. Alt text is written per language in the library.

## Files to open
Screens: `components/admin/*` (styles in `ui.module.scss`, `AdminShell` for the frame and mobile drawer). Logic: `lib/admin/*`. Pages: `app/(admin)/admindash/**`. Tests: `lib/admin/store.test.ts` (37 cases), `devApi.test.ts`, `helpers.test.ts`, `e2e/admin/crud.spec.ts` (13 real-browser flows).

## What it cannot do yet
Roles beyond "admin" (accounts exist now, see 14), saving on the live site (no server), scheduling, trash/restore, revisions, publishing a rebuild, leads/payments/analytics screens. The backend plan is `docs/finalBE.md`.
