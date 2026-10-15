from __future__ import annotations

import hashlib
import json
import os
import random
import re
import time
from dataclasses import asdict, is_dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser

try:
    import yaml
except ImportError:  # pragma: no cover - handled by requirements
    yaml = None

try:
    import phonenumbers
except ImportError:  # pragma: no cover - handled by requirements
    phonenumbers = None

try:
    import tldextract
except ImportError:  # pragma: no cover - handled by requirements
    tldextract = None

EMAIL_RE = re.compile(
    r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
    re.IGNORECASE,
)

PHONE_RE = re.compile(
    r"(?:(?:\+?\d{1,3}[\s.\-]?)?(?:\(?\d{2,4}\)?[\s.\-]?)?\d{3,4}[\s.\-]?\d{4})"
)

LINKEDIN_RE = re.compile(r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/[^\s\"'<>]+", re.I)
TWITTER_RE = re.compile(r"https?://(?:www\.)?(?:twitter\.com|x\.com)/[^\s\"'<>]+", re.I)

TITLE_PATTERNS = [
    (re.compile(r"\bchief executive officer\b", re.I), "CEO"),
    (re.compile(r"\bchief technology officer\b", re.I), "CTO"),
    (re.compile(r"\bchief operating officer\b", re.I), "COO"),
    (re.compile(r"\bchief marketing officer\b", re.I), "CMO"),
    (re.compile(r"\bchief financial officer\b", re.I), "CFO"),
    (re.compile(r"\bmanaging director\b", re.I), "Managing Director"),
    (re.compile(r"\bco-founder\b|\bcofounder\b", re.I), "Co-Founder"),
    (re.compile(r"\bfounder\b", re.I), "Founder"),
    (re.compile(r"\bceo\b", re.I), "CEO"),
    (re.compile(r"\bcto\b", re.I), "CTO"),
    (re.compile(r"\bcoo\b", re.I), "COO"),
    (re.compile(r"\bcmo\b", re.I), "CMO"),
    (re.compile(r"\bcfo\b", re.I), "CFO"),
    (re.compile(r"\bpresident\b", re.I), "President"),
    (re.compile(r"\bowner\b", re.I), "Owner"),
]

SOCIAL_HINTS = ("linkedin.com/", "twitter.com/", "x.com/")


def load_yaml_config(path: str | os.PathLike[str]) -> dict[str, Any]:
    if yaml is None:
        raise RuntimeError("PyYAML is required to load config.yaml")
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with config_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return data


def ensure_directory(path: str | os.PathLike[str]) -> Path:
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_whitespace(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    value = normalize_whitespace(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def canonical_url(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    scheme = parsed.scheme or "https"
    netloc = parsed.netloc.lower()
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    return urlunparse((scheme, netloc, path, "", parsed.query, ""))


def root_domain(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    host = parsed.netloc.lower()
    if not host:
        return ""
    if tldextract is not None:
        extracted = tldextract.extract(host)
        if extracted.domain and extracted.suffix:
            return f"{extracted.domain}.{extracted.suffix}"
    parts = host.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return host


def same_root_domain(a: str, b: str) -> bool:
    return root_domain(a) == root_domain(b)


def safe_urljoin(base_url: str, path: str) -> str:
    joined = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
    return canonical_url(joined)


def normalize_title(title: str | None) -> str:
    value = normalize_whitespace(title)
    if not value:
        return ""

    lowered = value.lower()

    founder_label = None
    if "co-founder" in lowered or "cofounder" in lowered:
        founder_label = "Co-Founder"
    elif "founder" in lowered:
        founder_label = "Founder"

    if founder_label:
        pair_map = [
            (r"\bchief executive officer\b|\bceo\b", "CEO"),
            (r"\bchief technology officer\b|\bcto\b", "CTO"),
            (r"\bchief operating officer\b|\bcoo\b", "COO"),
            (r"\bchief marketing officer\b|\bcmo\b", "CMO"),
            (r"\bchief financial officer\b|\bcfo\b", "CFO"),
            (r"\bpresident\b", "President"),
            (r"\bmanaging director\b", "Managing Director"),
            (r"\bowner\b", "Owner"),
        ]
        for pattern, normalized in pair_map:
            if re.search(pattern, lowered, re.I):
                return f"{founder_label}, {normalized}"

    cleaned: list[str] = []
    seen: set[str] = set()

    for pattern, normalized in TITLE_PATTERNS:
        if pattern.search(lowered) and normalized not in seen:
            cleaned.append(normalized)
            seen.add(normalized)

    if cleaned:
        if "Founder" in cleaned and "Co-Founder" in cleaned:
            cleaned = [item for item in cleaned if item != "Founder"]
        if "Managing Director" in cleaned and "Director" in cleaned:
            cleaned = [item for item in cleaned if item != "Director"]
        if any(item in cleaned for item in ("CEO", "CTO", "COO", "CMO", "CFO", "President", "Owner", "Managing Director", "Founder", "Co-Founder")):
            cleaned = [item for item in cleaned if item != "Director"]
        return ", ".join(cleaned)

    value = re.sub(r"[\-|/]\s*[\w\s,()&.-]+$", "", value).strip()
    return value.title()


def extract_emails(text: str) -> list[str]:
    return sorted({candidate.lower() for candidate in EMAIL_RE.findall(text or "")})


def extract_phones(text: str, default_country: str | None = None) -> list[str]:
    candidates = {normalize_whitespace(match) for match in PHONE_RE.findall(text or "")}
    cleaned: set[str] = set()
    if phonenumbers is None:
        return sorted(candidates)

    region = "US"
    if default_country:
        country = default_country.lower()
        if "united kingdom" in country or country == "uk":
            region = "GB"

    for candidate in candidates:
        try:
            parsed = phonenumbers.parse(candidate, region)
            if phonenumbers.is_valid_number(parsed):
                cleaned.add(phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL))
        except Exception:
            continue
    return sorted(cleaned or candidates)


def extract_social_links(links: Iterable[str]) -> dict[str, list[str]]:
    linkedin: set[str] = set()
    twitter: set[str] = set()
    for link in links:
        if not link:
            continue
        normalized = canonical_url(link)
        if "linkedin.com/" in normalized.lower():
            linkedin.add(normalized)
        elif "twitter.com/" in normalized.lower() or "x.com/" in normalized.lower():
            twitter.add(normalized)
    return {"linkedin": sorted(linkedin), "twitter": sorted(twitter)}


def compact_hash(*parts: str) -> str:
    payload = "||".join(normalize_whitespace(part).lower() for part in parts if part)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def public_email_is_valid(email: str) -> bool:
    if not email or "@" not in email:
        return False
    if EMAIL_RE.fullmatch(email.strip()) is None:
        return False
    local_part = email.split("@", 1)[0]
    return len(local_part) > 0


def random_delay(min_seconds: float, max_seconds: float) -> None:
    if max_seconds <= 0:
        return
    time.sleep(random.uniform(min_seconds, max_seconds))


def backoff_delay(attempt: int, base: float = 2.0, jitter: float = 0.25) -> float:
    delay = base ** max(attempt - 1, 0)
    return delay + random.uniform(0.0, jitter)


def json_default(value: Any) -> Any:
    if is_dataclass(value):
        return asdict(value)
    if isinstance(value, Path):
        return str(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def dumps_json(value: Any, pretty: bool = False) -> str:
    indent = 2 if pretty else None
    return json.dumps(value, indent=indent, ensure_ascii=False, default=json_default)


def robots_allowed(url: str, user_agent: str, timeout: int = 10) -> bool:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return True
    robots_url = urlunparse((parsed.scheme, parsed.netloc, "/robots.txt", "", "", ""))
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        parser.read()
        return parser.can_fetch(user_agent, url)
    except Exception:
        return True


def strip_control_characters(value: str) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", " ", value)


def first_non_empty(values: Iterable[str | None]) -> str:
    for value in values:
        if value and normalize_whitespace(value):
            return normalize_whitespace(value)
    return ""
