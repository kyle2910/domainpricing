import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";
import { getAllRegistrars } from "../lib/registrars";
import { isBlacklisted } from "../lib/sitemap-blacklist";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");

/** Filenames in /public that should never be listed in the sitemap. */
const EXCLUDED_HTML_FILES = new Set(["404.html", "500.html"]);

/**
 * Recursively scans /public for *.html files and returns their site-root
 * relative URL paths, e.g. "public/pricing-faq.html" -> "/pricing-faq.html",
 * "public/legal/terms.html" -> "/legal/terms.html".
 */
function findStaticHtmlPages(dir: string = PUBLIC_DIR, base: string = ""): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const pages: string[] = [];

  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      pages.push(...findStaticHtmlPages(path.join(dir, entry.name), relPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      if (EXCLUDED_HTML_FILES.has(entry.name)) continue;

      // "index.html" resolves to its directory URL (e.g. public/search/index.html
      // -> /search), matching how static hosts serve directory indexes.
      // Root-level "public/index.html" would collide with "/", which the
      // homepage already covers, so it's skipped entirely.
      if (entry.name.toLowerCase() === "index.html") {
        if (!base) continue;
        pages.push(`/${base}`);
      } else {
        pages.push(`/${relPath}`);
      }
    }
  }

  return pages;
}

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "https://domainpricing.uk";
  const registrars = getAllRegistrars();
  const today = new Date().toISOString().slice(0, 10);

  const staticHtmlPages = findStaticHtmlPages().sort();

  const urls = [
    { path: "/", loc: `${base}/`, priority: "1.0" },
    ...registrars
      .filter((r) => r.id !== "average")
      .map((r) => ({ path: `/${r.slug}`, loc: `${base}/${r.slug}`, priority: "0.8" })),
    ...staticHtmlPages.map((p) => ({ path: p, loc: `${base}${p}`, priority: "0.5" })),
  ].filter((u) => !isBlacklisted(u.path));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
