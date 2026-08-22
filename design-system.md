# DomainPricing — Design System

This document describes the project's UI/UX conventions so AI agents or new
developers can add features/pages while keeping the existing style. Read this
file **before** touching `src/components/`, `src/layouts/`, or
`src/styles/global.css`.

## 1. UI Stack

- **Tailwind CSS v4** (via `@tailwindcss/vite`, no `tailwind.config.js` —
  theme configuration lives directly in `src/styles/global.css` using the
  `@plugin` syntax).
- **daisyUI v5** as the base component library (`btn`, `table`, `input`,
  `select`, `navbar`, `card`, `tooltip`, `link`...). Always prefer existing
  daisyUI classes over writing new CSS.
- Every page is an **Astro component** (`.astro`), server-rendered at build
  time (SSG). Client-side JS is vanilla only (`<script>` inside `.astro`
  files) — **no React/Vue** is used in this project even though the stack
  supports it.

## 2. Theme & Colors

There are 2 custom themes defined in `src/styles/global.css`, **not** the
default daisyUI `light`/`dark` themes:

```css
@plugin "daisyui" {
  themes: dpcustom-light --default, dpcustom-dark --prefersdark;
}
```

- `dpcustom-light` — default.
- `dpcustom-dark` — activates automatically based on the OS
  `prefers-color-scheme: dark`.
- **No manual toggle** in the UI. Don't add a theme-switch button unless
  explicitly requested.

### Color palette (OKLCH)

| Token | Light | Dark |
|---|---|---|
| `base-100` (main background) | `oklch(100% 0 0)` white | `oklch(15% 0 0)` near-black |
| `base-200` | `oklch(97.8% 0 0)` | `oklch(18% 0 0)` |
| `base-300` (borders, dividers) | `oklch(94% 0 0)` | `oklch(23% 0 0)` |
| `base-content` (main text) | `oklch(15% 0 0)` | `oklch(94% 0 0)` |
| `primary` / `secondary` / `accent` | `oklch(58% 0.2 255)` blue | `oklch(72% 0.17 45)` orange |
| `success` | green `oklch(64% 0.15 150)` | `oklch(70% 0.15 150)` |
| `warning` | yellow `oklch(75% 0.15 80)` | `oklch(80% 0.15 80)` |
| `error` | red `oklch(58% 0.22 25)` | `oklch(68% 0.2 25)` |

Important note: **`primary` = `secondary` = `accent` share the same value**
in both themes. This is intentional (monochrome accent, not multi-color) —
when adding new UI, only use `primary` as the accent color; don't invent a
different `secondary`/`accent` palette.

Don't use hardcoded hex/rgb colors in components. Always use daisyUI color
tokens via Tailwind classes: `text-primary`, `bg-base-200`,
`border-base-300`, `text-base-content/70` (use the opacity modifier `/NN`
for secondary shades instead of adding new color tokens).

### Radius & borders

```
--radius-selector: 0.375rem   (input, select, badge...)
--radius-field: 0.375rem      (button, input field)
--radius-box: 0.5rem          (card, table, modal)
--border: 1px
--depth: 0   → no fake 3D shadow from daisyUI defaults
--noise: 0   → no noise texture
```

Flat UI, no heavy shadows. Cards/tables use a light `shadow-sm` combined
with `border border-base-300`, never `shadow-lg`/`shadow-xl`.

## 3. Layout

- The main container is always **`max-w-5xl mx-auto`**, with responsive
  horizontal padding `px-4 sm:px-6`. Every new page (header, main, footer)
  must use this same max-width so content stays vertically aligned.
- Vertical padding for the main content block: `py-6 sm:py-10`.
- Standard page structure (see `RegistrarPage.astro`):

  ```
  <SiteHeader />
  <main class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    ...content...
  </main>
  <SiteFooter />
  ```

- **No sidebar, no complex multi-column grids.** The layout is
  single-column and minimal.

## 4. Typography

- No external fonts imported — uses Tailwind/daisyUI's default system font.
- Page heading (`h1`): `text-2xl sm:text-3xl font-bold`. The key term (the
  registrar name, "Average") is wrapped in `<span class="text-primary">` to
  add color emphasis — this is the standard pattern for every new H1.
