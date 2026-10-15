from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlparse

from utils import compact_hash, normalize_title, normalize_whitespace, public_email_is_valid

# Keep the lead set focused on the roles the product targets.
TARGET_TITLE_HINTS = (
    "ceo",
    "founder",
    "co-founder",
    "cto",
    "coo",
    "cmo",
    "cfo",
    "president",
    "managing director",
    "owner",
)

# Words that commonly appear around names in scraped pages but are not actual
# parts of a person's name. This includes both generic role words and the most
# common false-positive prefixes found in the current corpus.
NAME_NOISE_WORDS = {
    "advisors",
    "advisor",
    "ai",
    "board",
    "business",
    "businesses",
    "clinical",
    "co",
    "cofounder",
    "co-founder",
    "company",
    "consulting",
    "council",
    "director",
    "directors",
    "engineer",
    "engineering",
    "ex",
    "ex-",
    "executive",
    "fellow",
    "firm",
    "founder",
    "founders",
    "former",
    "grammar",
    "group",
    "head",
    "officer",
    "inc",
    "instacart",
    "lead",
    "leadership",
    "linkedin",
    "little",
    "labs",
    "lab",
    "founding",
    "manager",
    "member",
    "operations",
    "ops",
    "otter",
    "platform",
    "prev",
    "previous",
    "build",
    "connect",
    "development",
    "infrastructure",
    "hubspot",
    "vercel",
    "maintenance",
    "supplies",
    "mic",
    "account",
    "use",
    "damn",
    "ct",
    "to",
    "repeat",
    "rappi",
    "reddit",
    "coinbase",
    "brex",
    "shopify",
    "uber",
    "podium",
    "agentcard",
    "allowance",
    "hedge",
    "torus",
    "superset",
    "corelayer",
    "trace",
    "amplitude",
    "understudy",
    "prized",
    "incidentfox",
    "rise",
    "hylight",
    "nira",
    "axelrod",
    "rapidfolio",
    "razorpay",
    "scale",
    "smartasset",
    "billow",
    "deel",
    "sales",
    "senator",
    "shopify",
    "shutterstock",
    "salesforce",
    "team",
    "technology",
    "technologies",
    "theravance",
    "trading",
    "university",
    "vice",
    "phd",
    "mba",
    "md",
    "chemistry",
}

NAME_PREFIXES = {
    "dr",
    "mr",
    "mrs",
    "ms",
    "mx",
    "prof",
    "professor",
    "sir",
    "madam",
}

NAME_SUFFIXES = {
    "jr",
    "sr",
    "ii",
    "iii",
    "iv",
}

TARGET_TITLE_PATTERN = re.compile(
    r"(?:co-founder|cofounder|founder|chief executive officer|chief technology officer|"
    r"chief operating officer|chief marketing officer|chief financial officer|"
    r"managing director|ceo|cto|coo|cmo|cfo|president|owner)",
    re.I,
)


def is_public_website(url: str) -> bool:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    host = (parsed.hostname or "").lower()
    if not host:
        return False
    if host in {"localhost", "127.0.0.1", "::1"}:
        return False
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return True
    return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved)


def is_target_title(title: str) -> bool:
    return bool(TARGET_TITLE_PATTERN.search(normalize_title(title)))


def _clean_token(token: str) -> str:
    return token.strip(".,;:()[]{}")


def _token_is_name_like(token: str) -> bool:
    cleaned = _clean_token(token)
    if not cleaned:
        return False
    lowered = cleaned.lower().rstrip("-")
    if lowered.startswith("ex-"):
        return False
    if lowered in NAME_NOISE_WORDS or lowered in NAME_PREFIXES or lowered in NAME_SUFFIXES:
        return False
    if any(character.isdigit() for character in cleaned):
        return False
    if len(cleaned) > 24:
        return False
    if cleaned.isupper():
        return len(cleaned) <= 3
    if len(cleaned) == 1 and cleaned.isalpha():
        return True
    if re.fullmatch(r"[A-Z][A-Za-z'’-]*(?:-[A-Z][A-Za-z'’-]*)*", cleaned):
        return True
    return False


def _window_looks_like_person(window: list[str]) -> bool:
    if len(window) not in (2, 3):
        return False
    if not all(_token_is_name_like(token) for token in window):
        return False
    if len(window) == 3 and not any(len(_clean_token(token)) == 1 for token in window):
        # We strongly prefer 3-token names only when they contain an initial.
        return False
    return True


