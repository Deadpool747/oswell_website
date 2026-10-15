#!/bin/zsh

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <source-dir-or-archive>" >&2
  exit 1
fi

: "${HOSTINGER_API_TOKEN:?HOSTINGER_API_TOKEN is required}"
: "${ACCOUNT_USERNAME:?ACCOUNT_USERNAME is required}"
: "${WEBSITE_DOMAIN:?WEBSITE_DOMAIN is required}"

SOURCE_PATH="${1:A}"

UPLOAD_URL_ENDPOINT="https://developers.hostinger.com/api/hosting/v1/files/upload-urls"
CLEAR_DEPLOY_ENDPOINT="https://developers.hostinger.com/api/hosting/v1/accounts/${ACCOUNT_USERNAME}/websites/${WEBSITE_DOMAIN}/deploy"
CACHE_CLEAR_ENDPOINT="https://developers.hostinger.com/api/hosting/v1/accounts/${ACCOUNT_USERNAME}/websites/${WEBSITE_DOMAIN}/cache/clear"

response="$(
  curl -fsS -X POST "$UPLOAD_URL_ENDPOINT" \
    -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"username\":\"${ACCOUNT_USERNAME}\",\"domain\":\"${WEBSITE_DOMAIN}\"}"
)"

upload_url="$(printf '%s' "$response" | jq -r '.url')"
auth_key="$(printf '%s' "$response" | jq -r '.auth_key')"
rest_auth_key="$(printf '%s' "$response" | jq -r '.rest_auth_key')"

if [[ -z "$upload_url" || "$upload_url" == "null" ]]; then
  echo "Upload URL missing in API response." >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

archive_path="$SOURCE_PATH"
archive_created="false"

if [[ -d "$SOURCE_PATH" ]]; then
  archive_name="${SOURCE_PATH:t}_$(date +%Y%m%d_%H%M%S).zip"
  archive_path="${SOURCE_PATH:h}/${archive_name}"
  rm -f "$archive_path"
  (
    cd "$SOURCE_PATH"
    zip -rq "$archive_path" .
  )
  archive_created="true"
elif [[ ! -f "$SOURCE_PATH" ]]; then
  echo "Source path not found: $SOURCE_PATH" >&2
  exit 1
fi

archive_name="${archive_path:t}"
archive_size="$(stat -f%z "$archive_path")"
destination="${upload_url}/${archive_name}?override=true"

echo "Uploading ${archive_name}"

curl -fsS --retry 3 --retry-all-errors --retry-delay 2 -X POST "$destination" \
  -H "X-Auth: ${auth_key}" \
  -H "X-Auth-Rest: ${rest_auth_key}" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Length: ${archive_size}" \
  -H "Upload-Offset: 0" \
  -o /dev/null

curl -fsS --retry 3 --retry-all-errors --retry-delay 2 -X PATCH "$destination" \
  -H "X-Auth: ${auth_key}" \
  -H "X-Auth-Rest: ${rest_auth_key}" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Content-Type: application/offset+octet-stream" \
  -H "Upload-Offset: 0" \
  --data-binary "@${archive_path}" \
  -o /dev/null

curl -fsS --retry 3 --retry-all-errors --retry-delay 2 -X POST "$CLEAR_DEPLOY_ENDPOINT" \
  -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"archive_path\":\"${archive_name}\"}" \
  -o /dev/null

curl -fsS -X DELETE "$CACHE_CLEAR_ENDPOINT" \
  -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
  -o /dev/null

echo "Deployment upload completed and cache cleared for ${WEBSITE_DOMAIN}."

if [[ "$archive_created" == "true" ]]; then
  echo "Created local archive: ${archive_path}"
fi
