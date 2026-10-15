import { API_BASE_URL } from "@/lib/api/config";
import { apiFetch } from "@/lib/api/client";

const configuredBaseUrl = process.env.NEXT_PUBLIC_FOUNDRY_API_URL?.trim();

export const FOUNDRY_API_BASE_URL = configuredBaseUrl?.replace(/\/$/, "") ?? "";

export type FoundryStatus = {
  connected: boolean;
  authentication: string;
  project_endpoint: string;
  configured_agent: string;
  agent_management_available: boolean;
  agent_listing: "EXPECTED_FORBIDDEN" | "AVAILABLE";
  latency_ms: number;
};

export type FoundryAgent = {
  name: string;
  id: string | null;
  description: string | null;
  version: string | null;
  latest_version: string | null;
  kind: string | null;
  model: string | null;
  state?: string | null;
  configuration_state?: string | null;
  definition?: Record<string, unknown>;
};

export type FoundryRun = {
  agent_name: string;
  version: string | null;
  output_text: string;
  response_id: string | null;
  model: string | null;
  latency_ms: number;
  conversation_id: string | null;
  run_id: string | null;
};

export type FoundryVersion = { version: string; description: string | null; definition: Record<string, unknown>; created_at: string | null; status: string | null };
export type FoundryModel = { id: string; source: string };

export async function foundryFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!FOUNDRY_API_BASE_URL) {
    throw new Error("Microsoft Foundry API URL is not configured.");
  }
  try {
    const target = `${FOUNDRY_API_BASE_URL}${path}`;
    const apiPath = API_BASE_URL && target.startsWith(API_BASE_URL) ? target.slice(API_BASE_URL.length) : target;
    return await apiFetch<T>(apiPath, options);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unable to reach the Microsoft Foundry service.");
  }
}
