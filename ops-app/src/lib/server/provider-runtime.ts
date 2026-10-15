import type { TableRow } from "@/types/dashboard";
import { getOpenAIStatus } from "@/lib/server/openai-service";

type SupportedProvider = "openai" | "azure-openai";
type ResolvedProvider = SupportedProvider | null;

type Usage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

type ProviderExecutionResult = {
  content: string;
  durationMs: number;
  model: string;
  provider: SupportedProvider;
  usage: Usage;
};

type ConnectionCheckResult = {
  authentication: string;
  health: string;
  latency: string;
  message: string;
  permissions: string;
  provider: SupportedProvider;
  status: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local and restart the server.`);
  }
  return value;
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return {
    apiBase: process.env.OPENAI_API_BASE?.trim() || "https://api.openai.com/v1",
    apiKey,
    configured: Boolean(apiKey),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
  };
}

function getAzureOpenAIConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  return {
    apiKey,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION?.trim() || "2024-10-21",
    configured: Boolean(endpoint && apiKey && deployment),
    deployment,
    endpoint
  };
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, "");
}

function parseDuration(startedAt: number) {
  return Date.now() - startedAt;
}

function extractOpenAIContent(payload: unknown) {
  const body = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  };
  if (typeof body.output_text === "string") return body.output_text.trim();
  const responseText = body.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();
  if (responseText) return responseText;
  const content = body.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

const liveOpenAIAgentNames = new Set(["Invoice Validation Agent"]);

function getRowProvider(row?: TableRow): ResolvedProvider {
  if (String(row?.status ?? "").trim().toLowerCase() === "not connected") {
    return null;
  }
  const provider = String(row?.provider ?? row?.connectorProvider ?? "").trim().toLowerCase();
  if (provider === "openai" || provider === "azure-openai") {
    return provider as SupportedProvider;
  }

  const source = String(row?.source ?? row?.name ?? "").toLowerCase();
  if (source.includes("azure")) return "azure-openai";
  if (source.includes("openai")) return "openai";
  return null;
}

export function buildProviderConnectorRows() {
  const openAI = getOpenAIConfig();

  return [
    {
      id: "conn-openai-platform",
      name: "OpenAI Platform",
      description: openAI.configured ? "Primary OpenAI runtime for local production-style testing." : "Set OPENAI_API_KEY in .env.local to enable live runs.",
      type: "AI Service",
      provider: "openai",
      source: "OpenAI",
      environment: "Production",
      status: openAI.configured ? "Active" : "Warning",
      health: openAI.configured ? "Ready" : "Missing Config",
      authentication: openAI.configured ? "Configured" : "Missing API Key",
      permissions: openAI.configured ? "Unknown" : "Blocked",
      model: openAI.model,
      apiBase: openAI.apiBase,
      progress: openAI.configured ? 96 : 18,
      risk: openAI.configured ? "Low" : "High",
      time: openAI.configured ? "Ready" : "Needs setup"
    },
    {
      id: "conn-azure-openai",
      name: "Azure AI Foundry",
      description: "Visible in the registry, but not wired for live execution in the current OpenAI-only localhost scope.",
      type: "AI Service",
      source: "Azure AI Foundry",
      environment: "Production",
      status: "Not Connected",
      health: "Not Configured",
      authentication: "OpenAI Only",
      permissions: "Unavailable",
      endpoint: "",
      deployment: "",
      apiVersion: "",
      progress: 0,
      risk: "Medium",
      time: "Display only"
    }
  ] satisfies TableRow[];
}

export function withProductionConnectorMetadata(rows: TableRow[]) {
  const [openAIConnector, azureConnector] = buildProviderConnectorRows();
  const normalized = rows.map((row) => {
    if (row.id === "conn-azure-openai" || String(row.name ?? "").toLowerCase().includes("azure")) {
      return { ...row, ...azureConnector };
    }
    if (row.id === "conn-openai-platform" || (String(row.name ?? "").toLowerCase().includes("openai") && !String(row.name ?? "").toLowerCase().includes("azure"))) {
      return { ...row, ...openAIConnector };
    }
    return {
      ...row,
      provider: "",
      status: "Not Connected",
      health: "Not Configured",
      authentication: "Display Only",
      permissions: "Unavailable",
      progress: 0,
      time: "Display only"
    };
  });

  const byId = new Map(normalized.map((row) => [row.id, row] as const));
  byId.set(openAIConnector.id, { ...byId.get(openAIConnector.id), ...openAIConnector });
  byId.set(azureConnector.id, { ...byId.get(azureConnector.id), ...azureConnector });
  return Array.from(byId.values());
}

export function withProductionAgentMetadata(rows: TableRow[]) {
  return rows.map((row) => {
    if (liveOpenAIAgentNames.has(String(row.name ?? ""))) {
      return {
        ...row,
        connectorId: "conn-openai-platform",
        provider: "openai",
        source: "OpenAI",
        health: "Connected"
      };
    }
    return {
      ...row,
      connectorId: "",
      provider: "",
      source: "Display Only",
      health: "Not Connected"
    };
  });
}

export function summarizeExecution(content: string) {
  const singleLine = content.replace(/\s+/g, " ").trim();
  if (!singleLine) return "The provider returned an empty response.";
  return singleLine.length > 140 ? `${singleLine.slice(0, 137)}...` : singleLine;
}

export function buildRunRecord(input: {
  agent: string;
  connector: TableRow;
  durationMs: number;
  environment: string;
  model: string;
  output: string;
  prompt: string;
  usage: Usage;
}) {
  const totalTokens = input.usage.totalTokens ?? (input.usage.promptTokens ?? 0) + (input.usage.completionTokens ?? 0);
  const year = new Date().getFullYear();
  return {
    id: `RUN-${year}-${String(Math.floor(100000 + Math.random() * 900000))}`,
    name: `Run for ${input.agent}`,
    source: String(input.connector.source ?? input.connector.name ?? "OpenAI"),
    connectorId: input.connector.id,
    connectorProvider: input.connector.provider,
    agent: input.agent,
    status: "Completed",
    model: input.model,
    input: input.prompt,
    output: input.output,
    environment: input.environment,
    priority: "Normal",
    tools: [],
    tokens: totalTokens ? totalTokens.toLocaleString() : "--",
    inputTokens: input.usage.promptTokens?.toLocaleString() ?? "--",
    outputTokens: input.usage.completionTokens?.toLocaleString() ?? "--",
    cost: "Unavailable",
    duration: `${(input.durationMs / 1000).toFixed(2)}s`,
    confidence: "Live",
    risk: "Low",
    policy: "Allowed",
    time: "Just now",
    lastUpdated: new Date().toLocaleString(),
    description: summarizeExecution(input.output),
    progress: 100
  } satisfies TableRow;
}

async function executeOpenAIRun(prompt: string, agentName: string, requestedModel?: string): Promise<ProviderExecutionResult> {
  const startedAt = Date.now();
  const config = getOpenAIConfig();
  const model = requestedModel || config.model;
  const response = await fetch(`${config.apiBase}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: `You are the ${agentName}. Return a concise, production-style answer with no markdown bullets unless necessary.`,
      input: prompt
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI run failed: ${response.status} ${message.slice(0, 240)}`);
  }

  const body = (await response.json()) as {
    output_text?: string;
    usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
    model?: string;
  };

  return {
    content: extractOpenAIContent(body),
    durationMs: parseDuration(startedAt),
    model: body.model || model,
    provider: "openai",
    usage: {
      promptTokens: body.usage?.input_tokens,
      completionTokens: body.usage?.output_tokens,
      totalTokens: body.usage?.total_tokens
    }
  };
}

async function executeAzureOpenAIRun(prompt: string, agentName: string, requestedModel?: string): Promise<ProviderExecutionResult> {
  const startedAt = Date.now();
  const config = getAzureOpenAIConfig();
  const endpoint = normalizeEndpoint(requireEnv("AZURE_OPENAI_ENDPOINT"));
  const deployment = requireEnv("AZURE_OPENAI_DEPLOYMENT");
  const apiVersion = config.apiVersion;
  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": requireEnv("AZURE_OPENAI_API_KEY")
    },
    body: JSON.stringify({
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are the ${agentName}. Return a concise, production-style answer with no markdown bullets unless necessary.`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Azure OpenAI run failed: ${response.status} ${message.slice(0, 240)}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    model?: string;
  };

  return {
    content: extractOpenAIContent(body),
    durationMs: parseDuration(startedAt),
    model: body.model || requestedModel || deployment,
    provider: "azure-openai",
    usage: {
      promptTokens: body.usage?.prompt_tokens,
      completionTokens: body.usage?.completion_tokens,
      totalTokens: body.usage?.total_tokens
    }
  };
}

