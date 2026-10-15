from __future__ import annotations

import csv
import json
import hashlib
import html as html_lib
import os
import logging
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import parse_qs, unquote, urlparse

import requests
from bs4 import BeautifulSoup

from crawler import CompanyCandidate
from utils import canonical_url, normalize_whitespace, same_root_domain


BLOCKED_DOMAINS = {
    "linkedin.com",
    "x.com",
    "twitter.com",
    "facebook.com",
    "instagram.com",
    "wikipedia.org",
    "crunchbase.com",
    "opencorporates.com",
    "sec.gov",
    "companieshouse.gov.uk",
    "company-information.service.gov.uk",
    "www.google.com",
    "google.com",
    "bing.com",
    "duckduckgo.com",
}

LEGAL_SUFFIX_WORDS = {
    "inc",
    "incorporated",
    "corp",
    "corporation",
    "co",
    "company",
    "ltd",
    "limited",
    "llc",
    "plc",
    "group",
    "holdings",
    "holding",
    "international",
    "intl",
    "the",
}


def _domain(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return parsed.netloc.lower().removeprefix("www.")


def _domain_tokens(text: str) -> set[str]:
    return {token for token in re.split(r"[^a-z0-9]+", text.lower()) if token and len(token) > 1}


def _cache_key(parts: Iterable[str]) -> str:
    payload = "||".join(normalize_whitespace(part).lower() for part in parts if normalize_whitespace(part))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class RegistryQuery:
    term: str
    provider: str = ""
    country: str = ""
    state: str = ""
    city: str = ""
    industry: str = ""
    source_url: str = ""

    def search_phrases(self) -> list[str]:
        term = normalize_whitespace(self.term)
        suffixes = [value for value in (self.city, self.state, self.country, self.industry) if normalize_whitespace(value)]
        queries = [term]
        if suffixes:
            queries.append(f"{term} {' '.join(normalize_whitespace(v) for v in suffixes)}")
        queries.extend([f"{term} official website", f"{term} contact"])
        seen = set()
        out = []
        for query in queries:
            cleaned = normalize_whitespace(query)
            if cleaned and cleaned.lower() not in seen:
                seen.add(cleaned.lower())
                out.append(cleaned)
        return out


def load_registry_queries(config: dict[str, Any]) -> list[RegistryQuery]:
    discovery = config.get("discovery", {})
    queries: list[RegistryQuery] = []

    raw_registry_queries = discovery.get("registry_queries", []) or []
    for item in raw_registry_queries:
        if isinstance(item, str):
            queries.append(RegistryQuery(term=item))
        elif isinstance(item, dict):
            queries.append(
                RegistryQuery(
                    term=normalize_whitespace(item.get("term") or item.get("query") or item.get("industry") or item.get("name") or ""),
                    provider=normalize_whitespace(item.get("provider", "")),
                    country=normalize_whitespace(item.get("country", "")),
                    state=normalize_whitespace(item.get("state", "")),
                    city=normalize_whitespace(item.get("city", "")),
                    industry=normalize_whitespace(item.get("industry", "")),
                    source_url=normalize_whitespace(item.get("source_url", "")),
                )
            )

    csv_path = normalize_whitespace(discovery.get("registry_queries_csv", ""))
    if csv_path and Path(csv_path).exists():
        with Path(csv_path).open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                queries.append(
                    RegistryQuery(
                        term=normalize_whitespace(row.get("query") or row.get("term") or row.get("name") or row.get("company") or ""),
                        provider=normalize_whitespace(row.get("provider", "")),
                        country=normalize_whitespace(row.get("country", "")),
                        state=normalize_whitespace(row.get("state", "")),
                        city=normalize_whitespace(row.get("city", "")),
                        industry=normalize_whitespace(row.get("industry", "")),
                        source_url=normalize_whitespace(row.get("source_url", "")),
                    )
                )

    startup_csv_path = normalize_whitespace(discovery.get("startup_queries_csv", ""))
    if startup_csv_path and Path(startup_csv_path).exists():
        with Path(startup_csv_path).open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                queries.append(
                    RegistryQuery(
                        term=normalize_whitespace(row.get("query") or row.get("term") or row.get("name") or row.get("company") or ""),
                        provider=normalize_whitespace(row.get("provider", "")) or "startup_search",
                        country=normalize_whitespace(row.get("country", "")),
                        state=normalize_whitespace(row.get("state", "")),
                        city=normalize_whitespace(row.get("city", "")),
                        industry=normalize_whitespace(row.get("industry", "")),
                        source_url=normalize_whitespace(row.get("source_url", "")),
                    )
                )

    if not queries:
        # Fall back to generic keyword/industry queries when no explicit registry
        # query file has been provided.
        for value in (discovery.get("keywords") or []) + (discovery.get("industries") or []):
            cleaned = normalize_whitespace(str(value))
            if cleaned:
                queries.append(RegistryQuery(term=cleaned))

    deduped: list[RegistryQuery] = []
    seen: set[tuple[str, str, str, str, str]] = set()
    for item in queries:
        key = (
            item.term.lower(),
            item.provider.lower(),
            item.country.lower(),
            item.state.lower(),
            item.city.lower(),
        )
        if key in seen or not item.term:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def _company_query_candidates(company_name: str, country: str = "", city: str = "", industry: str = "") -> list[str]:
    company_name = normalize_whitespace(company_name)
    suffixes = []
    for value in (city, country, industry):
        if normalize_whitespace(value):
            suffixes.append(normalize_whitespace(value))
    queries = [company_name]
    if suffixes:
        queries.append(f"{company_name} {' '.join(suffixes)}")
    queries.extend([f"{company_name} official website", f"{company_name} contact"])
    seen = set()
    out = []
    for query in queries:
        q = normalize_whitespace(query)
        if q and q.lower() not in seen:
            seen.add(q.lower())
            out.append(q)
    return out


def _company_domain_bases(company_name: str) -> list[str]:
    words = [token for token in _domain_tokens(company_name) if token not in LEGAL_SUFFIX_WORDS]
    if not words:
        words = [token for token in _domain_tokens(company_name) if token]
    if not words:
        return []
    compact = "".join(words)
    hyphenated = "-".join(words)
    candidates = [compact, hyphenated]
    if len(words) >= 2:
        candidates.append(words[0] + words[-1])
    seen = set()
    out = []
    for value in candidates:
        cleaned = re.sub(r"[^a-z0-9-]", "", value.lower())
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            out.append(cleaned)
    return out


class DuckDuckGoWebsiteResolver:
    def __init__(
        self,
        session: requests.Session | None = None,
        logger: logging.Logger | None = None,
        cache_backend: Any | None = None,
        max_results: int = 5,
        cache_ttl_seconds: int = 7 * 24 * 3600,
    ):
        self.session = session or requests.Session()
        self.logger = logger or logging.getLogger(__name__)
        self.cache_backend = cache_backend
        self.max_results = max_results
        self.cache_ttl_seconds = cache_ttl_seconds
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            }
        )

    def resolve(self, company_name: str, country: str = "", city: str = "", industry: str = "") -> str:
        cache_key = f"website_resolve:{_cache_key([company_name, country, city, industry])}"
        cached = self._cache_get(cache_key)
        if cached:
            return normalize_whitespace(cached)

        for url in self._direct_domain_guesses(company_name, country=country):
            try:
                if self._is_plausible(url, company_name):
                    resolved = canonical_url(url)
                    self._cache_set(cache_key, resolved)
                    return resolved
            except Exception:
                continue

        for query in _company_query_candidates(company_name, country=country, city=city, industry=industry):
            try:
                for result_url in self._search(query):
                    if self._is_plausible(result_url, company_name):
                        resolved = canonical_url(result_url)
                        self._cache_set(cache_key, resolved)
                        return resolved
            except Exception as exc:
                self.logger.debug("DDG search failed for %s: %s", query, exc)
        return ""

    def _direct_domain_guesses(self, company_name: str, country: str = "") -> list[str]:
        suffixes = [".com", ".net", ".org", ".io", ".ai"]
        if "united kingdom" in country.lower() or country.lower() in {"uk", "gb", "great britain"}:
            suffixes = [".co.uk", ".com", ".org", ".net"]
        guesses = []
        for base in _company_domain_bases(company_name):
            for suffix in suffixes:
                guesses.append(f"https://{base}{suffix}")
        return guesses

    def _search(self, query: str) -> list[str]:
        cache_key = f"duckduckgo:{_cache_key([query])}"
        cached = self._cache_get(cache_key)
        if cached:
            return list(cached)
        response = self.session.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            timeout=20,
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        results: list[str] = []
        for anchor in soup.select("a.result__a[href]"):
            href = anchor.get("href", "")
            resolved = self._unwrap_duckduckgo_href(href)
            if resolved:
                results.append(resolved)
            if len(results) >= self.max_results:
                break
        self._cache_set(cache_key, results)
        return results

    def _unwrap_duckduckgo_href(self, href: str) -> str:
        if not href:
            return ""
        parsed = urlparse(href)
        if parsed.netloc.endswith("duckduckgo.com"):
            query = parse_qs(parsed.query)
            uddg = query.get("uddg", [""])[0]
            if uddg:
                return unquote(uddg)
        return href

    def _is_plausible(self, url: str, company_name: str) -> bool:
        domain = _domain(url)
        if not domain or any(domain.endswith(blocked) for blocked in BLOCKED_DOMAINS):
            return False
        if any(blocked in domain for blocked in BLOCKED_DOMAINS):
            return False
        if self._validate_official_site(url, company_name):
            return True
        return False

    def _validate_official_site(self, url: str, company_name: str) -> bool:
        cache_key = f"website_validate:{_cache_key([url, company_name])}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return bool(cached)

        try:
            response = self.session.get(url, timeout=20, allow_redirects=True)
            if response.status_code >= 400:
                self._cache_set(cache_key, False)
                return False
            content_type = response.headers.get("content-type", "").lower()
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                self._cache_set(cache_key, False)
                return False
            soup = BeautifulSoup(response.text or "", "lxml")
            meta_desc = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
            text_blocks = " ".join(
                normalize_whitespace(part)
                for part in [
                    soup.title.get_text(" ", strip=True) if soup.title else "",
                    meta_desc.get("content", "") if meta_desc else "",
                    soup.h1.get_text(" ", strip=True) if soup.h1 else "",
                ]
                if normalize_whitespace(part)
            )
            domain_tokens = _domain_tokens(_domain(response.url))
            name_tokens = _domain_tokens(company_name)
            text_tokens = _domain_tokens(text_blocks)
            score = 0
            if domain_tokens & name_tokens:
                score += 2
            if text_tokens & name_tokens:
                score += 2
            if same_root_domain(url, response.url):
                score += 1
            if "official" in (text_blocks or "").lower():
                score += 1
            valid = score >= 2
            self._cache_set(cache_key, valid)
            return valid
        except Exception:
            self._cache_set(cache_key, False)
            return False

    def _cache_get(self, key: str) -> Any:
        if not self.cache_backend:
            return None
        getter = getattr(self.cache_backend, "get_cache", None)
        if not callable(getter):
            return None
        return getter(key)

    def _cache_set(self, key: str, value: Any) -> None:
        if not self.cache_backend:
            return
        setter = getattr(self.cache_backend, "set_cache", None)
        if not callable(setter):
            return
        setter(key, value, ttl_seconds=self.cache_ttl_seconds)


