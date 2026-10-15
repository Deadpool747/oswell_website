from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from leadgen_quality import clean_person_name, is_plausible_person_name
from utils import (
    extract_emails,
    extract_phones,
    extract_social_links,
    normalize_whitespace,
    same_root_domain,
    safe_urljoin,
)


@dataclass
class ParsedPage:
    url: str
    final_url: str
    status_code: int
    title: str = ""
    description: str = ""
    text: str = ""
    headings: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    linkedin: list[str] = field(default_factory=list)
    twitter: list[str] = field(default_factory=list)
    raw_html: str = ""


def _soup_from_html(html: str) -> BeautifulSoup:
    return BeautifulSoup(html or "", "lxml")


def extract_visible_text(html: str) -> str:
    soup = _soup_from_html(html)
    for tag in soup(["script", "style", "noscript", "svg", "canvas", "iframe"]):
        tag.decompose()
    text = soup.get_text("\n", strip=True)
    return normalize_whitespace(text)


def extract_links(html: str, base_url: str, same_domain_only: bool = False) -> list[str]:
    soup = _soup_from_html(html)
    links: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href", "").strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        absolute = safe_urljoin(base_url, href)
        if same_domain_only and not same_root_domain(base_url, absolute):
            continue
        links.add(absolute)
    return sorted(links)


def extract_page_metadata(html: str, url: str, final_url: str, status_code: int) -> ParsedPage:
    soup = _soup_from_html(html)
    title = ""
    if soup.title and soup.title.string:
        title = normalize_whitespace(soup.title.string)

    description = ""
    meta_desc = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    if meta_desc and meta_desc.get("content"):
        description = normalize_whitespace(meta_desc["content"])

    headings = []
    for tag_name in ("h1", "h2", "h3"):
        for tag in soup.find_all(tag_name):
            text = normalize_whitespace(tag.get_text(" ", strip=True))
            if text:
                headings.append(text)

    visible_text = extract_visible_text(html)
    raw_links = extract_links(html, final_url or url, same_domain_only=False)
    social_links = extract_social_links(raw_links)
    emails = extract_emails(visible_text)
    phones = extract_phones(visible_text)

    return ParsedPage(
        url=url,
        final_url=final_url or url,
        status_code=status_code,
        title=title,
        description=description,
        text=visible_text,
        headings=headings,
        links=raw_links,
        emails=emails,
        phones=phones,
        linkedin=social_links["linkedin"],
        twitter=social_links["twitter"],
        raw_html=html,
    )


def extract_company_description(page: ParsedPage) -> str:
    if page.description:
        return page.description
    if page.headings:
        return page.headings[0]
    if page.text:
        return page.text[:280]
    return ""


def build_extraction_corpus(pages: list[ParsedPage], max_chars: int = 40000) -> str:
    chunks: list[str] = []
    total = 0
    for page in pages:
        block = "\n".join(
            [
                f"URL: {page.final_url}",
                f"TITLE: {page.title}",
                f"DESCRIPTION: {page.description}",
                "HEADINGS:",
                "\n".join(page.headings[:15]),
                "TEXT:",
                page.text[:6000],
            ]
        )
        if total + len(block) > max_chars:
            break
        chunks.append(block)
        total += len(block)
    return "\n\n---\n\n".join(chunks)


def candidate_executive_snippets(text: str, window: int = 120) -> list[str]:
    title_terms = [
        "chief executive officer",
        "ceo",
        "founder",
        "co-founder",
        "chief technology officer",
        "cto",
        "chief operating officer",
        "coo",
        "chief marketing officer",
        "cmo",
        "chief financial officer",
        "cfo",
        "president",
        "managing director",
        "owner",
    ]
    lowered = text.lower()
    snippets: list[str] = []
    for term in title_terms:
        start = 0
        while True:
            idx = lowered.find(term, start)
            if idx == -1:
                break
            left = max(0, idx - window)
            right = min(len(text), idx + len(term) + window)
            snippets.append(normalize_whitespace(text[left:right]))
            start = idx + len(term)
    deduped = []
    seen = set()
    for snippet in snippets:
        key = snippet.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(snippet)
    return deduped


