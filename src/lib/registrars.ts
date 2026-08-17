import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

export interface TldRow {
  tld: string;
  registration: number;
  renewal: number;
}

export interface Registrar {
  /** filename without .csv, e.g. "cloudflare.com" or "average" */
  id: string;
  /** URL slug, e.g. "cloudflare" (".com" stripped), "average" stays "average" */
  slug: string;
  /** Display name, e.g. "Cloudflare" */
  name: string;
  rows: TldRow[];
}

const CSV_DIR = path.resolve(process.cwd(), "csv");

/**
 * Turns a filename id like "cloudflare.com" or "gandi.net" into a short
 * display name: takes the part before the first dot, capitalizes it.
 * "average" -> "Average"
 */
function toDisplayName(id: string): string {
  const base = id.split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Turns a filename id into a URL slug by stripping a trailing ".com" only.
 * Other TLD-bearing ids (e.g. "gandi.net") keep their suffix so slugs stay
 * unique: "gandi.net" -> "gandi.net", "cloudflare.com" -> "cloudflare".
 */
function toSlug(id: string): string {
  return id.endsWith(".com") ? id.slice(0, -4) : id;
}

function parseCsv(raw: string): TldRow[] {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data
    .filter((r) => r.tld)
    .map((r) => ({
      tld: r.tld.trim().toLowerCase(),
      registration: parseFloat(r.registration),
      renewal: parseFloat(r.renewal),
    }))
    .filter((r) => Number.isFinite(r.registration) && Number.isFinite(r.renewal))
    .sort((a, b) => a.tld.localeCompare(b.tld));
}

let cache: Registrar[] | null = null;

/** Reads every *.csv file in /csv and returns parsed registrar data. */
export function getAllRegistrars(): Registrar[] {
  if (cache) return cache;

  if (!fs.existsSync(CSV_DIR)) {
    cache = [];
    return cache;
  }

  const files = fs
    .readdirSync(CSV_DIR)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort();

  cache = files.map((file) => {
    const id = file.slice(0, -4); // strip ".csv"
    const raw = fs.readFileSync(path.join(CSV_DIR, file), "utf-8");
    return {
      id,
      slug: toSlug(id),
      name: toDisplayName(id),
      rows: parseCsv(raw),
    };
  });

  return cache;
}

/** Returns just the registrars that aren't the "average" summary page. */
export function getRegistrarPages(): Registrar[] {
  return getAllRegistrars().filter((r) => r.id !== "average");
}

/** Returns the "average" registrar used for the homepage, if present. */
export function getAverageRegistrar(): Registrar | undefined {
  return getAllRegistrars().find((r) => r.id === "average");
}
