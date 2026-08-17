import type { APIRoute } from "astro";
import { getAllRegistrars } from "../lib/registrars";

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "https://domainpricing.net";
  const registrars = getAllRegistrars();
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: `${base}/`, priority: "1.0" },
    ...registrars
      .filter((r) => r.id !== "average")
      .map((r) => ({ loc: `${base}/${r.slug}`, priority: "0.8" })),
  ];

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
