import { addAuditTrail, mutateDatabase, readDatabase, resetDatabase, type OswellDatabase } from "@/lib/server/oswell-db";
import { executeLiveRun, testLiveConnector } from "@/lib/server/provider-runtime";
import { generateTestResult } from "@/services/demoTestRunner";
import type { TableRow } from "@/types/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const isDemoMode = process.env.APP_MODE === "demo";

const azureAgents: TableRow[] = [
  {
    id: "agent-azure-finance-copilot",
    name: "Azure Finance Copilot",
    description: "Imported from Azure AI Foundry with invoice, PO, and payment exception tools.",
    type: "Assistant",
    capability: "Finance Operations",
    status: "Active",
    environment: "Production",
    source: "Azure AI Foundry",
    provider: "",
    connectorId: "",
    health: "Not Connected",
    progress: 0,
    risk: "Medium",
    version: "v1.0.0",
    time: "Just now"
  },
  {
    id: "agent-azure-vendor-risk",
    name: "Azure Vendor Risk Agent",
    description: "Imported from Azure AI Foundry to score third-party AI vendors and route high risk findings.",
    type: "Analysis",
    capability: "Risk Assessment",
    status: "Active",
    environment: "Production",
    source: "Azure AI Foundry",
    provider: "",
    connectorId: "",
    health: "Not Connected",
    progress: 0,
    risk: "High",
    version: "v1.0.0",
    time: "Just now"
  }
];

function findRecord(current: OswellDatabase, key: string, row?: TableRow) {
  if (!row) return undefined;
  return (current.records[key] ?? []).find((item) => item.id === row.id) ?? row;
}