class CompaniesHouseDiscoveryProvider:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        self.settings = self.config.get("discovery", {}).get("companies_house", {})
        self.enabled = bool(self.settings.get("enabled", True))
        self.api_key = normalize_whitespace(
            self.settings.get("api_key")
            or self.config.get("discovery", {}).get("companies_house_api_key", "")
            or ""
        )
        self.api_key_env = self.settings.get("api_key_env", "COMPANIES_HOUSE_API_KEY")
        self.max_results = int(self.settings.get("max_results", 100))
        self.base_url = self.settings.get("base_url", "https://api.company-information.service.gov.uk")
        self.cache_ttl_seconds = int(self.settings.get("cache_ttl_hours", 72)) * 3600
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

    def discover(
        self,
        queries: list[RegistryQuery] | None = None,
        resolver: DuckDuckGoWebsiteResolver | None = None,
    ) -> list[CompanyCandidate]:
        if not self.enabled:
            return []
        api_key = self.api_key or normalize_whitespace(os.getenv(self.api_key_env, ""))
        if not api_key:
            self.logger.info("Skipping Companies House discovery because %s is not set", self.api_key_env)
            return []
        self.session.auth = (api_key, "")

        registry_queries = [item for item in (queries or load_registry_queries(self.config)) if not item.provider or item.provider.lower() in {"", "companies_house", "uk", "companies-house"}]
        if not registry_queries:
            return []

        candidates: list[CompanyCandidate] = []
        for query in registry_queries:
            search_terms = query.search_phrases()
            if not search_terms:
                continue
            for term in search_terms:
                for item in self._search_companies(term):
                    company_name = normalize_whitespace(item.get("title") or item.get("company_name") or "")
                    company_number = normalize_whitespace(item.get("company_number") or "")
                    if not company_name or not company_number:
                        continue
                    address = item.get("address", {}) or {}
                    city = normalize_whitespace(
                        item.get("address_snippet")
                        or address.get("locality")
                        or address.get("region")
                        or ""
                    )
                    state = normalize_whitespace(address.get("region") or "")
                    candidate = CompanyCandidate(
                        company_name=company_name,
                        website="",
                        country="United Kingdom",
                        state=state,
                        city=city,
                        industry=normalize_whitespace(
                            ", ".join(item.get("sic_description", []) or item.get("sic_codes", []) or [])
                        ),
                        source_url=f"{self.base_url.rstrip('/')}/company/{company_number}",
                        metadata=item,
                    )
                    if resolver:
                        candidate.website = resolver.resolve(
                            candidate.company_name,
                            country=candidate.country,
                            city=candidate.city,
                            industry=candidate.industry,
                        )
                    if candidate.website:
                        candidates.append(candidate)
                    if len(candidates) >= self.max_results:
                        return candidates[: self.max_results]
        return candidates

    def _search_companies(self, query: str) -> list[dict[str, Any]]:
        cache_key = f"companies_house:search:{_cache_key([query])}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return list(cached)
        response = self.session.get(
            f"{self.base_url.rstrip('/')}/search/companies",
            params={"q": query, "items_per_page": 100},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json() or {}
        results = payload.get("items", []) or []
        self._cache_set(cache_key, results)
        return results

    def _cache_get(self, key: str) -> Any:
        if not getattr(self, "cache_backend", None):
            return None
        getter = getattr(self.cache_backend, "get_cache", None)
        if not callable(getter):
            return None
        return getter(key)

    def _cache_set(self, key: str, value: Any) -> None:
        if not getattr(self, "cache_backend", None):
            return
        setter = getattr(self.cache_backend, "set_cache", None)
        if not callable(setter):
            return
        setter(key, value, ttl_seconds=self.cache_ttl_seconds)


class SecEdgarDiscoveryProvider:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        self.settings = self.config.get("discovery", {}).get("sec_edgar", {})
        self.enabled = bool(self.settings.get("enabled", True))
        self.max_results = int(self.settings.get("max_results", 100))
        self.cache_ttl_seconds = int(self.settings.get("cache_ttl_hours", 24)) * 3600
        self.user_agent = normalize_whitespace(
            self.settings.get("user_agent")
            or self.settings.get("user_agent_env", "")
            or "ExecutiveLeadGen/1.0 contact@example.com"
        )
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": self.user_agent,
                "Accept-Encoding": "gzip, deflate",
                "Accept": "application/json, text/html;q=0.9, */*;q=0.8",
                "Host": "www.sec.gov",
            }
        )
        self._tickers_cache: list[dict[str, Any]] | None = None
        self.cache_backend = None

    def discover(
        self,
        queries: list[RegistryQuery] | None = None,
        resolver: DuckDuckGoWebsiteResolver | None = None,
    ) -> list[CompanyCandidate]:
        if not self.enabled:
            return []

        registry_queries = [item for item in (queries or load_registry_queries(self.config)) if not item.provider or item.provider.lower() in {"", "sec", "sec_edgar", "us", "edgar"}]
        if not registry_queries:
            return []

        candidates: list[CompanyCandidate] = []
        for query in registry_queries:
            for company in self._match_tickers(query.term):
                candidate = self._company_candidate(company)
                if resolver:
                    candidate.website = resolver.resolve(
                        candidate.company_name,
                        country=candidate.country,
                        city=candidate.city,
                        industry=candidate.industry,
                    )
                if candidate.website:
                    candidates.append(candidate)
                if len(candidates) >= self.max_results:
                    return candidates[: self.max_results]
        return candidates

    def _match_tickers(self, query: str) -> list[dict[str, Any]]:
        cache_key = f"sec:match:{_cache_key([query])}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return list(cached)
        tokens = _domain_tokens(query)
        matches: list[dict[str, Any]] = []
        for item in self._load_tickers():
            title = normalize_whitespace(item.get("title", ""))
            ticker = normalize_whitespace(item.get("ticker", ""))
            haystack = _domain_tokens(f"{title} {ticker}")
            if tokens & haystack or query.lower() in title.lower():
                matches.append(item)
        matches = matches[: self.max_results]
        self._cache_set(cache_key, matches)
        return matches

    def _load_tickers(self) -> list[dict[str, Any]]:
        if self._tickers_cache is not None:
            return self._tickers_cache
        cached = self._cache_get("sec:ticker-list")
        if cached is not None:
            self._tickers_cache = list(cached)
            return self._tickers_cache
        response = self.session.get("https://www.sec.gov/files/company_tickers.json", timeout=30)
        response.raise_for_status()
        payload = response.json() or {}
        tickers = [payload[key] for key in sorted(payload.keys(), key=lambda value: int(value))]
        self._tickers_cache = tickers
        self._cache_set("sec:ticker-list", tickers)
        return tickers

    def _company_candidate(self, ticker_row: dict[str, Any]) -> CompanyCandidate:
        cik = str(ticker_row.get("cik_str", "")).strip()
        if not cik:
            cik = ""
        padded_cik = cik.zfill(10)
        submissions = self._load_submissions(padded_cik) if padded_cik else {}
        company_name = normalize_whitespace(submissions.get("name") or ticker_row.get("title") or "")
        business = (submissions.get("addresses") or {}).get("business", {}) if submissions else {}
        city = normalize_whitespace(business.get("city", ""))
        state = normalize_whitespace(business.get("state", ""))
        industry = normalize_whitespace(submissions.get("sicDescription", ""))
        return CompanyCandidate(
            company_name=company_name,
            website="",
            country="United States",
            state=state,
            city=city,
            industry=industry,
            source_url=f"https://data.sec.gov/submissions/CIK{padded_cik}.json" if padded_cik else "",
            metadata={
                "ticker": ticker_row.get("ticker", ""),
                "cik": padded_cik,
                "submissions": submissions,
            },
        )

    def _load_submissions(self, padded_cik: str) -> dict[str, Any]:
        if not padded_cik:
            return {}
        cache_key = f"sec:submissions:{padded_cik}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return dict(cached)
        try:
            response = self.session.get(
                f"https://data.sec.gov/submissions/CIK{padded_cik}.json",
                timeout=30,
            )
            if response.status_code == 404:
                return {}
            response.raise_for_status()
            payload = response.json() or {}
            self._cache_set(cache_key, payload)
            return payload
        except requests.RequestException as exc:
            self.logger.debug("SEC submissions lookup failed for %s: %s", padded_cik, exc)
            return {}

    def _cache_get(self, key: str) -> Any:
        if not getattr(self, "cache_backend", None):
            return None
        getter = getattr(self.cache_backend, "get_cache", None)
        if not callable(getter):
            return None
        return getter(key)

    def _cache_set(self, key: str, value: Any) -> None:
        if not getattr(self, "cache_backend", None):
            return
        setter = getattr(self.cache_backend, "set_cache", None)
        if not callable(setter):
            return
        setter(key, value, ttl_seconds=self.cache_ttl_seconds)


