from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from leadgen_quality import canonical_lead_key, dedupe_executive_rows
from exporter import export_results
from utils import utc_now_iso, load_yaml_config


def main() -> int:
    config = load_yaml_config(ROOT / "config.yaml")
    db_path = Path(config.get("app", {}).get("database_path", "./data/leadgen.sqlite3"))
    output_dir = config.get("app", {}).get("output_dir", "./output")
    csv_name = config.get("export", {}).get("csv_path", "executive_leads.csv")
    json_name = config.get("export", {}).get("json_path", "executive_leads.json")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        raw_rows = [dict(row) for row in conn.execute("SELECT * FROM executives").fetchall()]
        cleaned_rows = dedupe_executive_rows(raw_rows)
        now = utc_now_iso()

        with conn:
            conn.execute("DELETE FROM executives")
            for row in cleaned_rows:
                dedupe_key = canonical_lead_key(
                    row.get("name", ""),
                    row.get("company_name", ""),
                    row.get("website", ""),
                    row.get("email", ""),
                )
                conn.execute(
                    """
                    INSERT INTO executives (
                        company_id, company_name, website, name, title, normalized_title,
                        email, phone, linkedin, twitter, country, state, city, industry,
                        source_url, source_confidence, last_crawled, dedupe_key, raw_json,
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        row.get("company_id"),
                        row.get("company_name", ""),
                        row.get("website", ""),
                        row.get("name", ""),
                        row.get("title", ""),
                        row.get("normalized_title", row.get("title", "")),
                        row.get("email", ""),
                        row.get("phone", ""),
                        row.get("linkedin", ""),
                        row.get("twitter", ""),
                        row.get("country", ""),
                        row.get("state", ""),
                        row.get("city", ""),
                        row.get("industry", ""),
                        row.get("source_url", ""),
                        row.get("source_confidence", 0.5),
                        row.get("last_crawled", now),
                        dedupe_key,
                        row.get("raw_json", json.dumps(row, ensure_ascii=False)),
                        row.get("created_at", now),
                        row.get("updated_at", now),
                    ),
                )

        csv_path, json_path = export_results(cleaned_rows, output_dir, csv_name, json_name, pretty_json=True)
        print(f"Cleaned {len(cleaned_rows)} executive rows")
        print(f"Exported {csv_path}")
        print(f"Exported {json_path}")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
