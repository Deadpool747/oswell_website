const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

// The bundled Node API is same-origin in local development. A separate API host
// can be configured explicitly without scattering hostnames throughout the UI.
export const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, "") : "";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