def clean_person_name(candidate: str) -> str:
    text = normalize_whitespace(candidate)
    if not text:
        return ""

    text = re.sub(r"^(?:dr|mr|mrs|ms|mx|prof|professor|sir|madam)\.?\s+", "", text, flags=re.I)
    text = text.strip(".,;:")
    tokens = [token for token in (part.strip() for part in text.split()) if token]

    while tokens and _clean_token(tokens[0]).lower() in NAME_NOISE_WORDS | NAME_PREFIXES:
        tokens.pop(0)
    while tokens and _clean_token(tokens[-1]).lower() in NAME_NOISE_WORDS | NAME_SUFFIXES:
        tokens.pop()

    if len(tokens) < 2:
        return ""

    # Prefer the right-most plausible window because scraped snippets often
    # prepend company names or descriptor words before the actual person.
    for end in range(len(tokens), 1, -1):
        for size in (3, 2):
            start = end - size
            if start < 0:
                continue
            window = tokens[start:end]
            if _window_looks_like_person(window):
                return " ".join(_clean_token(token) for token in window)

    return ""


def is_plausible_person_name(candidate: str) -> bool:
    cleaned = clean_person_name(candidate)
    if not cleaned:
        return False
    tokens = cleaned.split()
    if len(tokens) not in (2, 3):
        return False
    return all(_token_is_name_like(token) for token in tokens)


def canonical_lead_key(name: str, company_name: str, website: str, email: str = "") -> str:
    normalized_email = normalize_whitespace(email).lower() if public_email_is_valid(email) else ""
    return compact_hash(clean_person_name(name), company_name, website, normalized_email)


def score_executive_row(row: dict[str, str]) -> int:
    score = 0
    if normalize_whitespace(row.get("email", "")):
        score += 4
    if normalize_whitespace(row.get("phone", "")):
        score += 1
    if normalize_whitespace(row.get("linkedin", "")):
        score += 1
    if normalize_whitespace(row.get("twitter", "")):
        score += 1
    if is_target_title(row.get("normalized_title") or row.get("title", "")):
        score += 3
    if public_email_is_valid(row.get("email", "")):
        score += 1
    if normalize_whitespace(row.get("source_url", "")):
        score += 1
    confidence = row.get("source_confidence", 0.0)
    try:
        score += int(float(confidence) * 3)
    except Exception:
        pass
    return score


def normalize_executive_row(row: dict[str, str]) -> dict[str, str] | None:
    company_name = normalize_whitespace(row.get("company_name", ""))
    website = normalize_whitespace(row.get("website", ""))
    name = clean_person_name(row.get("name", ""))
    title = normalize_title(row.get("normalized_title") or row.get("title", ""))
    if not company_name or not website or not name or not title:
        return None
    if not is_public_website(website):
        return None
    if not is_target_title(title):
        return None

    email = normalize_whitespace(row.get("email", ""))
    if email and not public_email_is_valid(email):
        email = ""

    normalized = {
        **row,
        "company_name": company_name,
        "website": website,
        "name": name,
        "title": title,
        "normalized_title": title,
        "email": email,
        "phone": normalize_whitespace(row.get("phone", "")),
        "linkedin": normalize_whitespace(row.get("linkedin", "")),
        "twitter": normalize_whitespace(row.get("twitter", "")),
        "country": normalize_whitespace(row.get("country", "")),
        "state": normalize_whitespace(row.get("state", "")),
        "city": normalize_whitespace(row.get("city", "")),
        "industry": normalize_whitespace(row.get("industry", "")),
        "source_url": normalize_whitespace(row.get("source_url", "")),
        "last_crawled": normalize_whitespace(row.get("last_crawled", "")),
    }
    return normalized


def dedupe_executive_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    best_by_key: dict[str, tuple[int, dict[str, str]]] = {}
    for row in rows:
        normalized = normalize_executive_row(row)
        if not normalized:
            continue
        key = canonical_lead_key(
            normalized["name"],
            normalized["company_name"],
            normalized["website"],
            normalized.get("email", ""),
        )
        score = score_executive_row(normalized)
        current = best_by_key.get(key)
        if current is None or score > current[0]:
            best_by_key[key] = (score, normalized)

    cleaned = [item[1] for item in best_by_key.values()]
    cleaned.sort(key=lambda row: (row.get("company_name", ""), row.get("name", ""), row.get("title", "")))
    return cleaned