export async function executeLiveRun(input: { connector: TableRow; row?: TableRow }) {
  const connectorProvider = getRowProvider(input.connector);
  if (!connectorProvider) {
    throw new Error(`${input.connector.name ?? "Selected connector"} is not wired for live execution.`);
  }
  const agentName = String(input.row?.agent ?? input.row?.name ?? "Invoice Validation Agent");
  const prompt = String(
    input.row?.input ??
    input.row?.description ??
    "Validate this request through the Oswell AI Operations runtime."
  );
  const environment = String(input.row?.environment ?? "Production");
  const requestedModel = String(input.row?.model ?? input.connector.model ?? "").trim() || undefined;

  const result = connectorProvider === "azure-openai"
    ? await executeAzureOpenAIRun(prompt, agentName, requestedModel)
    : await executeOpenAIRun(prompt, agentName, requestedModel);

  return buildRunRecord({
    agent: agentName,
    connector: input.connector,
    durationMs: result.durationMs,
    environment,
    model: result.model,
    output: result.content,
    prompt,
    usage: result.usage
  });
}

async function checkOpenAIConnection(): Promise<ConnectionCheckResult> {
  const status = await getOpenAIStatus(true);
  if (!status.configured) {
    return {
      authentication: "Missing API Key",
      health: "Missing Config",
      latency: "--",
      message: "Set OPENAI_API_KEY in .env.local to enable the OpenAI connector.",
      permissions: "Blocked",
      provider: "openai",
      status: "Warning"
    };
  }

  if (!status.connected) {
    throw new Error(status.message ?? "OpenAI connector check failed.");
  }

  return {
    authentication: "Valid",
    health: "Healthy",
    latency: `${status.latency_ms ?? 0} ms`,
    message: "OpenAI connector is reachable and authenticated.",
    permissions: "Available",
    provider: "openai",
    status: "Active"
  };
}

