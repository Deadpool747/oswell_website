from __future__ import annotations

OSWELL_TARGET_TITLES = [
    "founder",
    "co-founder",
    "ceo",
    "chief executive officer",
    "coo",
    "chief operating officer",
    "cto",
    "chief technology officer",
    "vp engineering",
    "head of engineering",
    "head of product",
    "product manager",
    "head of operations",
    "operations manager",
    "director of operations",
]

OSWELL_TARGET_SENIORITIES = [
    "founder",
    "c_suite",
    "vp",
    "head",
    "director",
    "manager",
]

OSWELL_TARGET_ORG_LOCATIONS = ["India"]

OSWELL_TARGET_INDUSTRIES = [
    "logistics",
    "fintech",
    "healthcare",
    "retail",
    "education",
    "manufacturing",
    "real estate",
    "enterprise it",
    "software",
    "information technology",
    "startup",
]

OSWELL_PAIN_KEYWORDS = [
    "automation",
    "ai",
    "agent",
    "workflow",
    "support",
    "ops",
    "operations",
    "logistics",
    "delivery",
    "ocr",
    "voice",
    "chatbot",
    "dashboard",
    "fraud",
    "predictive",
]


def build_oswell_people_params(page: int = 1, per_page: int = 25) -> list[tuple[str, str | int | bool]]:
    params: list[tuple[str, str | int | bool]] = []

    for title in OSWELL_TARGET_TITLES:
        params.append(("person_titles[]", title))

    for seniority in OSWELL_TARGET_SENIORITIES:
        params.append(("person_seniorities[]", seniority))

    for location in OSWELL_TARGET_ORG_LOCATIONS:
        params.append(("organization_locations[]", location))

    params.extend(
        [
            ("contact_email_status[]", "verified"),
            ("include_similar_titles", False),
            ("page", page),
            ("per_page", per_page),
        ]
    )
    return params
