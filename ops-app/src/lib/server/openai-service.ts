type OpenAIModel = {
  id: string;
  owned_by: string;
};

export type OpenAIStatus = {
  provider: "openai";
  configured: boolean;
  connected: boolean;
  status: "healthy" | "authentication_error" | "not_configured" | "unavailable";
  models_available: number;
  last_checked_at: string;
  latency_ms: number | null;
  message?: string;
};

let cachedStatus: OpenAIStatus | null = null;
let cachedAt = 0;
const statusCacheMs = 60_000;

function config() {
  return {
    apiBase: process.env.OPENAI_API_BASE?.trim().replace(/\/$/, "") || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY?.trim()
  };
}

function failureStatus(status: OpenAIStatus["status"], message: string, startedAt: number): OpenAIStatus {
  return {
    provider: "openai",
    configured: Boolean(config().apiKey),
    connected: false,
    status,
    models_available: 0,
    last_checked_at: new Date().toISOString(),
    latency_ms: Date.now() - startedAt,
    message
  };
}

export async function listOpenAIModels() {
  const { apiBase, apiKey } = config();
  if (!apiKey) throw new Error("OpenAI is not configured on the server.");

  const response = await fetch(`${apiBase}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("The configured OpenAI API key was rejected.");
    }
    throw new Error(`OpenAI models request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { data?: OpenAIModel[] };
  return (payload.data ?? []).map((model) => ({ id: model.id, owned_by: model.owned_by || "OpenAI", availability: "available" }));
}

export async function getOpenAIStatus(refresh = false): Promise<OpenAIStatus> {
  if (!refresh && cachedStatus && Date.now() - cachedAt < statusCacheMs) return cachedStatus;

  const startedAt = Date.now();
  if (!config().apiKey) {
    cachedStatus = failureStatus("not_configured", "OPENAI_API_KEY is not configured on the server.", startedAt);
    cachedAt = Date.now();
    return cachedStatus;
  }

  try {
    const models = await listOpenAIModels();
    cachedStatus = {
      provider: "openai",
      configured: true,
      connected: true,
      status: "healthy",
      models_available: models.length,
      last_checked_at: new Date().toISOString(),
      latency_ms: Date.now() - startedAt
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI connection check failed.";
    cachedStatus = failureStatus(message.includes("rejected") ? "authentication_error" : "unavailable", message, startedAt);
  }

  cachedAt = Date.now();
  return cachedStatus;
}