def parse_name_title_pairs(text: str) -> list[dict[str, str]]:
    stop_words = {
        "our",
        "team",
        "leadership",
        "management",
        "about",
        "company",
        "executives",
        "people",
        "board",
        "who",
        "we",
        "are",
        "and",
        "the",
        "for",
        "of",
        "at",
    }
    role_words = {
        "founder",
        "ceo",
        "cto",
        "coo",
        "cmo",
        "cfo",
        "president",
        "owner",
        "director",
        "managing",
        "chief",
        "co",
    }
    company_words = {
        "robotics",
        "systems",
        "solutions",
        "technology",
        "technologies",
        "software",
        "labs",
        "lab",
        "group",
        "holdings",
        "ventures",
        "capital",
        "digital",
        "media",
        "data",
        "cloud",
        "global",
        "health",
        "security",
        "network",
        "energy",
        "consulting",
        "design",
        "studio",
        "works",
        "manufacturing",
        "commerce",
        "services",
        "systems",
        "partners",
        "solutions",
        "research",
        "ai",
        "bio",
        "labs",
    }
    title_patterns = [
        r"\b(?:co[- ]?founder|founder)\s*(?:and|&|,)?\s*(?:ceo|cto|coo|cmo|cfo|president|managing director|owner)\b",
        r"\bchief executive officer\b",
        r"\bchief technology officer\b",
        r"\bchief operating officer\b",
        r"\bchief marketing officer\b",
        r"\bchief financial officer\b",
        r"\bmanaging director\b",
        r"\bco[- ]?founder\b",
        r"\bfounder\b",
        r"\bceo\b",
        r"\bcto\b",
        r"\bcoo\b",
        r"\bcmo\b",
        r"\bcfo\b",
        r"\bpresident\b",
        r"\bowner\b",
    ]
    title_pattern = (
        r"(?:co[- ]?founder|founder|chief executive officer|chief technology officer|"
        r"chief operating officer|chief marketing officer|chief financial officer|"
        r"managing director|ceo|cto|coo|cmo|cfo|president|owner)"
    )
    person_pattern = r"[A-Z][a-zA-Z.-]+(?:\s+[A-Z][a-zA-Z.-]+){1,2}"
    matches: list[tuple[int, int, str]] = []

    # First capture explicit `Name, Title` and `Title Name` forms so we can
    # handle pages that write executive bios in either direction.
    explicit_patterns = [
        re.compile(
            rf"\b(?P<name>{person_pattern})\s*(?:,|—|-|:)?\s*(?P<title>(?i:{title_pattern}))\b",
        ),
        re.compile(
            rf"\b(?P<title>(?i:{title_pattern}))\s*(?:of|at|for|the)?\s*(?P<name>{person_pattern})\b",
        ),
    ]
    for pattern in explicit_patterns:
        for match in pattern.finditer(text):
            name = clean_person_name(match.group("name"))
            title = normalize_whitespace(match.group("title"))
            if not name or not title or not is_plausible_person_name(name):
                continue
            if _looks_like_bad_name(name, stop_words, role_words, company_words):
                continue
            matches.append((match.start(), match.end(), f"{name}|||{title}"))

    def _pick_name(window: str) -> str:
        tail = normalize_whitespace(window)[-80:]
        match = re.search(r"([A-Z][a-zA-Z.-]+(?:\s+[A-Z][a-zA-Z.-]+){1,2})\s*$", tail)
        if not match:
            return ""
        candidate = match.group(1).strip()
        tokens = re.findall(r"[A-Z][a-zA-Z.'-]*", candidate)
        while tokens and tokens[-1].lower() in role_words:
            tokens.pop()
        for size in range(min(3, len(tokens)), 1, -1):
            candidate = " ".join(tokens[-size:])
            words = [part.lower() for part in candidate.split()]
            if (
                not stop_words.intersection(words)
                and not role_words.intersection(words)
                and not company_words.intersection(words)
            ):
                cleaned = clean_person_name(candidate)
                if cleaned and is_plausible_person_name(cleaned) and not _looks_like_bad_name(cleaned, stop_words, role_words, company_words):
                    return cleaned
        return ""

    for pattern in title_patterns:
        for match in re.finditer(pattern, text, re.I):
            matches.append((match.start(), match.end(), normalize_whitespace(match.group(0))))

    matches.sort(key=lambda item: (item[0], -(item[1] - item[0])))
    filtered_matches: list[tuple[int, int, str]] = []
    occupied: list[tuple[int, int]] = []
    for start, end, title in matches:
        if any(not (end <= used_start or start >= used_end) for used_start, used_end in occupied):
            continue
        occupied.append((start, end))
        filtered_matches.append((start, end, title))

    deduped: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for start, _end, title in filtered_matches:
        if "|||" in title:
            name, title = title.split("|||", 1)
        else:
            window = text[max(0, start - 120) : start]
            name = _pick_name(window)
        name = clean_person_name(name)
        if not name or not title:
            continue
        if not is_plausible_person_name(name):
            continue
        key = (name.lower(), title.lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append({"name": name, "title": title})
    return deduped


def _looks_like_bad_name(
    candidate: str,
    stop_words: set[str],
    role_words: set[str],
    company_words: set[str],
) -> bool:
    text = normalize_whitespace(candidate)
    if not text:
        return True
    lowered = text.lower()
    if "'" in text and not re.search(r"\b[A-Z][a-z]+['’][A-Z]?[a-z]+\b", text):
        return True
    words = [part.lower() for part in text.split()]
    if stop_words.intersection(words) or role_words.intersection(words) or company_words.intersection(words):
        return True
    if len(words) < 2 or len(words) > 3:
        return True
    if any(word.endswith("'s") for word in words):
        return True
    if lowered.startswith(("the ", "our ", "a ", "an ")):
        return True
    return False
