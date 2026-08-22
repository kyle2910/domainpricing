# DomainPricing

A static site (Astro + Tailwind CSS v4 + daisyUI v5) that shows domain
registration/renewal prices per TLD, grouped by registrar. Every page is
generated at build time from plain CSV files — no database, no backend.

Live example structure: `/` shows the average across all registrars,
`/cloudflare`, `/namecheap`, `/gandi.net`, etc. each show one registrar's
pricing table.

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs static site to dist/
npm run preview   # preview the production build locally
```

Requires Node.js **>= 22.12.0**.

## Adding or updating registrar data

1. Drop a CSV file into `csv/`. Each file needs exactly 3 columns:

   ```csv
   tld,registration,renewal
   com,9.08,10.18
   net,11.4,11.4
   ```

   All prices are treated as **USD**.

2. The filename determines both the URL and the display name:

   | File in `csv/`        | URL             | Display name |
   |------------------------|-----------------|--------------|
   | `average.csv`          | `/` (homepage)  | Average      |
   | `cloudflare.com.csv`   | `/cloudflare`   | Cloudflare   |
   | `gandi.net.csv`        | `/gandi.net`    | Gandi        |
   | `name.com.csv`         | `/name`         | Name         |

   Rules (see `src/lib/registrars.ts`):
   - A trailing `.com` is stripped from the slug (`cloudflare.com.csv` →
     `/cloudflare`). Other TLD suffixes (`.net`, etc.) are kept in the slug
     so different registrars never collide on the same URL.
   - The display name is the part before the first dot, capitalized
     (`gandi.net` → `Gandi`).

3. `average.csv` is required — it powers the homepage (`/`) and is excluded
   from the registrar navbar/sitemap registrar list.

4. No code changes are needed to add a new registrar — just add the CSV
   file and rebuild. Astro's `getStaticPaths()` in
   `src/pages/[registrar].astro` picks it up automatically.

### Regenerating `average.csv`

`average.py` recomputes `csv/average.csv` from every other CSV in `csv/`,
averaging registration/renewal prices per TLD across only the registrars
that actually list that TLD:

```bash
python3 average.py
```

Run this after adding/editing/removing registrar CSVs, then commit the
updated `average.csv`.

## Features

- **Fully static, no backend** — every route is pre-rendered at build time
  and can be hosted on any static host (Cloudflare Pages, Netlify, Vercel,
  GitHub Pages, etc.).
- **Auto-generated pages** — one page per CSV file in `csv/`; adding a file
  adds a page, no code edits required.
- **Sortable, searchable pricing tables** (`PricingTable.astro`) — click a
  column header to sort, type to filter by TLD. Implemented in vanilla
  client-side JS, no framework needed.
- **Client-side currency conversion** — prices are stored in USD in the
  CSVs; picking another currency in the header fetches live rates from the
  [Frankfurter API](https://frankfurter.dev) and converts in the browser.
  Rates are cached per day in `localStorage`. Source data on disk never
  changes.
- **Public CSV database** — every registrar's raw CSV is served as-is at
  `/database/<filename>.csv` (see `src/pages/database/[file].csv.ts`), so
  the data can be consumed programmatically.
- **Dark/light theme**, automatic via the OS `prefers-color-scheme`, using
  two custom daisyUI themes (`dpcustom-light` / `dpcustom-dark`) defined in
  `src/styles/global.css`. There is no manual toggle in the UI.
- **SEO built in**: per-page title, meta description, meta keywords,
  canonical URL, Open Graph + Twitter Card tags, and JSON-LD
  (`schema.org/Dataset`) structured data on every registrar page.
- **Auto-generated `sitemap.xml`** (`src/pages/sitemap.xml.ts`) that
  includes:
  - the homepage,
  - one entry per registrar page,
  - every `*.html` file found recursively inside `public/` (excluding
    `404.html`/`500.html`). An `index.html` inside a subfolder is listed
    under its directory URL (`public/search/index.html` → `/search`)
    instead of the literal file path, matching how static hosts actually
    serve directory indexes. A root-level `public/index.html` is skipped
    entirely to avoid duplicating the homepage URL.
- **`robots.txt`** at `public/robots.txt`, pointing to the sitemap.
- **Standalone WHOIS lookup tool** — `whois.html` is a fully self-contained
  page (inline CSS + JS, no build step) that can be dropped straight into
  `public/`. It looks up domain registration data live via the public
  [RDAP](https://rdap.org) network, supports both a search form and a
  `?domain=example.com` query string, and follows the same visual style as
  the rest of the site. See `design-system.md` for the styling reference
  used to build it.

## ⚠️ Before deploying

Update the `site` field in `astro.config.mjs` to your real domain. It
currently points to `https://domainpricing.uk` and is used to build
canonical URLs, the sitemap, and Open Graph image URLs — if left unchanged,
those will keep pointing at the placeholder domain.