function resolveConnector(current: OswellDatabase, row?: TableRow) {
  const connectors = current.records.connectors ?? [];
  if (!connectors.length) {
    throw new Error("No connectors are configured in the backend database.");
  }

  const connectorId = String(row?.connectorId ?? "").trim();
  if (connectorId) {
    const match = connectors.find((connector) => connector.id === connectorId);
    if (match) return match;
  }

  const provider = String(row?.provider ?? row?.connectorProvider ?? "").trim().toLowerCase();
  if (provider) {
    const match = connectors.find((connector) => String(connector.provider ?? "").toLowerCase() === provider);
    if (match) return match;
  }

  const source = String(row?.source ?? "").trim().toLowerCase();
  if (source) {
    const match = connectors.find((connector) => {
      const connectorSource = String(connector.source ?? connector.name ?? "").toLowerCase();
      return connectorSource.includes(source) || source.includes(connectorSource);
    });
    if (match) return match;
  }

  const openAI = connectors.find((connector) => connector.id === "conn-openai-platform");
  if (openAI) return openAI;
  return connectors[0];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: string; row?: TableRow; key?: string };
    const action = body.action.toLowerCase();

    if (!isDemoMode && ["import-azure-agents", "run-test", "sync-row", "change-prompt"].includes(action)) {
      return Response.json(
        { error: `${body.action} is unavailable: the required provider/job integration has not been configured.` },
        { status: 501 }
      );
    }

    if (action === "reset") {
      return Response.json({ database: resetDatabase() });
    }

    if (action === "import-azure-agents") {
      const timestamp = Date.now().toString().slice(-5);
      const database = mutateDatabase((current) => {
        const existingNames = new Set((current.records.agents ?? []).map((row) => row.name));
        const imported = azureAgents
          .filter((row) => !existingNames.has(row.name))
          .map((row) => ({ ...row, id: `${row.id}-${timestamp}` }));
        if (!imported.length) {
          return current;
        }

        const next: OswellDatabase = {
          ...current,
          records: {
            ...current.records,
            agents: [...imported, ...(current.records.agents ?? [])]
          }
        };
        return imported.reduce<OswellDatabase>((acc, row) => addAuditTrail(acc, "agents", row, "Imported From Azure"), next);
      });
      return Response.json({ database, imported: azureAgents.length });
    }

    if (action === "change-prompt" && body.row) {
      const prompt = body.row;
      const nextVersion = incrementVersion(String(prompt.version ?? "v1.0.0"));
      const updatedPrompt: TableRow = {
        ...prompt,
        version: nextVersion,
        status: "Pending Approval",
        approval: "Pending",
        testScore: "Pending",
        risk: prompt.risk ?? "Medium",
        time: "Just now",
        lastUpdated: new Date().toLocaleString(),
        description: `${prompt.description ?? "Prompt"} Updated with stricter instruction hierarchy, citation checks, and policy routing.`
      };
      const approval: TableRow = {
        id: `APR-${Date.now().toString().slice(-6)}`,
        name: "Prompt Change Approval",
        agent: String(prompt.agent ?? "Linked Agent"),
        action: "Review Prompt Version",
        resource: `${prompt.name ?? prompt.id} ${nextVersion}`,
        risk: String(updatedPrompt.risk ?? "Medium"),
        policy: "Prompt Governance Approval",
        status: "Pending",
        sla: "24h",
        time: "Just now"
      };
      const testRun: TableRow = {
        id: `TST-${Date.now().toString().slice(-6)}`,
        name: `Regression for ${prompt.name ?? prompt.id}`,
        description: "Prompt regression pack queued after prompt change.",
        type: "Regression",
        environment: String(prompt.environment ?? "Production"),
        status: "Queued",
        progress: 12,
        baseline: String(prompt.version ?? "v1.0.0"),
        time: "Just now"
      };

      const database = mutateDatabase((current) => {
        const key = body.key ?? "prompts";
        const rows = current.records[key] ?? [];
        const before = rows.find((row) => row.id === prompt.id);
        const next: OswellDatabase = {
          ...current,
          records: {
            ...current.records,
            [key]: rows.map((row) => (row.id === prompt.id ? updatedPrompt : row)),
            approvals: [approval, ...(current.records.approvals ?? [])],
            testSuites: [testRun, ...(current.records.testSuites ?? [])]
          }
        };
        return addAuditTrail(addAuditTrail(addAuditTrail(next, key, updatedPrompt, "Prompt Changed", before), "approvals", approval, "Approval Created"), "testSuites", testRun, "Regression Queued");
      });
      return Response.json({ database, row: updatedPrompt });
    }

    if (action === "run-agent") {
      const current = readDatabase();
      const sourceRow = body.key ? findRecord(current, body.key, body.row) : body.row;
      if (
        body.key === "agents" &&
        (
          String(sourceRow?.name ?? "").trim() !== "Invoice Validation Agent" ||
          !String(sourceRow?.connectorId ?? "").trim()
        )
      ) {
        throw new Error(`${sourceRow?.name ?? "This agent"} is visible in the registry but not connected to the live OpenAI runtime yet.`);
      }
      const connector = resolveConnector(current, sourceRow);
      const run = await executeLiveRun({ connector, row: sourceRow });
      const database = mutateDatabase((latest) => {
        let next: OswellDatabase = {
          ...latest,
          records: {
            ...latest.records,
            runs: [run, ...(latest.records.runs ?? [])]
          }
        };
        next = addAuditTrail(next, "runs", run, "Run Completed");
        return next;
      });
      return Response.json({ database, row: run });
    }

    if (action === "test-connection" && body.row && body.key) {
      const current = readDatabase();
      const storedRow = findRecord(current, body.key, body.row);
      const result = await testLiveConnector(storedRow);
      const database = mutateDatabase((latest) => {
        const key = body.key ?? "connectors";
        const rows = latest.records[key] ?? [];
        const before = rows.find((row) => row.id === body.row?.id);
        const baseRow = before ?? storedRow ?? body.row;
        if (!baseRow) {
          throw new Error("Connector record could not be resolved for the test request.");
        }
        const updated: TableRow = {
          ...baseRow,
          id: baseRow.id,
          status: result.status,
          health: result.health,
          latency: result.latency,
          authentication: result.authentication,
          permissions: result.permissions,
          lastTested: new Date().toLocaleString(),
          lastUpdated: new Date().toLocaleString(),
          progress: result.status === "Active" ? 98 : 25,
          risk: result.status === "Active" ? "Low" : "High",
          time: "Just now"
        };
        const next: OswellDatabase = {
          ...latest,
          records: {
            ...latest.records,
            [key]: rows.map((row) => (row.id === updated.id ? updated : row))
          }
        };
        return addAuditTrail(next, key, updated, "Connection Tested", before);
      });
      return Response.json({ database, result });
    }

    if (action === "run-test" && body.row && body.key) {
      const currentRow = body.row;
      const result = generateTestResult(currentRow);
      const database = mutateDatabase((current) => {
        const key = body.key ?? "testSuites";
        const rows = current.records[key] ?? [];
        const before = rows.find((row) => row.id === currentRow.id);
        const updated: TableRow = { ...currentRow, status: result.status, progress: result.progress, time: "Just now" };
        const next: OswellDatabase = {
          ...current,
          records: {
            ...current.records,
            [key]: rows.map((row) => (row.id === updated.id ? updated : row)),
            testRuns: [result, ...(current.records.testRuns ?? [])]
          }
        };
        return addAuditTrail(addAuditTrail(next, key, updated, "Test Suite Run", before), "testRuns", result, "Test Suite Completed");
      });
      return Response.json({ database, row: result });
    }

    if (action === "sync-row" && body.row && body.key) {
      const currentRow = body.row;
      const database = mutateDatabase((current) => {
        const key = body.key ?? "connectors";
        const rows = current.records[key] ?? [];
        const before = rows.find((row) => row.id === currentRow.id);
        const updated: TableRow = { ...currentRow, status: "Active", progress: 100, lastUpdated: new Date().toLocaleString(), time: "Just now" };
        const next: OswellDatabase = { ...current, records: { ...current.records, [key]: rows.map((row) => (row.id === updated.id ? updated : row)) } };
        return addAuditTrail(next, key, updated, "Sync Completed", before);
      });
      return Response.json({ database });
    }

    return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected backend action failure." },
      { status: 500 }
    );
  }
}

function incrementVersion(version: string) {
  const clean = version.replace(/^v/i, "");
  const parts = clean.split(".").map((part) => Number(part));
  const [major = 1, minor = 0] = parts;
  const patch = Number.isFinite(parts[2]) ? parts[2] + 1 : 1;
  return `v${major}.${minor}.${patch}`;
}
