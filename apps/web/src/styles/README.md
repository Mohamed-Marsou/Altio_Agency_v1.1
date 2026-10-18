# Styles guide (read this before writing SCSS)

## Folder map
| Path | What it is | Emits CSS? |
|---|---|---|
| `abstracts/_variables.scss` | Sass-only values: breakpoints, z-index layers, type scale | No |
| `abstracts/_functions.scss` | `rem()`, `space()`, `color()`, `radius()`, `shadow()`, `z()`, `fluid()` | No |
| `abstracts/_mixins.scss` | `mq()`, `flex*()`, `text()`, `container`, `on-hover`, `reduced-motion`, `button-base`, `card`, `pill`... | No |
| `abstracts/_index.scss` | One door: `@use "abstracts" as *;` gives you everything above | No |
| `base/_tokens.scss` | Design tokens as CSS variables (light + dark theme) | Yes (once) |
| `base/_reset.scss`, `_typography.scss`, `_utilities.scss` | Resets, default text styles, `.container`, `.visually-hidden` | Yes (once) |
| `app/globals.scss` | The only global stylesheet; loads the base layer | Yes |

Each component owns ONE file next to it: `Button.module.scss`. Start every one with:

```scss
@use "abstracts" as *;
```

## Rules
1. **Mobile first.** Write the phone style first, then add `@include mq(lg) { ... }` for bigger screens (it means "from 1024px and up").
2. **No raw values.** No hex colours, no random pixels. Use `color(accent)`, `space(4)`, `radius(card)`, `rem(24)`, `shadow(float)`.
3. **Colours come from tokens.** Need a new colour? Add it once in `base/_tokens.scss` (light AND dark), then use `color(name)`.
4. **Layout with the flex mixins**, so the intent reads clearly: `flex-col(space(6))`, `flex-between`, `flex-center`, `flex-wrap-row`.
5. **Text with `@include text(style)`**, never hand-written font sizes (styles live in `_variables.scss`).
6. **Hover effects only inside `@include on-hover { ... }`** (mouse devices) and **animations always get a `@include reduced-motion { ... }` off switch**.
7. **Repeat something 3 times? Make a mixin** in `abstracts/_mixins.scss`.

## Class naming: human, camelCase, "component + part + state"
Class names must read like a sentence. The pattern is:

`<component><Part><State>`

| Pattern | Example |
|---|---|
| Root of the component | `navbarHeader`, `heroSection`, `buttonBase` |
| A part inside it | `navbarContent`, `heroTextColumn`, `heroVisualBrowserBar` |
| A variant | `buttonPrimary`, `buttonSizeLarge` |
| A state (starts with `Is`) | `navLinksLinkIsActive`, `languageSwitcherChevronIsOpen` |

Do NOT use short or vague names (`.box`, `.inner`, `.title`, `.md`). If you cannot tell what a class is from its name alone, rename it.

## Placeholders
`%name { ... }` is a Sass placeholder: a shared block that is copied into every class that does `@extend %name`. Use it for look-alike parts (skeleton blocks, chips).