## Project structure

```
csv/                          ← registrar pricing data, one CSV per registrar
  average.csv                 ← auto-generated average across all registrars
  cloudflare.com.csv
  ...

average.py                    ← regenerates csv/average.csv

design-system.md              ← UI/style conventions (Vietnamese)
design-system.en.md           ← UI/style conventions (English)
whois.html                    ← standalone WHOIS lookup page, drop into public/

public/                       ← static assets served as-is
  favicon.ico, favicon.svg
  og-image.png
  robots.txt

src/
  lib/
    registrars.ts             ← reads & parses every CSV at build time
  scripts/
    currency.ts                ← Frankfurter API calls, localStorage cache, formatting
  styles/
    global.css                 ← Tailwind import + daisyUI theme definitions
  layouts/
    BaseLayout.astro           ← shared <head>, meta tags, JSON-LD scaffold
  components/
    SiteHeader.astro           ← navbar: registrar nav links + currency selector
    SiteFooter.astro
    PricingTable.astro         ← sortable/searchable price table
    RegistrarPage.astro        ← shared page shell used by every registrar page
  pages/
    index.astro                 ← homepage, renders average.csv
    [registrar].astro           ← dynamic route, one static page per CSV (except average)
    sitemap.xml.ts               ← generates sitemap.xml (registrar pages + public/*.html)
    database/[file].csv.ts       ← serves each raw CSV at /database/<file>.csv
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) v7 (static output, no SSR) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 (`@tailwindcss/vite`, no `tailwind.config.js`) |
| Components | [daisyUI](https://daisyui.com) v5 |
| CSV parsing | [PapaParse](https://www.papaparse.com) |
| Currency rates | [Frankfurter API](https://frankfurter.dev) (called client-side) |
| Client interactivity | Vanilla TypeScript/JS — no React/Vue/Svelte |

## UI theme

The site uses two custom daisyUI themes, `dpcustom-light` and
`dpcustom-dark`, defined in `src/styles/global.css`:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: dpcustom-light --default, dpcustom-dark --prefersdark;
}
```

The dark theme activates automatically based on `prefers-color-scheme:
dark`; there's no manual switch in the UI. `primary`, `secondary`, and
`accent` intentionally resolve to the same color in both themes (a single
accent color, not a multi-color palette).

For the full color tokens, spacing, typography, and component conventions
used across the site (so new pages/components stay visually consistent),
see **`design-system.md`** (Vietnamese) or **`design-system.en.md`**
(English).

## Technical notes

- If two CSV filenames produce the same slug after the `.com`-stripping
  rule (unlikely, since registrar domains are unique), Astro will fail the
  build with a duplicate-route error — rename one of the files.
- All prices in the CSVs are USD. When a user picks a different currency in
  the header, the displayed prices are multiplied by the current
  Frankfurter exchange rate **in the browser only** — the CSV files and the
  `/database/*.csv` endpoints always return the original USD figures.
- `average.csv` for a given TLD only averages over the registrars that
  actually list that TLD, so a TLD offered by 3 out of 14 registrars is
  averaged over 3, not 14.

## License

See `LICENSE`.
