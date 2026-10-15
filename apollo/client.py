from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv


load_dotenv()


class ApolloClient:
    """Small Apollo API wrapper.

    Apollo auth uses the x-api-key header on every request.
    """

    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or os.getenv("APOLLO_API_KEY")
        self.base_url = (base_url or os.getenv("APOLLO_BASE_URL") or "https://api.apollo.io").rstrip("/")
        if not self.api_key:
            raise ValueError("Missing APOLLO_API_KEY environment variable")

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cache-Control": "no-cache",
        }

    def health(self) -> dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/v1/auth/health",
            headers=self._headers(),
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def search_people(self, *, params: list[tuple[str, str | int | bool]]) -> dict[str, Any]:
        normalized_params: list[tuple[str, str | int]] = []
        for key, value in params:
            if isinstance(value, bool):
                normalized_params.append((key, str(value).lower()))
            else:
                normalized_params.append((key, value))
        response = requests.post(
            f"{self.base_url}/api/v1/mixed_people/api_search",
            headers=self._headers(),
            params=normalized_params,
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def enrich_person(self, **params: Any) -> dict[str, Any]:
        clean_params = {key: value for key, value in params.items() if value not in (None, "")}
        response = requests.post(
            f"{self.base_url}/api/v1/people/match",
            headers=self._headers(),
            params=clean_params,
            timeout=60,
        )
        response.raise_for_status()
        return response.json()
