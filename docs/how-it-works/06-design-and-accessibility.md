# 06. Design system, themes, loader, accessibility and speed

## Styles
- **Tokens** (colours, spacing, radius, fonts) are CSS variables in `styles/base/_tokens.scss`, light by default, dark under `[data-theme="dark"]`.
- **SCSS helpers** in `styles/abstracts` (`rem()`, `space()`, `color()`, `mq()` breakpoints, mixins). Components import them with `@use "abstracts" as *;` (configured in `next.config.ts`).
- One `*.module.scss` per component (class names are scoped automatically).
- **Vibes**: `data-vibe="web|seo|shop|apps|tips|estate|store|app|managed"` sets `--pv` (a colour) for a post or project; `styles/base/_vibes.scss`.
- Mobile first: base styles are for phones, `mq(md)`, `mq(lg)` add desktop layout.

## Dark mode
`lib/theme.ts` has a tiny inline script (`THEME_INIT_SCRIPT`) put in `<head>` that sets `data-theme` before the first paint from localStorage (`altio-theme`) or the system setting, so there is no white flash. `components/ui/ThemeToggle` flips the attribute and saves the choice. The admin layout uses `ADMIN_THEME_INIT_SCRIPT` (same, without the loader).

## Intro loading screen: `components/ui/SiteLoader`
Shows the logo filling with colour while fonts, the load event and the first paint are ready, then opens like a curtain (minimum about 1 second). It has safety nets (8 second limit, never shown without JavaScript). Turn it off with `NEXT_PUBLIC_SITE_LOADER=off` (layout `useLoader`).

## Other UI pieces
`components/ui`: Button, MorphButton (blue to WhatsApp green), Tooltip (CSS only, shown on hover and focus), Reveal / InView (slide up on scroll), CustomCursor (mouse devices only), CoverImage (responsive WebP from the media library), Flag (SVG flags), Logo.

## Accessibility (WCAG 2.2 AA target)
Done and tested:
- **Contrast**: brand blue `#1463ff` darkened to `#125ae6` (light) and `#5a8fff` (dark); green `#097436`; danger `#c53a33`; vibe colours darkened; the WhatsApp card and the WhatsApp chip use dark text. All reach 4.5:1 (axe checks every page, light and dark).
- **Names that match the visible text**: logo links are labelled `ALTIO ...`, the language button `EN: Choose language`.
- Keyboard: visible focus ring (`focus-ring` mixin), mobile menu closes with Escape and traps scrolling, dialogs are real `<dialog>`.
- Forms: labels, `aria-invalid`, `aria-describedby`, `role="alert"` errors, focus to first error, autocomplete attributes.
- `prefers-reduced-motion` respected by animations and the typing headline.
- No sideways scrolling: `overflow-x: clip` on `<html>` (`_reset.scss`) plus the Audiences section, tooltips aligned near edges.

## Speed
Lighthouse (mobile, slow 4G, 4x CPU): performance 89 to 95, accessibility 100, best practices 100, SEO 100, CLS under 0.06. LCP is about 3 seconds on that harsh simulation (budget 4.2 s). `scripts/lighthouse.mjs` runs it.
- JavaScript is minified by Next.js and the first load per page is small; pictures use WebP with `srcset`; fonts are self-hosted and the Arabic font loads only on `/ar`.
- `scripts/optimize-images.mjs` keeps `public/` pictures under 200 KB and 1600 px.
- `.htaccess` adds gzip/brotli and one-year caching for hashed files.

## Decorative drawings
The small mock-up pictures (shop, dashboard, booking, blog covers) are CSS drawings with a few English words that are not translated (listed in `docs/content-audit.md`, section 3). A real picture can replace a drawing: the dashboard cover picker feeds `BlogCover` and `ProjectArt` (`image` prop).
