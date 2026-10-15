from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

from .client import ApolloClient
from .oswell_icp import build_oswell_people_params
from .ranker import extract_people_records, rank_prospects


def _load_records(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return extract_people_records(data)
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        raise ValueError(f"Unsupported JSON structure in {path}")

    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8", newline="") as handle:
            return list(csv.DictReader(handle))

    raise ValueError(f"Unsupported input format: {path.suffix}")


def _split_name(full_name: str) -> tuple[str | None, str | None]:
    parts = [part for part in full_name.strip().split() if part]
    if len(parts) < 2:
        return None, None
    return parts[0], " ".join(parts[1:])


def _build_enrich_params(record: dict[str, Any]) -> dict[str, Any]:
    name = record.get("name") or record.get("full_name") or record.get("person_name") or ""
    first_name, last_name = _split_name(str(name)) if name else (None, None)
    params: dict[str, Any] = {
        "first_name": first_name,
        "last_name": last_name,
        "name": name or None,
        "email": record.get("email") or None,
        "domain": record.get("domain") or record.get("organization_domain") or None,
        "linkedin_url": record.get("linkedin_url") or None,
        "id": record.get("id") or record.get("person_id") or None,
        "organization_name": record.get("organization_name") or record.get("company") or None,
    }
    return {key: value for key, value in params.items() if value not in (None, "")}


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["score", "reasons", "name", "title", "company", "industry", "location", "email_status", "linkedin_url", "email"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def _normalize_ranked_output(ranked) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for item in ranked:
        record = item.record
        rows.append(
            {
                "score": item.score,
                "reasons": "; ".join(item.reasons),
                "name": record.get("name") or record.get("full_name") or record.get("person_name") or "",
                "title": record.get("title") or record.get("job_title") or record.get("person_title") or record.get("headline") or "",
                "company": record.get("organization_name") or record.get("company") or record.get("account_name") or "",
                "industry": record.get("organization_industry") or record.get("industry") or "",
                "location": record.get("organization_location") or record.get("person_location") or record.get("location") or "",
                "email_status": record.get("contact_email_status") or record.get("email_status") or "",
                "linkedin_url": record.get("linkedin_url") or "",
                "email": record.get("email") or "",
            }
        )
    return rows


def cmd_health(args: argparse.Namespace) -> int:
    client = ApolloClient(api_key=args.api_key)
    print(json.dumps(client.health(), indent=2))
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    client = ApolloClient(api_key=args.api_key)
    payload = client.search_people(params=build_oswell_people_params(page=args.page, per_page=args.per_page))
    records = extract_people_records(payload)

    if args.enrich_top:
        enriched: list[dict[str, Any]] = []
        for record in records[: args.enrich_top]:
            try:
                enriched_payload = client.enrich_person(**_build_enrich_params(record))
                if isinstance(enriched_payload, dict):
                    record = {**record, **enriched_payload}
            except Exception as exc:  # pragma: no cover - network/runtime path
                record = {**record, "enrich_error": str(exc)}
            enriched.append(record)
        records = enriched + records[args.enrich_top :]

    ranked = rank_prospects(records)
    rows = _normalize_ranked_output(ranked)

    if args.output:
        output_path = Path(args.output)
        _write_csv(output_path, rows)
        print(f"Wrote {len(rows)} ranked prospects to {output_path}")
    else:
        print(json.dumps(rows[: args.limit], indent=2))
    return 0


def cmd_rank(args: argparse.Namespace) -> int:
    records = _load_records(Path(args.input))
    ranked = rank_prospects(records)
    rows = _normalize_ranked_output(ranked[: args.limit])

    if args.output:
        output_path = Path(args.output)
        _write_csv(output_path, rows)
        print(f"Wrote {len(rows)} ranked prospects to {output_path}")
    else:
        print(json.dumps(rows, indent=2))
    return 0


def cmd_dry_run(_: argparse.Namespace) -> int:
    sample = [
        {
            "name": "Asha Patel",
            "title": "Founder",
            "organization_name": "FastRoute Logistics",
            "organization_industry": "Logistics",
            "organization_location": "India",
            "contact_email_status": "verified",
            "linkedin_url": "https://linkedin.com/in/example",
            "email": "[redacted]",
        },
        {
            "name": "Rohan Mehta",
            "title": "Finance Manager",
            "organization_name": "Generic Services",
            "organization_industry": "Professional Services",
            "organization_location": "India",
            "contact_email_status": "verified",
        },
    ]
    ranked = rank_prospects(sample)
    print(json.dumps(_normalize_ranked_output(ranked), indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Apollo prospecting helper for Oswell Technologies")
    parser.add_argument("--api-key", help="Apollo API key. Prefer APOLLO_API_KEY env var.")

    subparsers = parser.add_subparsers(dest="command", required=True)

    health = subparsers.add_parser("health", help="Test the Apollo API key")
    health.set_defaults(func=cmd_health)

    search = subparsers.add_parser("search", help="Search Apollo people using the Oswell ICP")
    search.add_argument("--page", type=int, default=1)
    search.add_argument("--per-page", type=int, default=25)
    search.add_argument("--enrich-top", type=int, default=0, help="Enrich the first N prospects before ranking")
    search.add_argument("--limit", type=int, default=10)
    search.add_argument("--output", help="Write ranked output to CSV")
    search.set_defaults(func=cmd_search)

    rank = subparsers.add_parser("rank", help="Rank an exported CSV or JSON file")
    rank.add_argument("--input", required=True, help="CSV or JSON input file")
    rank.add_argument("--limit", type=int, default=50)
    rank.add_argument("--output", help="Write ranked output to CSV")
    rank.set_defaults(func=cmd_rank)

    dry_run = subparsers.add_parser("dry-run", help="Run the scoring logic on local sample data")
    dry_run.set_defaults(func=cmd_dry_run)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
