import { apiUrl } from "@/lib/api/config";
import { localAuthenticationEnabled } from "@/lib/auth/entra";

export type LocalSession = {
  authenticated: true;
  username: string;
  role: string;
  csrf_token: string;
};

let csrfToken: string | null = null;

export function currentCsrfToken() {
  return csrfToken;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

async function localFetch(path: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(apiUrl(path), { ...options, headers, credentials: "include", cache: "no-store" });
}

export async function getLocalSession(): Promise<LocalSession | null> {
  if (!localAuthenticationEnabled()) return null;
  const response = await localFetch("/api/auth/me");
  if (response.status === 401) {
    setCsrfToken(null);
    return null;
  }
  if (!response.ok) throw new Error("Unable to verify your Oswell session.");
  const session = await response.json() as LocalSession;
  setCsrfToken(session.csrf_token);
  return session;
}

export async function loginLocally(username: string, password: string): Promise<LocalSession> {
  const response = await localFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  if (response.status === 401) throw new Error("Invalid username or password.");
  if (response.status === 429) throw new Error("Too many sign-in attempts. Please try again later.");
  if (!response.ok) throw new Error("Oswell sign-in is temporarily unavailable. Please retry.");
  const session = await response.json() as LocalSession;
  setCsrfToken(session.csrf_token);
  return session;
}

export async function logoutLocally() {
  const token = currentCsrfToken();
  const response = await localFetch("/api/auth/logout", { method: "POST", headers: token ? { "X-CSRF-Token": token } : undefined });
  if (!response.ok) throw new Error("Unable to sign out.");
  setCsrfToken(null);
}
