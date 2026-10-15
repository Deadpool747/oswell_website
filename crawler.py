from __future__ import annotations

import csv
import logging
import os
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

from parser import ParsedPage, extract_page_metadata
from utils import (
    backoff_delay,
    canonical_url,
    ensure_directory,
    load_yaml_config,
    normalize_whitespace,
    random_delay,
    robots_allowed,
    same_root_domain,
    safe_urljoin,
)

try:
    from playwright.sync_api import sync_playwright
except Exception:  # pragma: no cover - optional dependency
    sync_playwright = None


@dataclass
class CompanyCandidate:
    company_name: str
    website: str
    country: str = ""
    state: str = ""
    city: str = ""
    industry: str = ""
    source_url: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


class CompanyCrawler:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        crawl = self.config.get("crawl", {})
        self.max_pages = int(crawl.get("max_pages_per_company", 8))
        self.request_timeout = int(crawl.get("request_timeout_seconds", 20))
        self.retries = int(crawl.get("retries", 3))
        self.backoff_factor = float(crawl.get("backoff_factor", 2.0))
        self.delay_min = float(crawl.get("delay_min_seconds", 1.0))
        self.delay_max = float(crawl.get("delay_max_seconds", 4.0))
        self.user_agent = crawl.get("user_agent", "ExecutiveLeadGen/1.0")
        self.respect_robots_txt = bool(crawl.get("respect_robots_txt", True))
        self.enable_playwright = bool(crawl.get("enable_playwright", True))
        self.follow_internal_links = bool(crawl.get("follow_internal_links", True))
        self.additional_link_budget = int(crawl.get("additional_link_budget", 4))
        self.candidate_paths = crawl.get(
            "candidate_paths",
            ["/", "/about", "/about-us", "/team", "/leadership", "/company", "/our-team", "/management", "/contact"],
        )
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})

    def discover_company_websites(self) -> list[CompanyCandidate]:
        discovery = self.config.get("discovery", {})
        candidates: list[CompanyCandidate] = []
        countries = {normalize_whitespace(item).lower() for item in discovery.get("countries", []) or [] if normalize_whitespace(item)}
        industries = {normalize_whitespace(item).lower() for item in discovery.get("industries", []) or [] if normalize_whitespace(item)}
        keywords = [normalize_whitespace(item).lower() for item in discovery.get("keywords", []) or [] if normalize_whitespace(item)]

        seed_urls = discovery.get("seed_urls", []) or []
        for url in seed_urls:
            normalized = canonical_url(url)
            candidates.append(
                CompanyCandidate(
                    company_name=urlparse(normalized).netloc.split(".")[0].title(),
                    website=normalized,
                    source_url=normalized,
                )
            )

        csv_paths = []
        if discovery.get("seed_companies_csv"):
            csv_paths.append(discovery["seed_companies_csv"])
        csv_paths.extend(discovery.get("additional_source_csvs", []) or [])

        for csv_path in csv_paths:
            path = Path(csv_path)
            if not path.exists():
                continue
            with path.open("r", encoding="utf-8-sig", newline="") as handle:
                reader = csv.DictReader(handle)
                for row in reader:
                    website = normalize_whitespace(row.get("website", ""))
                    if not website:
                        continue
                    website = canonical_url(website)
                    candidates.append(
                        CompanyCandidate(
                            company_name=normalize_whitespace(row.get("company") or row.get("company_name") or urlparse(website).netloc),
                            website=website,
                            country=normalize_whitespace(row.get("country", "")),
                            state=normalize_whitespace(row.get("state", "")),
                            city=normalize_whitespace(row.get("city", "")),
                            industry=normalize_whitespace(row.get("industry", "")),
                            source_url=normalize_whitespace(row.get("source_url", "")),
                            metadata=row,
                        )
                    )

        candidates = [candidate for candidate in candidates if self._candidate_matches_filters(candidate, countries, industries, keywords)]
        max_discovered = int(discovery.get("max_discovered_companies", 1000))
        if len(candidates) > max_discovered:
            candidates = candidates[:max_discovered]
        return candidates

    def crawl_company(self, candidate: CompanyCandidate | dict[str, Any]) -> list[ParsedPage]:
        company = self._coerce_candidate(candidate)
        base_url = company.website
        pages: list[ParsedPage] = []
        visited: set[str] = set()
        queue: list[str] = self._candidate_urls(base_url)

        while queue and len(pages) < self.max_pages:
            url = queue.pop(0)
            if url in visited:
                continue
            visited.add(url)

            if self.respect_robots_txt and not robots_allowed(url, self.user_agent):
                self.logger.info("robots.txt disallows %s", url)
                continue

            response = self._fetch(url)
            if response is None:
                continue

            html, final_url, status_code = response
            if not html:
                continue

            page = extract_page_metadata(html, url, final_url, status_code)
            pages.append(page)

            if self.follow_internal_links and len(pages) < self.max_pages:
                discovered = []
                for link in page.links:
                    if same_root_domain(base_url, link) and link not in visited:
                        discovered.append(link)
                random.shuffle(discovered)
                for link in discovered[: self.additional_link_budget]:
                    if link not in queue and len(queue) + len(pages) < self.max_pages * 3:
                        queue.append(link)

        return pages

    def _coerce_candidate(self, candidate: CompanyCandidate | dict[str, Any]) -> CompanyCandidate:
        if isinstance(candidate, CompanyCandidate):
            return candidate
        return CompanyCandidate(
            company_name=normalize_whitespace(candidate.get("company_name") or candidate.get("company") or ""),
            website=canonical_url(candidate.get("website", "")),
            country=normalize_whitespace(candidate.get("country", "")),
            state=normalize_whitespace(candidate.get("state", "")),
            city=normalize_whitespace(candidate.get("city", "")),
            industry=normalize_whitespace(candidate.get("industry", "")),
            source_url=normalize_whitespace(candidate.get("source_url", "")),
            metadata=candidate.get("metadata", {}) or candidate,
        )

    def _candidate_urls(self, website: str) -> list[str]:
        base = canonical_url(website)
        urls = [base]
        for path in self.candidate_paths:
            urls.append(safe_urljoin(base, path))
        deduped = []
        seen = set()
        for url in urls:
            if url not in seen:
                seen.add(url)
                deduped.append(url)
        return deduped

    def _candidate_matches_filters(
        self,
        candidate: CompanyCandidate,
        countries: set[str],
        industries: set[str],
        keywords: list[str],
    ) -> bool:
        if countries:
            if candidate.country and candidate.country.lower() not in countries:
                return False
        if industries:
            if candidate.industry and candidate.industry.lower() not in industries:
                return False
        if keywords:
            haystack = " ".join(
                [
                    candidate.company_name,
                    candidate.website,
                    candidate.country,
                    candidate.state,
                    candidate.city,
                    candidate.industry,
                    candidate.source_url,
                    " ".join(str(value) for value in candidate.metadata.values()),
                ]
            ).lower()
            if not any(keyword in haystack for keyword in keywords):
                return False
        return True

    def _fetch(self, url: str) -> tuple[str, str, int] | None:
        for attempt in range(1, self.retries + 1):
            try:
                random_delay(self.delay_min, self.delay_max)
                response = self.session.get(url, timeout=self.request_timeout, allow_redirects=True)
                status = response.status_code
                final_url = canonical_url(response.url)
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type:
                    self.logger.info("Skipping non-HTML content: %s (%s)", final_url, content_type)
                    return None
                html = response.text or ""
                if self._needs_browser_render(status, html):
                    rendered = self._render_with_playwright(url)
                    if rendered:
                        return rendered
                return html, final_url, status
            except requests.RequestException as exc:
                self.logger.warning("Fetch failed (%s/%s) for %s: %s", attempt, self.retries, url, exc)
                if attempt < self.retries:
                    import time

                    time.sleep(backoff_delay(attempt, self.backoff_factor))
                continue
            except Exception as exc:
                self.logger.exception("Unexpected fetch error for %s: %s", url, exc)
                return None

        if self.enable_playwright:
            return self._render_with_playwright(url)
        return None

    def _needs_browser_render(self, status: int, html: str) -> bool:
        if not self.enable_playwright:
            return False
        if status in {403, 429}:
            return True
        lower = (html or "").lower()
        return len(lower) < 800 or "enable javascript" in lower or "please enable javascript" in lower

    def _render_with_playwright(self, url: str) -> tuple[str, str, int] | None:
        if sync_playwright is None:
            return None
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent=self.user_agent, viewport={"width": 1440, "height": 1600})
                page.goto(url, wait_until="networkidle", timeout=self.request_timeout * 1000)
                html = page.content()
                final_url = canonical_url(page.url)
                browser.close()
                return html, final_url, 200
        except Exception as exc:
            self.logger.warning("Playwright render failed for %s: %s", url, exc)
            return None
