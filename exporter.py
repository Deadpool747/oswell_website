from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from leadgen_quality import dedupe_executive_rows
from utils import ensure_directory, normalize_whitespace


EXPORT_COLUMNS = [
    "Company",
    "Website",
    "Executive Name",
    "Title",
    "Email",
    "Phone",
    "LinkedIn",
    "Twitter/X",
    "Country",
    "State",
    "City",
    "Industry",
    "Source URL",
    "Last Crawled",
]


def export_results(rows: list[dict[str, Any]], output_dir: str, csv_name: str, json_name: str, pretty_json: bool = True) -> tuple[Path, Path]:
    output_path = ensure_directory(output_dir)
    csv_path = output_path / csv_name
    json_path = output_path / json_name

    normalized_rows = [_normalize_row(row) for row in dedupe_executive_rows(rows)]
    df = pd.DataFrame(normalized_rows, columns=EXPORT_COLUMNS)
    df.to_csv(csv_path, index=False)
    json_path.write_text(
        json.dumps(normalized_rows, indent=2 if pretty_json else None, ensure_ascii=False),
        encoding="utf-8",
    )
    return csv_path, json_path


def _normalize_row(row: dict[str, Any]) -> dict[str, str]:
    return {
        "Company": normalize_whitespace(row.get("company_name", "")),
        "Website": normalize_whitespace(row.get("website", "")),
        "Executive Name": normalize_whitespace(row.get("name", "")),
        "Title": normalize_whitespace(row.get("normalized_title") or row.get("title", "")),
        "Email": normalize_whitespace(row.get("email", "")),
        "Phone": normalize_whitespace(row.get("phone", "")),
        "LinkedIn": normalize_whitespace(row.get("linkedin", "")),
        "Twitter/X": normalize_whitespace(row.get("twitter", "")),
        "Country": normalize_whitespace(row.get("country", "")),
        "State": normalize_whitespace(row.get("state", "")),
        "City": normalize_whitespace(row.get("city", "")),
        "Industry": normalize_whitespace(row.get("industry", "")),
        "Source URL": normalize_whitespace(row.get("source_url", "")),
        "Last Crawled": normalize_whitespace(row.get("last_crawled", "")),
    }
