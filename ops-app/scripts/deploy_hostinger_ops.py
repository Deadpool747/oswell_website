#!/usr/bin/env python3
"""Deploy Oswell's static export to Hostinger's public_html/ops directory only."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


API_BASE = "https://developers.hostinger.com/api/hosting/v1"
WEBSITE_DOMAIN = "oswelltechnologies.com"
DESTINATION_PREFIX = "ops"
TOKEN_ENV = "HOSTINGER_API_TOKEN"
FORBIDDEN_TEXT = (
    b"http://localhost:3000",
    b"http://localhost:3001",
    b"http://localhost:8000",
    b"http://127.0.0.1:8000",
    b"DATABASE_URL",
    b"APP_ENCRYPTION_KEY",
    b"AZURE_CLIENT_SECRET",
    b"AZURE_AD_CLIENT_SECRET",
    b"NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET",
    b"OPENAI_API_KEY",
    b"FOUNDRY_API_KEY",
)
JWT_PATTERN = re.compile(rb"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")
CLIENT_SECRET_VALUE_PATTERN = re.compile(
    rb"(?i)(?:client[_-]?secret|clientSecret)(?:[\"']|\\\")?\s*[:=]\s*(?:[\"']|\\\")?[A-Za-z0-9._~+/=-]{12,}"
)


class DeployError(RuntimeError):
    """A safe, sanitized deployment failure."""


@dataclass(frozen=True)
class HostingerWebsite:
    username: str
    domain: str


@dataclass(frozen=True)
class UploadCredentials:
    url: str
    auth_key: str
    rest_auth_key: str


def api_request(
    url: str,
    token: str,
    *,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
) -> tuple[int, dict[str, str], bytes]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            return response.status, dict(response.headers.items()), response.read()
    except HTTPError as error:
        raise DeployError(f"Hostinger API request failed: HTTP {error.code}") from None
    except URLError as error:
        raise DeployError(f"Hostinger API request failed: {error.reason}") from None


def json_response(url: str, token: str, *, method: str = "GET", payload: dict[str, Any] | None = None) -> Any:
    _, _, body = api_request(url, token, method=method, payload=payload)
    try:
        return json.loads(body)
    except json.JSONDecodeError as error:
        raise DeployError("Hostinger API returned invalid JSON.") from error


def response_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("data", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    raise DeployError("Hostinger API response did not contain a list.")


def resolve_website(token: str) -> HostingerWebsite:
    try:
        payload = json_response(f"{API_BASE}/websites", token)
    except DeployError as error:
        raise DeployError(f"Website discovery failed: {error}") from None
    for item in response_items(payload):
        domain = str(item.get("domain", "")).lower()
        username = item.get("username") or item.get("account_username")
        if domain == WEBSITE_DOMAIN and isinstance(username, str) and username:
            return HostingerWebsite(username=username, domain=domain)
    raise DeployError(f"Hostinger website {WEBSITE_DOMAIN} was not found for this token.")


def list_ops(website: HostingerWebsite, token: str) -> list[dict[str, Any]]:
    query = urlencode({"directory": DESTINATION_PREFIX, "max_depth": 10, "max_items": 2000, "offset": 0})
    url = f"{API_BASE}/accounts/{quote(website.username)}/domains/{quote(website.domain)}/files?{query}"
    try:
        payload = json_response(url, token)
    except DeployError as error:
        raise DeployError(f"ops preflight listing failed: {error}") from None
    return response_items(payload)


def validate_target(target: str) -> str:
    path = PurePosixPath(target)
    if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] != DESTINATION_PREFIX:
        raise DeployError(f"Unsafe destination path rejected: {target!r}")
    normalized = str(path)
    if not normalized.startswith(f"{DESTINATION_PREFIX}/"):
        raise DeployError(f"Unsafe destination path rejected: {target!r}")
    return normalized


def output_files(output_dir: Path) -> list[tuple[Path, str]]:
    if not output_dir.is_dir():
        raise DeployError(f"Static output directory does not exist: {output_dir}")
    files: list[tuple[Path, str]] = []
    for source in sorted(output_dir.rglob("*")):
        if source.is_symlink():
            raise DeployError(f"Symlinked static asset rejected: {source}")
        if source.is_file():
            relative = source.relative_to(output_dir).as_posix()
            files.append((source, validate_target(f"{DESTINATION_PREFIX}/{relative}")))
    if not files:
        raise DeployError("Static output directory contains no files.")
    return files


def security_scan(files: list[tuple[Path, str]]) -> None:
    found_api_url = False
    for source, target in files:
        contents = source.read_bytes()
        if b"https://api.oswelltechnologies.com" in contents:
            found_api_url = True
        for forbidden in FORBIDDEN_TEXT:
            if forbidden in contents:
                raise DeployError(f"Static security scan failed for {target}: forbidden configuration marker.")
        if JWT_PATTERN.search(contents):
            raise DeployError(f"Static security scan failed for {target}: token-like value detected.")
        if CLIENT_SECRET_VALUE_PATTERN.search(contents):
            raise DeployError(f"Static security scan failed for {target}: client-secret-like value detected.")
    if not found_api_url:
        raise DeployError("Static security scan failed: production API URL is absent.")


def upload_credentials(website: HostingerWebsite, token: str) -> UploadCredentials:
    try:
        payload = json_response(
            f"{API_BASE}/files/upload-urls",
            token,
            method="POST",
            payload={"username": website.username, "domain": website.domain},
        )
    except DeployError as error:
        raise DeployError(f"Upload credential request failed: {error}") from None
    if not isinstance(payload, dict):
        raise DeployError("Hostinger upload credentials response was invalid.")
    values = (payload.get("url"), payload.get("auth_key"), payload.get("rest_auth_key"))
    if not all(isinstance(value, str) and value for value in values):
        raise DeployError("Hostinger upload credentials response was incomplete.")
    return UploadCredentials(*values)


def tus_request(url: str, headers: dict[str, str], *, method: str, data: bytes | None = None) -> tuple[int, dict[str, str]]:
    request = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=90) as response:
            return response.status, dict(response.headers.items())
    except HTTPError as error:
        raise DeployError(f"TUS upload failed: HTTP {error.code}") from None
    except URLError as error:
        raise DeployError(f"TUS upload failed: {error.reason}") from None


def upload_one(source: Path, target: str, credentials: UploadCredentials) -> None:
    target = validate_target(target)
    size = source.stat().st_size
    destination = f"{credentials.url.rstrip('/')}/{quote(target, safe='/')}?override=true"
    common_headers = {
        "X-Auth": credentials.auth_key,
        "X-Auth-Rest": credentials.rest_auth_key,
        "Tus-Resumable": "1.0.0",
    }
    create_headers = {**common_headers, "Upload-Length": str(size), "Upload-Offset": "0", "Content-Length": "0"}
    create_status, create_response_headers = tus_request(destination, create_headers, method="POST", data=b"")
    if create_status not in (200, 201, 204):
        raise DeployError(f"TUS create failed for {target}: HTTP {create_status}")
    create_offset = create_response_headers.get("Upload-Offset")
    if create_offset not in (None, "0"):
        raise DeployError(f"TUS create failed for {target}: unexpected upload offset.")

    data = source.read_bytes()
    patch_headers = {
        **common_headers,
        "Content-Type": "application/offset+octet-stream",
        "Upload-Offset": "0",
        "Content-Length": str(size),
    }
    patch_status, patch_response_headers = tus_request(destination, patch_headers, method="PATCH", data=data)
    if patch_status not in (200, 204):
        raise DeployError(f"TUS upload failed for {target}: HTTP {patch_status}")
    if patch_response_headers.get("Upload-Offset") != str(size):
        raise DeployError(f"TUS upload failed for {target}: upload offset did not match file size.")


def remote_paths(items: list[dict[str, Any]]) -> set[str]:
    paths: set[str] = set()
    for item in items:
        value = item.get("path")
        if isinstance(value, str):
            paths.add(value.lstrip("./"))
    return paths


def print_preflight(website: HostingerWebsite, files: list[tuple[Path, str]], remote_items: list[dict[str, Any]]) -> None:
    total_bytes = sum(source.stat().st_size for source, _ in files)
    print(f"Hostinger website: {website.domain} ({website.username})")
    print(f"Dry-run files: {len(files)}")
    print(f"Dry-run bytes: {total_bytes}")
    print("Sample destinations:")
    for _, target in files[:10]:
        print(f"  {target}")
    print(f"Existing ops entries: {len(remote_items)}")


def verify_remote(website: HostingerWebsite, token: str, files: list[tuple[Path, str]]) -> None:
    present = remote_paths(list_ops(website, token))
    required = {"ops/index.html"}
    local_targets = {target for _, target in files}
    if "ops/security/index.html" in local_targets:
        required.add("ops/security/index.html")
    if any(target.startswith("ops/_next/") for target in local_targets):
        required.add(next(target for _, target in files if target.startswith("ops/_next/")))
    missing = sorted(required - present)
    if missing:
        raise DeployError(f"Remote verification failed: missing {', '.join(missing)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="Validate and preflight without changing Hostinger files.")
    mode.add_argument("--deploy", action="store_true", help="Upload only files mapped to public_html/ops.")
    parser.add_argument("--output-dir", type=Path, default=Path("out"), help="Static export directory (default: out).")
    args = parser.parse_args()

    token = os.getenv(TOKEN_ENV, "").strip()
    if not token:
        print("HOSTINGER_API_TOKEN_REQUIRED", file=sys.stderr)
        return 2

    try:
        files = output_files(args.output_dir.resolve())
        security_scan(files)
        website = resolve_website(token)
        remote_items = list_ops(website, token)
        print_preflight(website, files, remote_items)
        if args.dry_run:
            return 0

        credentials = upload_credentials(website, token)
        uploaded = 0
        for source, target in files:
            upload_one(source, target, credentials)
            uploaded += 1
            print(f"Uploaded {uploaded}/{len(files)}: {target}")
        verify_remote(website, token, files)
        print(f"Deployment complete: {uploaded} files uploaded to {DESTINATION_PREFIX}/ only.")
        return 0
    except DeployError as error:
        print(f"DEPLOYMENT_FAILED: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