- Description text below H1: `text-base-content/70 max-w-prose`.
- Small secondary labels (category, label): `text-xs uppercase tracking-wide text-base-content/50`.
- Footer / secondary note text: `text-xs text-base-content/50`.
- Numeric data (prices, counts) always uses `font-mono` + `tabular-nums` for
  even column alignment — mandatory for any new data table.

## 5. Component Patterns

### Nav buttons / links (registrar navbar)

```html
<a class="btn btn-xs sm:btn-sm font-mono {active ? 'btn-primary' : 'btn-ghost'}">
  Name
</a>
```

- Active state uses `btn-primary`, inactive uses `btn-ghost`.
- Navigation list items are always `font-mono`, sized `btn-xs sm:btn-sm`.

### Card / data table

```html
<div class="card bg-base-100 border border-base-300 shadow-sm">
  ...
</div>
```

- Every "card" wrapper uses this class combo: `base-100` background,
  `base-300` border, `shadow-sm` (never heavier).
- Data tables use daisyUI classes `table table-zebra table-sm sm:table-md`.
- Sortable column headers: `cursor-pointer select-none hover:bg-base-200`,
  with `role="button" tabindex="0"` for keyboard accessibility (required
  for any interactive element that isn't a native `<button>`/`<a>`).
- Sort arrow icons use Unicode characters (`↕ ↑ ↓`) inside
  `<span class="sort-arrow">`, not SVG.

### Search input

```html
<label class="input input-bordered input-sm flex items-center gap-2 w-full sm:max-w-xs">
  <svg ...inline magnifying-glass icon, stroke="currentColor".../>
  <input type="text" class="grow" ... />
</label>
```

- SVG icons always use `stroke="currentColor"` so they follow the theme
  color automatically; never hardcode icon color.

### Select (dropdown)

```html
<select class="select select-bordered select-sm font-mono w-45">
```

### Tooltip

```html
<div class="tooltip tooltip-bottom" data-tip="Short explanation">...</div>
```

Used for controls that need a brief explanation (e.g. the source of the
exchange-rate data).

## 6. Responsive

Standard Tailwind breakpoints (`sm:`, `md:`...), but the project mostly uses
only **`sm:`** as the mobile → desktop cutoff (avoid `md:`/`lg:` unless
truly necessary). Most common recurring pattern:

- `text-2xl sm:text-3xl`
- `py-6 sm:py-10`
- `btn-xs sm:btn-sm`
- `flex-col sm:flex-row`

Mobile-first: write the default class for mobile first, then add `sm:` to
extend for larger screens.

## 7. Icons

No external icon library is used (no `lucide`, `heroicons`, or similar
package installed). Icons are **hand-written inline SVG**,
`viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" stroke-width="2"`,
small size (`w-4 h-4`), and `opacity-50` when it's a secondary/supporting
icon (not the primary action).

## 8. General Principles for Adding New UI

1. **Always prefer existing daisyUI tokens/classes first**, only write raw
   CSS when daisyUI can't cover it.
2. **Don't introduce new colors** beyond the tokens already defined in the
   2 themes (`primary`, `base-100/200/300`, `success/warning/error`...). If
   a different shade is needed, use an opacity modifier (`/70`, `/50`) on
   an existing token.
3. **Keep the layout single-column, max-w-5xl** — don't break the 3-block
   header/main/footer structure.
4. **Flat, minimal UI** — avoid heavy shadows, gradients, complex
   animations, or radii larger than what's already defined.
5. Any custom interactive element (not a native `<button>`/`<a>`/`<input>`)
   must have `role`, `tabindex`, and handle `Enter`/`Space` keys, matching
   the pricing table header pattern.
6. Numeric data/prices always use `font-mono tabular-nums`, right-aligned
   (`text-right`).
7. Client-side component scripts use **vanilla TypeScript**, no added JS
   framework (React/Vue/Svelte) unless explicitly requested — keeps the
   site lightweight and fast (original goal: static site, minimal JS).
