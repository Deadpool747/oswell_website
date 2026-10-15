from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from leadgen_quality import canonical_lead_key, dedupe_executive_rows, normalize_executive_row
from utils import compact_hash, ensure_directory, normalize_title, normalize_whitespace, utc_now_iso


class LeadGenDatabase:
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        ensure_directory(self.db_path.parent)
        self.connection = sqlite3.connect(self.db_path)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA journal_mode=WAL;")
        self.connection.execute("PRAGMA foreign_keys=ON;")
        self.initialize()

    def initialize(self) -> None:
        with self.connection:
            self.connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_name TEXT NOT NULL,
                    website TEXT NOT NULL,
                    country TEXT DEFAULT '',
                    state TEXT DEFAULT '',
                    city TEXT DEFAULT '',
                    industry TEXT DEFAULT '',
                    source_url TEXT DEFAULT '',
                    description TEXT DEFAULT '',
                    employee_count TEXT DEFAULT '',
                    crawl_status TEXT DEFAULT 'pending',
                    discovered_at TEXT DEFAULT '',
                    last_crawled TEXT DEFAULT '',
                    metadata_json TEXT DEFAULT '',
                    UNIQUE(website)
                );

                CREATE TABLE IF NOT EXISTS pages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER NOT NULL,
                    url TEXT NOT NULL,
                    final_url TEXT DEFAULT '',
                    status_code INTEGER DEFAULT 0,
                    title TEXT DEFAULT '',
                    content_hash TEXT DEFAULT '',
                    fetched_at TEXT DEFAULT '',
                    error TEXT DEFAULT '',
                    method TEXT DEFAULT 'requests',
                    UNIQUE(company_id, url),
                    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS executives (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER NOT NULL,
                    company_name TEXT NOT NULL,
                    website TEXT NOT NULL,
                    name TEXT NOT NULL,
                    title TEXT NOT NULL,
                    normalized_title TEXT DEFAULT '',
                    email TEXT DEFAULT '',
                    phone TEXT DEFAULT '',
                    linkedin TEXT DEFAULT '',
                    twitter TEXT DEFAULT '',
                    country TEXT DEFAULT '',
                    state TEXT DEFAULT '',
                    city TEXT DEFAULT '',
                    industry TEXT DEFAULT '',
                    source_url TEXT DEFAULT '',
                    source_confidence REAL DEFAULT 0.0,
                    last_crawled TEXT DEFAULT '',
                    dedupe_key TEXT NOT NULL,
                    raw_json TEXT DEFAULT '',
                    created_at TEXT DEFAULT '',
                    updated_at TEXT DEFAULT '',
                    UNIQUE(dedupe_key),
                    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS crawl_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER DEFAULT NULL,
                    url TEXT DEFAULT '',
                    event_type TEXT NOT NULL,
                    message TEXT DEFAULT '',
                    created_at TEXT DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    expires_at TEXT DEFAULT ''
                );

                CREATE INDEX IF NOT EXISTS idx_executives_company ON executives(company_id);
                CREATE INDEX IF NOT EXISTS idx_pages_company ON pages(company_id);
                CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(crawl_status);
                CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
                """
            )

    def close(self) -> None:
        self.connection.close()

    def upsert_company(self, company: dict[str, Any]) -> int:
        now = utc_now_iso()
        metadata_json = json.dumps(company.get("metadata", {}) or {}, ensure_ascii=False)
        values = (
            normalize_whitespace(company.get("company_name", "")),
            normalize_whitespace(company.get("website", "")),
            normalize_whitespace(company.get("country", "")),
            normalize_whitespace(company.get("state", "")),
            normalize_whitespace(company.get("city", "")),
            normalize_whitespace(company.get("industry", "")),
            normalize_whitespace(company.get("source_url", "")),
            normalize_whitespace(company.get("description", "")),
            normalize_whitespace(company.get("employee_count", "")),
            now,
            now,
            metadata_json,
        )
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO companies (
                    company_name, website, country, state, city, industry, source_url,
                    description, employee_count, crawl_status, discovered_at, last_crawled, metadata_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
                ON CONFLICT(website) DO UPDATE SET
                    company_name=excluded.company_name,
                    country=excluded.country,
                    state=excluded.state,
                    city=excluded.city,
                    industry=excluded.industry,
                    source_url=excluded.source_url,
                    description=COALESCE(NULLIF(excluded.description, ''), description),
                    employee_count=COALESCE(NULLIF(excluded.employee_count, ''), employee_count),
                    metadata_json=COALESCE(NULLIF(excluded.metadata_json, ''), metadata_json)
                """,
                values,
            )
        row = self.connection.execute("SELECT id FROM companies WHERE website = ?", (normalize_whitespace(company.get("website", "")),)).fetchone()
        return int(row["id"])

    def mark_company_crawled(self, company_id: int, status: str = "completed") -> None:
        with self.connection:
            self.connection.execute(
                "UPDATE companies SET crawl_status = ?, last_crawled = ? WHERE id = ?",
                (status, utc_now_iso(), company_id),
            )

    def update_company_profile(self, company_id: int, updates: dict[str, Any]) -> None:
        fields = []
        values: list[Any] = []
        for column in ("company_name", "description", "employee_count", "country", "state", "city", "industry", "source_url"):
            if column in updates and normalize_whitespace(str(updates[column])):
                fields.append(f"{column} = ?")
                values.append(normalize_whitespace(str(updates[column])))
        if not fields:
            return
        fields.append("last_crawled = ?")
        values.append(utc_now_iso())
        values.append(company_id)
        with self.connection:
            self.connection.execute(
                f"UPDATE companies SET {', '.join(fields)} WHERE id = ?",
                values,
            )

    def record_page(self, company_id: int, page: dict[str, Any], method: str = "requests") -> None:
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO pages (
                    company_id, url, final_url, status_code, title, content_hash, fetched_at, error, method
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(company_id, url) DO UPDATE SET
                    final_url=excluded.final_url,
                    status_code=excluded.status_code,
                    title=excluded.title,
                    content_hash=excluded.content_hash,
                    fetched_at=excluded.fetched_at,
                    error=excluded.error,
                    method=excluded.method
                """,
                (
                    company_id,
                    normalize_whitespace(page.get("url", "")),
                    normalize_whitespace(page.get("final_url", "")),
                    int(page.get("status_code", 0)),
                    normalize_whitespace(page.get("title", "")),
                    normalize_whitespace(page.get("content_hash", "")),
                    normalize_whitespace(page.get("fetched_at", utc_now_iso())),
                    normalize_whitespace(page.get("error", "")),
                    method,
                ),
            )

    def record_log(self, event_type: str, message: str, company_id: int | None = None, url: str = "") -> None:
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO crawl_logs (company_id, url, event_type, message, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (company_id, normalize_whitespace(url), event_type, message, utc_now_iso()),
            )

    def upsert_executive(self, company_id: int, company: dict[str, Any], executive: dict[str, Any]) -> bool:
        now = utc_now_iso()
        normalized = normalize_executive_row(
            {
                "company_name": company.get("company_name", ""),
                "website": company.get("website", ""),
                "country": company.get("country", ""),
                "state": company.get("state", ""),
                "city": company.get("city", ""),
                "industry": company.get("industry", ""),
                "source_url": executive.get("source_url", company.get("source_url", "")),
                "source_confidence": executive.get("source_confidence", 0.5),
                "name": executive.get("name", ""),
                "title": executive.get("title", ""),
                "normalized_title": executive.get("normalized_title", executive.get("title", "")),
                "email": executive.get("email", ""),
                "phone": executive.get("phone", ""),
                "linkedin": executive.get("linkedin", ""),
                "twitter": executive.get("twitter", ""),
            }
        )
        if not normalized:
            self.record_log("duplicate", "Skipped non-public or invalid executive row", company_id, company.get("source_url", ""))
            return False

        company_name = normalized["company_name"]
        website = normalized["website"]
        name = normalized["name"]
        title = normalized["title"]
        normalized_title = normalized["normalized_title"]
        email = normalized["email"]
        phone = normalized["phone"]
        linkedin = normalized["linkedin"]
        twitter = normalized["twitter"]
        country = normalized["country"]
        state = normalized["state"]
        city = normalized["city"]
        industry = normalized["industry"]
        source_url = normalized["source_url"] or normalize_whitespace(company.get("source_url", ""))
        source_confidence = float(normalized.get("source_confidence", 0.5))
        raw_json = json.dumps(executive, ensure_ascii=False)
        dedupe_key = canonical_lead_key(name, company_name, website, email)

        existing = self.connection.execute(
            "SELECT id FROM executives WHERE dedupe_key = ?",
            (dedupe_key,),
        ).fetchone()
        if existing:
            with self.connection:
                self.connection.execute(
                    """
                    UPDATE executives
                    SET title = COALESCE(NULLIF(?, ''), title),
                        normalized_title = COALESCE(NULLIF(?, ''), normalized_title),
                        email = COALESCE(NULLIF(?, ''), email),
                        phone = COALESCE(NULLIF(?, ''), phone),
                        linkedin = COALESCE(NULLIF(?, ''), linkedin),
                        twitter = COALESCE(NULLIF(?, ''), twitter),
                        source_url = COALESCE(NULLIF(?, ''), source_url),
                        source_confidence = MAX(source_confidence, ?),
                        last_crawled = ?,
                        raw_json = COALESCE(NULLIF(?, ''), raw_json),
                        updated_at = ?
                    WHERE dedupe_key = ?
                    """,
                    (
                        title,
                        normalized_title,
                        email,
                        phone,
                        linkedin,
                        twitter,
                        source_url,
                        source_confidence,
                        now,
                        raw_json,
                        now,
                        dedupe_key,
                    ),
                )
            self.record_log("duplicate", f"Duplicate executive skipped: {name} / {company_name}", company_id, source_url)
            return False

        with self.connection:
            self.connection.execute(
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
                    company_id,
                    company_name,
                    website,
                    name,
                    title,
                    normalized_title,
                    email,
                    phone,
                    linkedin,
                    twitter,
                    country,
                    state,
                    city,
                    industry,
                    source_url,
                    source_confidence,
                    now,
                    dedupe_key,
                    raw_json,
                    now,
                    now,
                ),
            )
        self.record_log("success", f"Extracted executive: {name} / {title}", company_id, source_url)
        return True

    def set_state(self, key: str, value: str) -> None:
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO state (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )

    def get_state(self, key: str, default: str = "") -> str:
        row = self.connection.execute("SELECT value FROM state WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else default

    def get_cache(self, key: str, default: Any = None) -> Any:
        row = self.connection.execute(
            "SELECT value_json, expires_at FROM cache WHERE key = ?",
            (key,),
        ).fetchone()
        if not row:
            return default
        expires_at = normalize_whitespace(row["expires_at"])
        if expires_at and expires_at <= utc_now_iso():
            with self.connection:
                self.connection.execute("DELETE FROM cache WHERE key = ?", (key,))
            return default
        try:
            return json.loads(row["value_json"])
        except Exception:
            return default

    def set_cache(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        now = utc_now_iso()
        expires_at = ""
        if ttl_seconds is not None and ttl_seconds > 0:
            expires_at = datetime.fromisoformat(now.replace("Z", "+00:00")).astimezone(timezone.utc)
            expires_at = (expires_at.timestamp() + ttl_seconds)
            expires_at = datetime.fromtimestamp(expires_at, tz=timezone.utc).replace(microsecond=0).isoformat()
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO cache (key, value_json, created_at, updated_at, expires_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value_json=excluded.value_json,
                    updated_at=excluded.updated_at,
                    expires_at=excluded.expires_at
                """,
                (key, json.dumps(value, ensure_ascii=False), now, now, expires_at),
            )

    def cleanup_cache(self) -> int:
        now = utc_now_iso()
        with self.connection:
            cur = self.connection.execute(
                "DELETE FROM cache WHERE expires_at != '' AND expires_at <= ?",
                (now,),
            )
        return cur.rowcount if cur.rowcount is not None else 0

    def fetch_pending_companies(self, limit: int | None = None) -> list[dict[str, Any]]:
        sql = "SELECT * FROM companies WHERE crawl_status IN ('pending', 'retry') ORDER BY id ASC"
        params: tuple[Any, ...] = ()
        if limit:
            sql += " LIMIT ?"
            params = (limit,)
        rows = self.connection.execute(sql, params).fetchall()
        return [dict(row) for row in rows]

    def fetch_company(self, company_id: int) -> dict[str, Any] | None:
        row = self.connection.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
        return dict(row) if row else None

    def fetch_all_executives(self) -> list[dict[str, Any]]:
        rows = self.connection.execute(
            """
            SELECT company_name, website, name, title, normalized_title, email, phone, linkedin, twitter,
                   country, state, city, industry, source_url, last_crawled
            FROM executives
            ORDER BY company_name ASC, name ASC
            """
        ).fetchall()
        return dedupe_executive_rows([dict(row) for row in rows])

    def count_executives(self) -> int:
        row = self.connection.execute("SELECT COUNT(*) AS total FROM executives").fetchone()
        return int(row["total"]) if row else 0
