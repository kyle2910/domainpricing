#!/usr/bin/env python3
"""
average_tld_price.py

Scans all CSV files in the `csv/` directory (each file represents one
registrar, with columns: tld,registration,renewal), computes the average
registration/renewal price for each TLD, and writes the result to
`average.csv`.

If a TLD is only offered by some registrars, only those registrars are
used to compute the average for that TLD (a missing TLD is not treated
as 0, and it does not cause the TLD to be skipped).

Run from the project root (domainpricing):
    python3 average_tld_price.py
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict

# Project root = directory containing this script
PROJECT_ROOT = Path(__file__).resolve().parent
CSV_DIR = PROJECT_ROOT / "csv"
OUTPUT_FILE = CSV_DIR / "average.csv"


def read_registrar_csv(path: Path):
    """Read a single registrar CSV file, return {tld: (registration, renewal)}."""
    data = {}
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tld = (row.get("tld") or "").strip().lower()
            if not tld:
                continue
            try:
                registration = float(row["registration"])
            except (TypeError, ValueError):
                registration = None
            try:
                renewal = float(row["renewal"])
            except (TypeError, ValueError):
                renewal = None

            # Skip rows with no usable price data at all
            if registration is None and renewal is None:
                continue

            data[tld] = (registration, renewal)
    return data


def main():
    if not CSV_DIR.is_dir():
        print(f"CSV directory not found: {CSV_DIR}", file=sys.stderr)
        sys.exit(1)

    csv_files = sorted(
        f for f in CSV_DIR.glob("*.csv") if f.resolve() != OUTPUT_FILE.resolve()
    )
    if not csv_files:
        print(f"No .csv files found in: {CSV_DIR}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(csv_files)} CSV file(s) in {CSV_DIR}:")
    for f in csv_files:
        print(f"  - {f.name}")

    # tld -> list of registration values collected across registrars
    registration_values = defaultdict(list)
    # tld -> list of renewal values collected across registrars
    renewal_values = defaultdict(list)
    # tld -> list of registrar names that offer this tld (for reporting)
    tld_sources = defaultdict(list)

    for csv_file in csv_files:
        registrar_name = csv_file.stem  # e.g. "spaceship.com"
        registrar_data = read_registrar_csv(csv_file)
        for tld, (registration, renewal) in registrar_data.items():
            # Only include this registrar's value if it actually has one;
            # registrars without this tld simply don't contribute here.
            if registration is not None:
                registration_values[tld].append(registration)
            if renewal is not None:
                renewal_values[tld].append(renewal)
            tld_sources[tld].append(registrar_name)

    all_tlds = sorted(set(registration_values.keys()) | set(renewal_values.keys()))

    rows = []
    for tld in all_tlds:
        reg_list = registration_values.get(tld, [])
        ren_list = renewal_values.get(tld, [])

        # Average only over registrars that actually have a value for this tld
        avg_registration = round(sum(reg_list) / len(reg_list), 2) if reg_list else ""
        avg_renewal = round(sum(ren_list) / len(ren_list), 2) if ren_list else ""

        rows.append({
            "tld": tld,
            "registration": avg_registration,
            "renewal": avg_renewal,
            "registrar_count": len(tld_sources[tld]),  # how many registrars offer this tld
        })

    with OUTPUT_FILE.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["tld", "registration", "renewal", "registrar_count"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nWrote {len(rows)} TLD(s) to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
