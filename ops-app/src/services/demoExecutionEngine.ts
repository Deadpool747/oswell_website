import type { TableRow } from "@/types/dashboard";

export const runStages = [
  "Queued",
  "Initializing",
  "Running",
  "Calling Model",
  "Processing Tool Calls",
  "Evaluating Response",
  "Completed"
];

const outcomes = ["Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "Completed", "Failed", "Policy Blocked", "Approval Needed", "Timeout", "Warning"];

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function money(value: number) {
  return `$${value.toFixed(3)}`;
}

export function generateRun(input: {
  agent: string;
  environment: string;
  model: string;
  prompt: string;
  priority?: string;
  source?: string;
}): TableRow {
  const year = new Date().getFullYear();
  const status = outcomes[randomInt(0, outcomes.length - 1)];
  const inputTokens = randomInt(500, 4000);
  const outputTokens = randomInt(100, 1500);
  const totalTokens = inputTokens + outputTokens;
  const risk = status === "Policy Blocked" || status === "Approval Needed" ? "High" : status === "Warning" ? "Medium" : ["Low", "Low", "Medium"][randomInt(0, 2)];
  const latency = Number((2.4 + Math.random() * 4.4).toFixed(2));
  return {
    id: `RUN-${year}-${String(randomInt(100000, 999999)).padStart(6, "0")}`,
    name: `Run for ${input.agent}`,
    source: input.source ?? "Oswell AI Operations",
    agent: input.agent,
    status,
    model: input.model,
    input: input.prompt,
    environment: input.environment,
    priority: input.priority ?? "Normal",
    tools: Array.from({ length: randomInt(0, 4) }, (_, index) => ["PolicyCheck", "VectorSearch", "InvoiceLookup", "AuditLog"][index]),
    tokens: totalTokens.toLocaleString(),
    inputTokens: inputTokens.toLocaleString(),
    outputTokens: outputTokens.toLocaleString(),
    cost: money(totalTokens * 0.0000042),
    duration: `${latency}s`,
    confidence: status === "Failed" || status === "Timeout" ? "--" : `${randomInt(75, 99)}%`,
    risk,
    policy: status === "Policy Blocked" ? "Blocked" : status === "Approval Needed" ? "Approval Needed" : "Allowed",
    time: "Just now",
    description:
      status === "Completed"
        ? `Generated a validated response for: ${input.prompt.slice(0, 90)}`
        : status === "Failed"
          ? "Execution stopped during tool orchestration. Retry is available."
          : status === "Timeout"
            ? "Execution exceeded the configured frontend demo timeout window."
            : "Execution completed with governance attention required.",
    progress: status === "Completed" ? 100 : status === "Failed" ? 32 : status === "Timeout" ? 67 : 86
  };
}
