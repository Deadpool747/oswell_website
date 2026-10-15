from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .oswell_icp import OSWELL_PAIN_KEYWORDS, OSWELL_TARGET_INDUSTRIES, OSWELL_TARGET_SENIORITIES, OSWELL_TARGET_TITLES


@dataclass
class RankedProspect:
    score: int
    reasons: list[str]
    record: dict[str, Any]


def _first(record: dict[str, Any], *keys: str, default: str = "") -> str:
    for key in keys:
        value = record.get(key)
        if value:
            return str(value)
    return default


def _flatten_text(record: dict[str, Any]) -> str:
    parts: list[str] = []
    for key in (
        "title",
        "job_title",
        "headline",
        "company",
        "organization_name",
        "organization_industry",
        "industry",
        "location",
        "organization_location",
        "person_location",
    ):
        value = record.get(key)
        if value:
            parts.append(str(value))
    return " ".join(parts).lower()


def score_prospect(record: dict[str, Any]) -> tuple[int, list[str]]:
    score = 0
    reasons: list[str] = []

    name = _first(record, "name", "full_name", "person_name")
    title = _first(record, "title", "job_title", "person_title", "headline").lower()
    industry = _first(record, "organization_industry", "industry").lower()
    company = _first(record, "organization_name", "company", "account_name")
    location = _first(record, "organization_location", "organization_hq_location", "person_location", "location").lower()
    email_status = _first(record, "contact_email_status", "email_status").lower()
    seniority = _first(record, "person_seniority", "seniority").lower()

    if any(term in title for term in ("founder", "ceo", "coo", "cto", "head of operations", "head of engineering", "director", "vp", "product manager", "operations manager")):
        score += 30
        reasons.append(f"title fit: {title or 'unknown'}")

    if any(s in seniority for s in OSWELL_TARGET_SENIORITIES):
        score += 10
        reasons.append(f"seniority fit: {seniority}")

    if any(ind in industry for ind in OSWELL_TARGET_INDUSTRIES):
        score += 20
        reasons.append(f"industry fit: {industry or 'unknown'}")

    if "india" in location:
        score += 15
        reasons.append(f"location fit: {location or 'India'}")

    if email_status == "verified":
        score += 10
        reasons.append("verified email")

    if any(keyword in _flatten_text(record) for keyword in OSWELL_PAIN_KEYWORDS):
        score += 10
        reasons.append("oswell pain-point signal")

    if name:
        score += 1

    if company and company.lower() in {"startup", "saas"}:
        score += 5

    return score, reasons


def rank_prospects(records: list[dict[str, Any]]) -> list[RankedProspect]:
    ranked = []
    for record in records:
        score, reasons = score_prospect(record)
        ranked.append(RankedProspect(score=score, reasons=reasons, record=record))
    ranked.sort(key=lambda item: item.score, reverse=True)
    return ranked


def extract_people_records(payload: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("people", "contacts", "results", "items", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []

