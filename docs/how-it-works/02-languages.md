# 02. Languages: English, French, Arabic (and right-to-left)

## What the visitor gets

- Three full sites: `/en/...`, `/fr/...`, `/ar/...`. Same pages, same links, same slugs.
- `/` is a small chooser. A script sends the visitor to the saved language, else the browser language, else English. Without JavaScript (search engines) the page just lists three links.
- The language button (desktop menu and phone menu) opens the **same page** in another language and remembers the choice.
- Arabic pages are right to left: `<html lang="ar" dir="rtl">`, menu, cards and arrows mirrored, an Arabic font loaded only there.

## How it is built

### 1. Routes
`app/(site)/[locale]/...`: the folder name `[locale]` is a parameter. `layout.tsx` there has `generateStaticParams()` returning `en`, `fr`, `ar`, so Next builds three copies of every page. It writes `<html lang dir>` and picks the fonts.

`lib/i18n.ts` has the pure helpers: `LOCALES`, `isLocale`, `dirOf` (rtl for `ar`), `localePath("fr","/services/") -> "/fr/services/"`, `stripLocale`.

### 2. The text: `content/<locale>/*.json`
25 files per language (hero, nav, packs, posts, projects, legal, seo...). `content/index.ts` imports them all into one object `dictionaries.{en,fr,ar}`. French and Arabic **must have exactly the same keys** as English (a test checks it, see below).

### 3. How a component gets its text: `lib/content.ts`
Every section calls a getter such as `getHero()`. The getter reads the language of the page being rendered:

- `lib/locale-server.ts` keeps "the language of this page" in a per-request box (React `cache()`).
- Each page and the layout call `setRequestLocale(locale)` first, then the getters read it.
- A getter can also take the language directly: `getPosts("fr")` (used by metadata and `generateStaticParams`).
- Tokens `{{email}}`, `{{phone}}`, `{{domain}}`, `{{city}}` inside any text are replaced by the values of `content/shared/site.json` (see 03).
- Types come from the English JSON, so TypeScript forces French and Arabic to have the same shape.

### 4. Links keep the language: `components/ui/LocaleLink/LocaleLink.tsx`
A drop-in replacement for `next/link`. It adds `/fr` in front of internal addresses using the language in the URL. All components use it (a test checks no link loses the language).

### 5. Language switch: `lib/i18n-client.ts`, `components/layout/Navbar/LanguageSwitcher.tsx`, `MobileMenu.tsx`
`switchLocale("fr")` saves `altio-locale` in localStorage and opens `/fr/<same page>` with a **full page load** (so `lang`, `dir` and fonts match). `app/(root)/LanguageRedirect.tsx` reads that value on `/`.

### 6. Arabic specifics
- Font: `app/fonts.ts` defines IBM Plex Sans Arabic with `preload: false`; `layout.tsx` adds its CSS class only when `locale === "ar"`. English and French never download it (a test checks).
- Tokens: `styles/base/_tokens.scss` switches the font stacks under `[dir="rtl"]`; `_typography.scss` removes letter spacing and raises line height for Arabic.
- Layout: browsers mirror flex and grid automatically in RTL. Text-flow CSS was changed to logical properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`). Decorative art compositions keep physical left/right on purpose.
- Arrows: `_utilities.scss` flips `lucide-arrow-right/chevron-right` under `[dir=rtl]`.
- Phone inputs stay `dir="ltr"` inside Arabic pages. The growth chart plot is forced `dir="ltr"` (time runs left to right). Tooltip text uses `dir="auto"`.
- Dates: `lib/format.ts` uses `ar-MA-u-nu-latn` (Western digits).

### 7. Review state: `content/review-status.json`
Each file is `draft` or `reviewed`. French and Arabic are Claude drafts. The strict release build refuses `draft` (see 03).

## Tests that protect this
`content/content.test.ts` (same keys, same list lengths, ids/links unchanged, `{{tokens}}` kept, no long English sentence left, Arabic letters present, every link goes to a real page), `lib/i18n.test.ts`, `e2e/public/i18n.spec.ts` (switch keeps page, Arabic font only on /ar, no sideways scroll, links keep the language).

## Adding or changing text
Edit the same key in the three folders. Run `npm run test`: it tells you if one language is missing something.
