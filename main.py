from __future__ import annotations

import argparse
import concurrent.futures
import logging
import sys
from logging.handlers import RotatingFileHandler
from typing import Any

from crawler import CompanyCrawler
from database import LeadGenDatabase
from discovery import RegistryDiscoveryManager
from exporter import export_results
from extractor import ExecutiveExtractor
from utils import compact_hash, ensure_directory, load_yaml_config, normalize_whitespace, utc_now_iso


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Public executive lead generation crawler")
    parser.add_argument("--config", default="config.yaml", help="Path to config.yaml")
    parser.add_argument("--limit", type=int, default=None, help="Limit the number of companies processed")
    parser.add_argument("--target-leads", type=int, default=None, help="Stop after this many executive leads are stored")
    parser.add_argument("--batch-size", type=int, default=None, help="Number of companies to process per batch")
    parser.add_argument("--resume", action="store_true", help="Resume from the SQLite state store")
    parser.add_argument("--discover-only", action="store_true", help="Only build the company queue and exit")
    return parser


def setup_logging(config: dict[str, Any]) -> logging.Logger:
    level_name = normalize_whitespace(config.get("logging", {}).get("level", "INFO")).upper()
    level = getattr(logging, level_name, logging.INFO)
    logger = logging.getLogger("executive_leadgen")
    logger.setLevel(level)
    logger.handlers.clear()
    logger.propagate = False

    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    logger.addHandler(console)

    log_dir = ensure_directory(config.get("app", {}).get("log_dir", "./logs"))
    file_handler = RotatingFileHandler(log_dir / "leadgen.log", maxBytes=5_000_000, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger


def build_company_dict(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        "company_name": normalize_whitespace(candidate.get("company_name", "")),
        "website": normalize_whitespace(candidate.get("website", "")),
        "country": normalize_whitespace(candidate.get("country", "")),
        "state": normalize_whitespace(candidate.get("state", "")),
        "city": normalize_whitespace(candidate.get("city", "")),
        "industry": normalize_whitespace(candidate.get("industry", "")),
        "source_url": normalize_whitespace(candidate.get("source_url", "")),
        "description": normalize_whitespace(candidate.get("description", "")),
        "employee_count": normalize_whitespace(candidate.get("employee_count", "")),
        "metadata": candidate.get("metadata", {}) or {},
    }


def candidate_signature(candidate: dict[str, Any]) -> tuple[str, str]:
    return (
        normalize_whitespace(candidate.get("website", "")).lower(),
        normalize_whitespace(candidate.get("company_name", "")).lower(),
    )


def main() -> int:
    args = build_parser().parse_args()
    config = load_yaml_config(args.config)
    logger = setup_logging(config)

    app_config = config.get("app", {})
    crawl_config = config.get("crawl", {})
    output_dir = ensure_directory(app_config.get("output_dir", "./output"))
    db_path = app_config.get("database_path", "./data/leadgen.sqlite3")
    database = LeadGenDatabase(db_path)
    crawler = CompanyCrawler(config, logger)
    registry_discovery = RegistryDiscoveryManager(config, logger, cache_backend=database)
    extractor = ExecutiveExtractor(config, logger)
    target_leads = max(int(args.target_leads or app_config.get("target_leads", 0) or 0), 0)
    batch_size = max(int(args.batch_size or crawl_config.get("batch_size", max(int(crawl_config.get("concurrency", 4)), 1) * 4)), 1)

    try:
        if args.discover_only:
            discovered_only = crawler.discover_company_websites()
            discovered_only.extend(registry_discovery.discover())
            inserted = 0
            seen: set[tuple[str, str]] = set()
            for candidate in discovered_only:
                candidate_dict = candidate.__dict__ if hasattr(candidate, "__dict__") else dict(candidate)
                signature = candidate_signature(candidate_dict)
                if signature in seen:
                    continue
                seen.add(signature)
                company_dict = build_company_dict(candidate_dict)
                if not company_dict["website"]:
                    continue
                database.upsert_company(company_dict)
                inserted += 1
            logger.info("Discovery-only mode completed with %s companies", inserted)
            return 0

        pending_map: dict[int, dict[str, Any]] = {}
        if args.resume or bool(app_config.get("resume", True)):
            for row in database.fetch_pending_companies():
                pending_map[int(row["id"])] = row

        discovered = crawler.discover_company_websites()
        discovered.extend(registry_discovery.discover())
        discovered_count = 0
        seen_candidates: set[tuple[str, str]] = set()
        for candidate in discovered:
            candidate_dict = candidate.__dict__ if hasattr(candidate, "__dict__") else dict(candidate)
            signature = candidate_signature(candidate_dict)
            if signature in seen_candidates:
                continue
            seen_candidates.add(signature)
            company_dict = build_company_dict(candidate_dict)
            if not company_dict["website"]:
                continue
            company_id = database.upsert_company(company_dict)
            company_row = database.fetch_company(company_id)
            if not company_row:
                continue
            discovered_count += 1
            if company_row.get("crawl_status") in {"pending", "retry"}:
                pending_map[int(company_id)] = company_row

        pending = sorted(pending_map.values(), key=lambda row: int(row["id"]))
        if args.limit:
            pending = pending[: args.limit]

        if target_leads:
            current_leads = database.count_executives()
            if current_leads >= target_leads:
                logger.info("Target lead count already reached (%s/%s)", current_leads, target_leads)
        lead_count = database.count_executives()
        logger.info(
            "Discovery yielded %s candidates, %s queued for processing, %s leads currently stored",
            discovered_count,
            len(pending),
            lead_count,
        )

        concurrency = max(int(config.get("crawl", {}).get("concurrency", 4)), 1)
        logger.info("Processing %s companies with concurrency=%s", len(pending), concurrency)

        def process_company(company_row: dict[str, Any]) -> tuple[int, dict[str, Any], list[Any], Any, list[dict[str, Any]]]:
            company = build_company_dict(company_row)
            company_id = int(company_row["id"])
            pages = crawler.crawl_company(company)
            extraction = extractor.extract(company, pages)
            executive_rows = []

            for executive in extraction.executives:
                row = {
                    "name": executive.name,
                    "title": executive.title,
                    "normalized_title": executive.title,
                    "email": executive.email,
                    "phone": executive.phone,
                    "linkedin": executive.linkedin,
                    "twitter": executive.twitter,
                    "source_url": pages[0].final_url if pages else company.get("website", ""),
                    "source_confidence": 0.9 if executive.name and executive.title else 0.5,
                }
                executive_rows.append(row)
            return company_id, company, pages, extraction, executive_rows

        processed = 0
        while pending:
            if target_leads:
                lead_count = database.count_executives()
                if lead_count >= target_leads:
                    logger.info("Target lead count reached (%s/%s)", lead_count, target_leads)
                    break

            batch = pending[:batch_size]
            pending = pending[batch_size:]
            logger.info("Processing batch of %s companies (%s remaining)", len(batch), len(pending))

            with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor_pool:
                futures = {executor_pool.submit(process_company, row): row for row in batch}
                for future in concurrent.futures.as_completed(futures):
                    company_row = futures[future]
                    try:
                        company_id, company, pages, extraction, executive_rows = future.result()
                    except Exception as exc:
                        logger.exception("Failed processing company %s: %s", company_row.get("website"), exc)
                        database.mark_company_crawled(int(company_row["id"]), status="retry")
                        continue

                    for page in pages:
                        database.record_log("visited_page", f"Visited {page.final_url}", company_id, page.final_url)
                        database.record_page(
                            company_id,
                            {
                                "url": page.url,
                                "final_url": page.final_url,
                                "status_code": page.status_code,
                                "title": page.title,
                                "content_hash": compact_hash(page.raw_html),
                                "fetched_at": utc_now_iso(),
                            },
                        )

                    if extraction.company or extraction.description or extraction.employee_count:
                        database.update_company_profile(
                            company_id,
                            {
                                "company_name": extraction.company,
                                "description": extraction.description,
                                "employee_count": extraction.employee_count,
                            },
                        )

                    inserted = 0
                    for executive_row in executive_rows:
                        if database.upsert_executive(company_id, company, executive_row):
                            inserted += 1
                    if inserted:
                        logger.info(
                            "Extracted %s executive record(s) from %s",
                            inserted,
                            company.get("website"),
                        )
                    database.mark_company_crawled(company_id, status="completed")
                    processed += 1

                    if target_leads and database.count_executives() >= target_leads:
                        logger.info(
                            "Lead target reached after %s companies",
                            processed,
                        )
                        pending = []
                        break

        rows = database.fetch_all_executives()
        csv_path, json_path = export_results(
            rows,
            str(output_dir),
            config.get("export", {}).get("csv_path", "executive_leads.csv"),
            config.get("export", {}).get("json_path", "executive_leads.json"),
            pretty_json=bool(config.get("export", {}).get("pretty_json", True)),
        )
        logger.info("Exported %s records to %s and %s", len(rows), csv_path, json_path)
        logger.info("Processed %s companies total", processed)
        if target_leads:
            logger.info("Lead target: %s, current leads stored: %s", target_leads, len(rows))
        return 0
    finally:
        database.close()


if __name__ == "__main__":
    raise SystemExit(main())
