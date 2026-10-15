import { apiUrl } from "@/lib/api/config";
import { accessToken } from "@/lib/auth/entra";
import { currentCsrfToken } from "@/lib/auth/local-session";
import { localAuthenticationEnabled } from "@/lib/auth/entra";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = await accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (localAuthenticationEnabled() && unsafeMethods.has((options?.method ?? "GET").toUpperCase())) {
    const csrfToken = currentCsrfToken();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...options, cache: "no-store", headers, credentials: "include" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed.";
    throw new Error(`Unable to reach Oswell API: ${message}`);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: string; message?: string; detail?: string };
      detail = body.error ?? body.message ?? body.detail ?? "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    if (response.status === 401 && localAuthenticationEnabled() && !path.startsWith("/api/auth/")) {
      if (typeof window !== "undefined") window.location.assign("/login/");
    }
    throw new Error(`Oswell API ${response.status}: ${detail || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers = new Headers();
  const token = await accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const csrfToken = currentCsrfToken();
  if (localAuthenticationEnabled() && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(apiUrl(path), { method: "POST", headers, credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(`Oswell API ${response.status}: Unable to generate export.`);
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(objectUrl);
}
