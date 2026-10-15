from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any

import requests

from parser import ParsedPage, build_extraction_corpus, candidate_executive_snippets, parse_name_title_pairs
from leadgen_quality import clean_person_name, is_plausible_person_name, is_target_title
from utils import (
    compact_hash,
    dumps_json,
    extract_phones,
    first_non_empty,
    normalize_title,
    normalize_whitespace,
    public_email_is_valid,
)


EXECUTIVE_TITLE_HINTS = [
    "CEO",
    "Founder",
    "Co-Founder",
    "CTO",
    "COO",
    "CMO",
    "CFO",
    "President",
    "Managing Director",
    "Owner",
]


@dataclass
class ExecutiveRecord:
    name: str = ""
    title: str = ""
    linkedin: str = ""
    twitter: str = ""
    email: str = ""
    phone: str = ""


@dataclass
class CompanyExtraction:
    company: str = ""
    website: str = ""
    description: str = ""
    employee_count: str = ""
    executives: list[ExecutiveRecord] = field(default_factory=list)


class LLMClient:
    """
    Minimal OpenAI-compatible client.

    This works with local open-source servers such as Ollama's OpenAI-compatible
    endpoint, vLLM, LM Studio, or any hosted API you explicitly configure.
    """

    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)

    @property
    def enabled(self) -> bool:
        return bool(self.config.get("enabled"))

    def extract(self, prompt: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        base_url = self.config.get("base_url", "http://localhost:11434/v1").rstrip("/")
        model = self.config.get("model", "llama3.1")
        temperature = float(self.config.get("temperature", 0.1))
        max_tokens = int(self.config.get("max_tokens", 1400))
        api_key_env = self.config.get("api_key_env", "LLM_API_KEY")
        api_key = os.getenv(api_key_env, "")

        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You extract executive contact data from public web pages. "
                        "Return only valid JSON that matches the schema."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        }

        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        match = re.search(r"\{.*\}", content, re.S)
        if not match:
            return None
        return json.loads(match.group(0))


class ExecutiveExtractor:
    def __init__(self, config: dict[str, Any], logger: logging.Logger | None = None):
        self.config = config or {}
        self.logger = logger or logging.getLogger(__name__)
        self.llm = LLMClient(self.config.get("llm", {}), self.logger)

    def extract(self, company: dict[str, Any], pages: list[ParsedPage]) -> CompanyExtraction:
        if not pages:
            return CompanyExtraction(
                company=company.get("company_name", ""),
                website=company.get("website", ""),
            )

        if self.llm.enabled:
            try:
                llm_result = self._extract_with_llm(company, pages)
                if llm_result:
                    return llm_result
            except Exception as exc:
                self.logger.warning("LLM extraction failed for %s: %s", company.get("website"), exc)

        return self._extract_heuristically(company, pages)

    def _extract_with_llm(self, company: dict[str, Any], pages: list[ParsedPage]) -> CompanyExtraction | None:
        corpus = build_extraction_corpus(pages)
        prompt = f"""
Extract executive information from the following public website content.

Rules:
- Return only JSON.
- Do not invent people, emails, phone numbers, or social links.
- Only include fields you can support from the content.
- Normalize titles to canonical forms such as CEO, Founder, Co-Founder, CTO, COO, CMO, CFO, President, Managing Director, and Owner.
- Prefer page-level public contact details if they are explicitly listed.

Company context:
{dumps_json(company)}

Website corpus:
{corpus}

Return this JSON shape:
{{
  "company": "",
  "website": "",
  "description": "",
  "employee_count": "",
  "executives": [
    {{
      "name": "",
      "title": "",
      "linkedin": "",
      "twitter": "",
      "email": "",
      "phone": ""
    }}
  ]
}}
"""
        data = self.llm.extract(prompt)
        if not data:
            return None
        return self._coerce_llm_payload(data, company)

    def _coerce_llm_payload(self, data: dict[str, Any], company: dict[str, Any]) -> CompanyExtraction:
        executives: list[ExecutiveRecord] = []
        for item in data.get("executives", []) or []:
            name = clean_person_name(item.get("name", ""))
            title = normalize_title(item.get("title", ""))
            if not name or not title or not is_plausible_person_name(name) or not is_target_title(title):
                continue
            email = normalize_whitespace(item.get("email", ""))
            phone = normalize_whitespace(item.get("phone", ""))
            linkedin = normalize_whitespace(item.get("linkedin", ""))
            twitter = normalize_whitespace(item.get("twitter", ""))
            if email and not public_email_is_valid(email):
                email = ""
            executives.append(
                ExecutiveRecord(
                    name=name,
                    title=title,
                    linkedin=linkedin,
                    twitter=twitter,
                    email=email,
                    phone=phone,
                )
            )

        return CompanyExtraction(
            company=normalize_whitespace(data.get("company") or company.get("company_name", "")),
            website=normalize_whitespace(data.get("website") or company.get("website", "")),
            description=normalize_whitespace(data.get("description", "")),
            employee_count=normalize_whitespace(data.get("employee_count", "")),
            executives=executives,
        )

    def _extract_heuristically(self, company: dict[str, Any], pages: list[ParsedPage]) -> CompanyExtraction:
        executives: list[ExecutiveRecord] = []
        seen: set[str] = set()
        company_name = normalize_whitespace(company.get("company_name", ""))
        website = normalize_whitespace(company.get("website", ""))

        description = ""
        employee_count = ""
        all_text = "\n".join(page.text for page in pages if page.text)

        for page in pages:
            if not description:
                description = page.description or (page.headings[0] if page.headings else "")
            if not employee_count:
                match = re.search(r"(\d{1,6}(?:,\d{3})*)\s+(?:employees|team members|people)", page.text, re.I)
                if match:
                    employee_count = match.group(1)

            source_email = first_non_empty(page.emails)
            source_phone = first_non_empty(page.phones or extract_phones(page.text))
            source_linkedin = first_non_empty(page.linkedin)
            source_twitter = first_non_empty(page.twitter)

            snippets = candidate_executive_snippets(page.text)
            pairs = parse_name_title_pairs("\n".join(snippets or [page.text[:20000]]))
            if not pairs:
                pairs = parse_name_title_pairs(page.text)

            for pair in pairs:
                name = clean_person_name(pair["name"])
                title = normalize_title(pair["title"])
                if not name or not title or not is_plausible_person_name(name):
                    continue
                # Keep only obvious executive titles to reduce false positives.
                if not is_target_title(title):
                    continue

                dedupe = compact_hash(name, company_name or website, website, source_email)
                if dedupe in seen:
                    continue
                seen.add(dedupe)
                executives.append(
                    ExecutiveRecord(
                        name=name,
                        title=title,
                        linkedin=source_linkedin,
                        twitter=source_twitter,
                        email=source_email if public_email_is_valid(source_email) else "",
                        phone=source_phone,
                    )
                )

        if not executives:
            # Fall back to scanning for titles in the whole corpus when we did not
            # capture obvious name/title pairs.
            all_pairs = parse_name_title_pairs(all_text)
            for pair in all_pairs[:10]:
                title = normalize_title(pair["title"])
                name = clean_person_name(pair["name"])
                if not name or not is_plausible_person_name(name) or not is_target_title(title):
                    continue
                dedupe = compact_hash(name, company_name or website, website)
                if dedupe in seen:
                    continue
                seen.add(dedupe)
                executives.append(
                    ExecutiveRecord(
                        name=name,
                        title=title,
                        twitter=source_twitter,
                    )
                )

        return CompanyExtraction(
            company=company_name,
            website=website,
            description=description,
            employee_count=employee_count,
            executives=executives,
        )