STARTUP_SIGNAL_TERMS = {
    "startup",
    "seed",
    "series a",
    "series b",
    "venture-backed",
    "backed by",
    "founded",
    "founded in",
    "founders",
    "hiring",
    "careers",
    "team",
    "our team",
    "about us",
    "build",
    "launch",
    "beta",
    "product",
    "platform",
    "innovation",
}

STARTUP_EXCLUDE_NAMES = {
    "microsoft",
    "apple",
    "google",
    "alphabet",
    "amazon",
    "meta",
    "facebook",
    "salesforce",
    "adobe",
    "nvidia",
    "oracle",
    "ibm",
    "intel",
}


class StartupDiscoveryProvider:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None, cache_backend: Any | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        self.settings = self.config.get("discovery", {}).get("startup_search", {})
        self.enabled = bool(self.settings.get("enabled", True))
        self.max_results = int(self.settings.get("max_results", 100))
        self.search_budget_per_query = int(self.settings.get("search_budget_per_query", 5))
        self.min_signal_score = int(self.settings.get("min_signal_score", 2))
        self.cache_ttl_seconds = int(self.settings.get("cache_ttl_hours", 72)) * 3600
        self.cache_backend = cache_backend
        self.search_client = DuckDuckGoWebsiteResolver(logger=self.logger, cache_backend=cache_backend, max_results=max(self.search_budget_per_query, 5))

    def discover(
        self,
        queries: list[RegistryQuery] | None = None,
        resolver: DuckDuckGoWebsiteResolver | None = None,
    ) -> list[CompanyCandidate]:
        if not self.enabled:
            return []

        query_rows = [item for item in (queries or load_registry_queries(self.config)) if not item.provider or item.provider.lower() in {"", "startup", "startup_search", "web", "search"}]
        if not query_rows:
            query_rows = self._default_queries()

        results: list[CompanyCandidate] = []
        seen: set[str] = set()
        client = resolver or self.search_client

        for query in query_rows:
            for phrase in query.search_phrases():
                for url in client._search(phrase)[: self.search_budget_per_query]:
                    normalized = canonical_url(url)
                    if not normalized or normalized in seen:
                        continue
                    if not self._looks_like_startup_site(normalized):
                        continue
                    company_name = self._infer_company_name(normalized)
                    if not company_name or self._looks_excluded(company_name, normalized):
                        continue
                    seen.add(normalized)
                    results.append(
                        CompanyCandidate(
                            company_name=company_name,
                            website=normalized,
                            country=normalize_whitespace(query.country),
                            state=normalize_whitespace(query.state),
                            city=normalize_whitespace(query.city),
                            industry=normalize_whitespace(query.industry),
                            source_url=query.source_url or f"duckduckgo:{phrase}",
                            metadata={
                                "query": query.term,
                                "phrase": phrase,
                                "provider": query.provider or "startup_search",
                            },
                        )
                    )
                    if len(results) >= self.max_results:
                        return results
        return results

    def _default_queries(self) -> list[RegistryQuery]:
        return [
            RegistryQuery(term="seed stage startup", provider="startup_search"),
            RegistryQuery(term="venture backed startup", provider="startup_search"),
            RegistryQuery(term="series a startup", provider="startup_search"),
            RegistryQuery(term="startup about us founders", provider="startup_search"),
        ]

    def _looks_like_startup_site(self, url: str) -> bool:
        cache_key = f"startup_site:{_cache_key([url])}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return bool(cached)

        try:
            response = self.search_client.session.get(url, timeout=20, allow_redirects=True)
            if response.status_code >= 400:
                self._cache_set(cache_key, False)
                return False
            content_type = response.headers.get("content-type", "").lower()
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                self._cache_set(cache_key, False)
                return False
            soup = BeautifulSoup(response.text or "", "lxml")
            pieces = []
            title = soup.title.get_text(" ", strip=True) if soup.title else ""
            h1 = soup.h1.get_text(" ", strip=True) if soup.h1 else ""
            meta_desc = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
            if title:
                pieces.append(title)
            if h1:
                pieces.append(h1)
            if meta_desc and meta_desc.get("content"):
                pieces.append(meta_desc.get("content", ""))
            body_text = normalize_whitespace(" ".join(soup.stripped_strings))
            pieces.append(body_text[:5000])
            text = " ".join(pieces).lower()
            score = 0
            for term in STARTUP_SIGNAL_TERMS:
                if term in text:
                    score += 1
            if any(word in text for word in ("founder", "co-founder", "team", "product", "launch", "startup")):
                score += 1
            if len(body_text) < 20000:
                score += 1
            valid = score >= self.min_signal_score
            self._cache_set(cache_key, valid)
            return valid
        except Exception:
            self._cache_set(cache_key, False)
            return False

    def _infer_company_name(self, url: str) -> str:
        cache_key = f"startup_name:{_cache_key([url])}"
        cached = self._cache_get(cache_key)
        if cached:
            return normalize_whitespace(cached)
        try:
            response = self.search_client.session.get(url, timeout=20, allow_redirects=True)
            if response.status_code >= 400:
                return ""
            soup = BeautifulSoup(response.text or "", "lxml")
            candidates = []
            if soup.title and soup.title.get_text(strip=True):
                candidates.append(soup.title.get_text(" ", strip=True))
            if soup.h1 and soup.h1.get_text(strip=True):
                candidates.append(soup.h1.get_text(" ", strip=True))
            meta_site = soup.find("meta", attrs={"property": re.compile("^og:site_name$", re.I)})
            if meta_site and meta_site.get("content"):
                candidates.append(meta_site.get("content", ""))
            meta_title = soup.find("meta", attrs={"property": re.compile("^og:title$", re.I)})
            if meta_title and meta_title.get("content"):
                candidates.append(meta_title.get("content", ""))
            for candidate in candidates:
                cleaned = self._clean_candidate_name(candidate)
                if cleaned:
                    self._cache_set(cache_key, cleaned)
                    return cleaned
            domain = _domain(url)
            fallback = domain.split(".")[0].replace("-", " ").title()
            self._cache_set(cache_key, fallback)
            return fallback
        except Exception:
            return ""

    def _clean_candidate_name(self, value: str) -> str:
        text = normalize_whitespace(value)
        if not text:
            return ""
        text = re.sub(r"\s*[|•··].*$", "", text).strip()
        text = re.sub(r"\b(home|homepage|about|team|careers|startup)\b.*$", "", text, flags=re.I).strip()
        text = re.sub(r"\s*-\s*.*$", "", text).strip()
        tokens = [token for token in re.split(r"\s+", text) if token]
        if len(tokens) > 6:
            tokens = tokens[:6]
        cleaned = " ".join(tokens).strip(" -|")
        if not cleaned:
            return ""
        lowered = cleaned.lower()
        if any(exclude in lowered for exclude in STARTUP_EXCLUDE_NAMES):
            return ""
        return cleaned

    def _looks_excluded(self, company_name: str, url: str) -> bool:
        text = f"{company_name} {_domain(url)}".lower()
        return any(exclude in text for exclude in STARTUP_EXCLUDE_NAMES)

    def _cache_get(self, key: str) -> Any:
        if not self.cache_backend:
            return None
        getter = getattr(self.cache_backend, "get_cache", None)
        if not callable(getter):
            return None
        return getter(key)

    def _cache_set(self, key: str, value: Any) -> None:
        if not self.cache_backend:
            return
        setter = getattr(self.cache_backend, "set_cache", None)
        if not callable(setter):
            return
        setter(key, value, ttl_seconds=self.cache_ttl_seconds)


class YcStartupDiscoveryProvider:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None, cache_backend: Any | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        self.settings = self.config.get("discovery", {}).get("yc_directory", {})
        self.enabled = bool(self.settings.get("enabled", True))
        self.base_url = self.settings.get("base_url", "https://www.ycombinator.com/companies")
        self.category_slugs = self.settings.get("categories") or self.config.get("discovery", {}).get("yc_categories") or [
            "ai",
            "b2b",
            "biotech",
            "climate",
            "consumer",
            "crypto",
            "design",
            "developer-tools",
            "devtools",
            "ecommerce",
            "education",
            "energy",
            "fintech",
            "gaming",
            "hardware",
            "health",
            "hr",
            "legal",
            "marketplaces",
            "media",
            "enterprise-software",
            "productivity",
            "robotics",
            "sales",
            "security",
            "social",
            "travel",
        ]
        self.max_results = int(self.settings.get("max_results", 100))
        self.max_category_pages = int(self.settings.get("max_category_pages", 30))
        self.validate_official_sites = bool(self.settings.get("validate_official_sites", False))
        self.cache_ttl_seconds = int(self.settings.get("cache_ttl_hours", 72)) * 3600
        self.cache_backend = cache_backend
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            }
        )

    def discover(
        self,
        queries: list[RegistryQuery] | None = None,
        resolver: DuckDuckGoWebsiteResolver | None = None,
    ) -> list[CompanyCandidate]:
        if not self.enabled:
            return []

        categories = self._active_categories(queries)
        if not categories:
            return []

        candidates: list[CompanyCandidate] = []
        seen: set[str] = set()

        for category in categories:
            for candidate in self._candidates_for_category(category):
                if not candidate.website:
                    continue
                if candidate.website in seen:
                    continue
                if self.validate_official_sites and resolver and not resolver._validate_official_site(candidate.website, candidate.company_name):
                    continue
                seen.add(candidate.website)
                candidates.append(candidate)
                if len(candidates) >= self.max_results:
                    return candidates
        return candidates

    def _active_categories(self, queries: list[RegistryQuery] | None) -> list[str]:
        if self.category_slugs:
            return [normalize_whitespace(slug).strip("/").lower() for slug in self.category_slugs if normalize_whitespace(slug)]

        derived: list[str] = []
        for query in queries or []:
            if query.provider and query.provider.lower() not in {"yc_directory", "yc", "startup", "startup_search"}:
                continue
            term = normalize_whitespace(query.industry or query.term or "")
            if not term:
                continue
            derived.append(slugify(term))
        return derived

    def _candidates_for_category(self, category_slug: str) -> list[CompanyCandidate]:
        cache_key = f"yc_category_candidates:{_cache_key([category_slug])}"
        cached = self._cache_get(cache_key)
        if cached:
            return [candidate for candidate in (self._coerce_candidate(item) for item in cached) if candidate]

        candidates: list[CompanyCandidate] = []
        seen_slugs: set[str] = set()
        try:
            for page_num in range(1, self.max_category_pages + 1):
                page = self._fetch_category_page(category_slug, page_num)
                if not page:
                    break
                props = page.get("props", {}) or {}
                company_rows = props.get("companies", []) or []
                for company in company_rows:
                    slug = normalize_whitespace(company.get("slug", "")).strip()
                    website = canonical_url(normalize_whitespace(company.get("website", "")))
                    company_name = normalize_whitespace(company.get("name", ""))
                    if not company_name or not website:
                        continue
                    if _domain(website).endswith("ycombinator.com"):
                        continue
                    if slug and slug in seen_slugs:
                        continue
                    if slug:
                        seen_slugs.add(slug)
                    source_url = normalize_whitespace(company.get("ycdc_company_url", ""))
                    if not source_url:
                        source_url = f"https://www.ycombinator.com/companies/{slug}" if slug else f"https://www.ycombinator.com/companies/industry/{category_slug}"
                    metadata = {
                        "category": category_slug,
                        "current_page": props.get("currentPage"),
                        "total_pages": props.get("totalPages"),
                        "has_more": props.get("hasMore"),
                        "slug": slug,
                        "batch_name": company.get("batch_name", ""),
                        "tags": company.get("tags", []),
                        "year_founded": company.get("year_founded", ""),
                        "team_size": company.get("team_size", ""),
                        "location": company.get("location", ""),
                        "city_tag": company.get("city_tag", ""),
                        "linkedin_url": company.get("linkedin_url", ""),
                        "twitter_url": company.get("twitter_url", ""),
                        "ycdc_company_url": company.get("ycdc_company_url", ""),
                    }
                    candidates.append(
                        CompanyCandidate(
                            company_name=company_name,
                            website=website,
                            country=normalize_whitespace(company.get("country", "United States")) or "United States",
                            state=normalize_whitespace(company.get("location", "")),
                            city=normalize_whitespace(company.get("city", "")),
                            industry=self._infer_industry(category_slug, company),
                            source_url=source_url,
                            metadata=metadata,
                        )
                    )
                    if len(candidates) >= self.max_results:
                        self._cache_set(cache_key, [candidate.__dict__ for candidate in candidates], ttl_seconds=self.cache_ttl_seconds)
                        return candidates
                if not props.get("hasMore"):
                    break
        except Exception as exc:
            self.logger.warning("YC category fetch failed for %s: %s", category_slug, exc)
        self._cache_set(cache_key, [candidate.__dict__ for candidate in candidates], ttl_seconds=self.cache_ttl_seconds)
        return candidates

    def _fetch_category_page(self, category_slug: str, page_num: int) -> dict[str, Any] | None:
        url = f"{self.base_url.rstrip('/')}/industry/{category_slug}"
        if page_num > 1:
            url = f"{url}?page={page_num}"
        cache_key = f"yc_category_page:{_cache_key([category_slug, str(page_num)])}"
        cached = self._cache_get(cache_key)
        if cached:
            return cached if isinstance(cached, dict) else None
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            page = self._extract_page_payload(response.text or "")
            if page:
                self._cache_set(cache_key, page, ttl_seconds=self.cache_ttl_seconds)
            return page
        except Exception as exc:
            self.logger.warning("YC category page fetch failed for %s page %s: %s", category_slug, page_num, exc)
            return None

    def _extract_page_payload(self, html_text: str) -> dict[str, Any] | None:
        match = re.search(r'data-page=\"([^\"]+)\"', html_text)
        if not match:
            return None
        try:
            return json.loads(html_lib.unescape(match.group(1)))
        except Exception:
            return None

    def _extract_title(self, html_text: str) -> str:
        soup = BeautifulSoup(html_lib.unescape(html_text), "lxml")
        candidates = []
        if soup.title and soup.title.get_text(strip=True):
            candidates.append(soup.title.get_text(" ", strip=True))
        meta_title = soup.find("meta", attrs={"property": re.compile("^og:title$", re.I)})
        if meta_title and meta_title.get("content"):
            candidates.append(meta_title.get("content", ""))
        for candidate in candidates:
            cleaned = self._clean_company_name(candidate)
            if cleaned:
                return cleaned
        return ""

    def _extract_website(self, html_text: str) -> str:
        raw = html_lib.unescape(html_text)
        patterns = [
            r'"website":"(?P<website>https?://[^"]+)"',
            r'"website":\s*"(?P<website>https?://[^"]+)"',
            r'"company_url":"(?P<website>https?://[^"]+)"',
        ]
        for pattern in patterns:
            match = re.search(pattern, raw)
            if match:
                return match.group("website")
        return ""

    def _infer_industry(self, category_slug: str, company: dict[str, Any]) -> str:
        tags = [normalize_whitespace(tag).title() for tag in (company.get("tags", []) or []) if normalize_whitespace(tag)]
        if tags:
            return ", ".join(tags[:3])
        return normalize_whitespace(category_slug.replace("-", " ").title())

    def _clean_company_name(self, value: str) -> str:
        text = normalize_whitespace(value)
        if not text:
            return ""
        text = re.sub(r"\s*\|\s*Y Combinator.*$", "", text).strip()
        text = re.sub(r":.*$", "", text).strip()
        text = re.sub(r"\bStartups?.*$", "", text, flags=re.I).strip()
        if len(text) > 80:
            text = text[:80].strip()
        return text

    def _coerce_candidate(self, payload: Any) -> CompanyCandidate | None:
        if isinstance(payload, CompanyCandidate):
            return payload
        if not isinstance(payload, dict):
            return None
        try:
            return CompanyCandidate(
                company_name=normalize_whitespace(payload.get("company_name", "")),
                website=normalize_whitespace(payload.get("website", "")),
                country=normalize_whitespace(payload.get("country", "")),
                state=normalize_whitespace(payload.get("state", "")),
                city=normalize_whitespace(payload.get("city", "")),
                industry=normalize_whitespace(payload.get("industry", "")),
                source_url=normalize_whitespace(payload.get("source_url", "")),
                metadata=payload.get("metadata", {}) or {},
            )
        except Exception:
            return None

    def _cache_get(self, key: str) -> Any:
        if not self.cache_backend:
            return None
        getter = getattr(self.cache_backend, "get_cache", None)
        if not callable(getter):
            return None
        return getter(key)

    def _cache_set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if not self.cache_backend:
            return
        setter = getattr(self.cache_backend, "set_cache", None)
        if not callable(setter):
            return
        setter(key, value, ttl_seconds=ttl_seconds or self.cache_ttl_seconds)


class RegistryDiscoveryManager:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None, cache_backend: Any | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        self.cache_backend = cache_backend
        self.resolver = DuckDuckGoWebsiteResolver(logger=self.logger, cache_backend=cache_backend)
        self.startup_provider = StartupDiscoveryProvider(self.config, self.logger, cache_backend=cache_backend)
        self.yc_provider = YcStartupDiscoveryProvider(self.config, self.logger, cache_backend=cache_backend)
        self.providers = {
            "companies_house": CompaniesHouseDiscoveryProvider(self.config, self.logger),
            "sec_edgar": SecEdgarDiscoveryProvider(self.config, self.logger),
            "startup_search": self.startup_provider,
            "yc_directory": self.yc_provider,
        }
        for provider in self.providers.values():
            setattr(provider, "cache_backend", cache_backend)

    def discover(self) -> list[CompanyCandidate]:
        candidates: list[CompanyCandidate] = []
        queries = load_registry_queries(self.config)
        discovery = self.config.get("discovery", {})
        mode = normalize_whitespace(discovery.get("mode", "mixed")).lower()
        active_provider_names = self._active_provider_names(mode, discovery.get("providers", []) or [])
        for name, provider in self.providers.items():
            if name not in active_provider_names:
                continue
            try:
                discovered = provider.discover(queries=queries, resolver=self.resolver)
                candidates.extend(discovered)
                self.logger.info("%s discovered %s candidate(s)", provider.__class__.__name__, len(discovered))
            except Exception as exc:
                self.logger.warning("%s discovery failed: %s", provider.__class__.__name__, exc)
        return self._dedupe(candidates)

    def _active_provider_names(self, mode: str, configured: list[Any]) -> set[str]:
        configured_names = {normalize_whitespace(str(item)).lower() for item in configured if normalize_whitespace(str(item))}
        if configured_names:
            return configured_names
        if mode == "startup":
            return {"seed_csv", "yc_directory", "companies_house"}
        if mode == "registry":
            return {"companies_house", "sec_edgar"}
        return {"companies_house", "sec_edgar", "startup_search", "yc_directory"}

    def _dedupe(self, candidates: Iterable[CompanyCandidate]) -> list[CompanyCandidate]:
        seen: set[tuple[str, str]] = set()
        merged: list[CompanyCandidate] = []
        for candidate in candidates:
            key = (
                normalize_whitespace(candidate.website).lower(),
                normalize_whitespace(candidate.company_name).lower(),
            )
            if key in seen:
                continue
            seen.add(key)
            merged.append(candidate)
        return merged
