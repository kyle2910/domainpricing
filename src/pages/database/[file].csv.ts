import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";
import { getAllRegistrars } from "../../lib/registrars";

export function getStaticPaths() {
  const registrars = getAllRegistrars();
  return registrars.map((r) => ({
    params: { file: r.id },
  }));
}

const CSV_DIR = path.resolve(process.cwd(), "csv");

export const GET: APIRoute = ({ params }) => {
  const { file } = params;
  const filePath = path.join(CSV_DIR, `${file}.csv`);

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const body = fs.readFileSync(filePath, "utf-8");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
};