async function checkAzureOpenAIConnection(): Promise<ConnectionCheckResult> {
  const startedAt = Date.now();
  const config = getAzureOpenAIConfig();
  if (!config.configured) {
    return {
      authentication: "Missing Endpoint/Key",
      health: "Missing Config",
      latency: "--",
      message: "Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT in .env.local.",
      permissions: "Blocked",
      provider: "azure-openai",
      status: "Warning"
    };
  }

  const response = await fetch(`${normalizeEndpoint(config.endpoint!)}/openai/deployments/${config.deployment}/chat/completions?api-version=${encodeURIComponent(config.apiVersion)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey!
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "Return pong." },
        { role: "user", content: "ping" }
      ],
      max_tokens: 4,
      temperature: 0
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Azure OpenAI connector check failed: ${response.status} ${message.slice(0, 200)}`);
  }

  return {
    authentication: "Valid",
    health: "Healthy",
    latency: `${Date.now() - startedAt} ms`,
    message: "Azure AI Foundry connector is reachable and authenticated.",
    permissions: "Available",
    provider: "azure-openai",
    status: "Active"
  };
}

export async function testLiveConnector(row?: TableRow) {
  const provider = getRowProvider(row);
  if (!provider) {
    return {
      authentication: "Display Only",
      health: "Not Configured",
      latency: "--",
      message: `${row?.name ?? "This connector"} is visible in the UI but not wired for live backend testing in the current OpenAI-only setup.`,
      permissions: "Unavailable",
      provider: "openai",
      status: "Not Connected"
    } satisfies ConnectionCheckResult;
  }
  return provider === "azure-openai" ? checkAzureOpenAIConnection() : checkOpenAIConnection();
}
