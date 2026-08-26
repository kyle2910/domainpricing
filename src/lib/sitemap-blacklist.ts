/**
 * Sitemap blacklist config.
 *
 * URL paths listed here (or matching a pattern here) are excluded from the
 * generated `/sitemap.xml`, even though they still exist and are reachable
 * on the site. Useful for internal-only pages (staff tools, drafts, test
 * pages, etc.) that shouldn't be indexed or advertised to crawlers.
 *
 * Paths are matched against the site-root-relative URL path, e.g. "/internal",
 * "/legal/draft-terms.html", "/gandi.net".
 *
 * Two kinds of entries are supported:
 *  - Exact string match: "/internal-tool"
 *  - Wildcard match: any entry containing "*" is treated as a simple glob
 *    where "*" matches any sequence of characters, e.g. "/legal/draft-*"
 *    matches "/legal/draft-terms.html" and "/legal/draft-privacy.html".
 *
 * Matching ignores a trailing slash and is case-insensitive.
 */
export const SITEMAP_BLACKLIST: string[] = [
  "/redirect"
  // "/internal",
  // "/legal/draft-*",
];

function normalize(p: string): string {
  const lower = p.toLowerCase();
  return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`, "i");
}

/**
 * Returns true if the given site-root-relative path (e.g. "/cloudflare",
 * "/legal/terms.html") matches an entry in SITEMAP_BLACKLIST and should be
 * excluded from the sitemap.
 */
export function isBlacklisted(urlPath: string): boolean {
  const target = normalize(urlPath);

  return SITEMAP_BLACKLIST.some((entry) => {
    const normalizedEntry = normalize(entry);
    if (normalizedEntry.includes("*")) {
      return globToRegExp(normalizedEntry).test(target);
    }
    return normalizedEntry === target;
  });
}
