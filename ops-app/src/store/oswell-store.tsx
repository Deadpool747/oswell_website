"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DashboardConfig, TableRow } from "@/types/dashboard";
import { createActivityEvent, createAuditEvent, type ActivityEvent, type AuditEvent } from "@/services/auditService";
import { apiFetch } from "@/lib/api/client";

const liveOpenAIAgentNames = new Set(["Invoice Validation Agent"]);

const titleToKey: Record<string, string> = {
  "Live Runs": "runs",
  "Agent Registry": "agents",
  "Connector & MCP Governance": "connectors",
  "Policy Center": "policies",
  "Approvals & Audit": "approvals",
  "Configuration Center": "configurations",
  "Prompt Manager": "prompts",
  "RAG & Knowledge Governance": "knowledgeSources",
  "Secrets & Credentials": "secrets",
  "Memory & State Management": "memoryStores",
  "Testing & Regression Suite": "testSuites",
  "Feedback & Quality Loop": "feedback",
  Alerts: "alerts",
  Exports: "exports",
  "Deployment & Environment": "deployments",
  Evaluations: "evaluations",
  "AI Security Center": "securityEvents",
  "Agent Identity & Access": "identities",
  "MCP & Tool Security": "mcpServers",
  "Context Security": "contextThreats",
  "Memory Security": "memoryThreats",
  "Threats & Incidents": "incidents",
  "Permission Review": "permissions",
  "Token Lease Review": "tokens",
  "Tool Security Inventory": "tools"
};

type DemoState = {
  records: Record<string, TableRow[]>;
  activities: ActivityEvent[];
  auditEvents: AuditEvent[];
  settings: {
    seededAt: string;
    version: number;
    storage?: string;
  };
};

type ActionResponse = {
  database: DemoState;
  row?: TableRow;
  result?: {
    status?: string;
    health?: string;
    latency?: string;
    authentication?: string;
    message?: string;
  };
  imported?: number;
};

type StoreContextValue = DemoState & {
  loading: boolean;
  error: string | null;
  getRows: (config: DashboardConfig) => TableRow[];
  getKey: (config: DashboardConfig) => string;
  refresh: () => Promise<void>;
  createRow: (key: string, row: TableRow, action?: string) => Promise<TableRow>;
  updateRow: (key: string, id: string, patch: Partial<TableRow>, action?: string) => Promise<void>;
  deleteRow: (key: string, id: string) => Promise<void>;
  cloneRow: (key: string, row: TableRow) => Promise<TableRow>;
  executeAction: (action: string, options?: { row?: TableRow; key?: string }) => Promise<ActionResponse>;
  addAudit: (event: AuditEvent) => void;
  addActivity: (event: ActivityEvent) => void;
  resetDemo: () => Promise<void>;
};

function emptyState(): DemoState {
  return {
    records: {},
    activities: [],
    auditEvents: [],
    settings: {
      seededAt: "",
      version: 3,
      storage: "sqlite"
    }
  };
}

function applyLocalProductionMetadata(records: Record<string, TableRow[]>) {
  const connectors = (records.connectors ?? []).map((row) => {
    const name = String(row.name ?? "").toLowerCase();
    if (row.id === "conn-azure-openai" || name.includes("azure")) {
      return {
        ...row,
        provider: "",
        status: "Not Connected",
        health: "Not Configured",
        authentication: "OpenAI Only",
        permissions: "Unavailable",
        progress: 0,
        time: "Display only"
      };
    }

    if (row.id === "conn-openai-platform" || (name.includes("openai") && !name.includes("azure"))) {
      return {
        ...row,
        provider: "openai",
        source: "OpenAI",
        status: "Active",
        health: "Ready",
        authentication: "Configured",
        permissions: "Unknown",
        progress: 96,
        risk: "Low",
        time: "Ready"
      };
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

  const agents = (records.agents ?? []).map((row) => {
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

  return {
    ...records,
    agents,
    connectors
  };
}

function getConfigKey(config: DashboardConfig) {
  return titleToKey[config.title] ?? config.title.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ensureUniqueRowId(rows: TableRow[], row: TableRow) {
  const requestedId = String(row.id ?? "").trim() || `ROW-${Date.now()}`;
  if (!rows.some((current) => current.id === requestedId)) {
    return { ...row, id: requestedId };
  }

  let suffix = 1;
  let nextId = `${requestedId}-${suffix}`;
  while (rows.some((current) => current.id === nextId)) {
    suffix += 1;
    nextId = `${requestedId}-${suffix}`;
  }
  return { ...row, id: nextId };
}

function normalizeRecords(records: DemoState["records"]) {
  return Object.fromEntries(
    Object.entries(records).map(([key, rows]) => {
      const normalized = (rows ?? []).reduce<TableRow[]>((items, row) => {
        items.push(ensureUniqueRowId(items, row));
        return items;
      }, []);
      return [key, normalized];
    })
  );
}

function normalizeState(input?: Partial<DemoState>): DemoState {
  const empty = emptyState();
  return {
    ...empty,
    ...input,
    records: normalizeRecords(input?.records ?? {}),
    activities: input?.activities ?? empty.activities,
    auditEvents: input?.auditEvents ?? empty.auditEvents,
    settings: input?.settings ? { ...empty.settings, ...input.settings } : empty.settings
  };
}

async function requestJson<T>(input: string, init?: RequestInit) {
  return apiFetch<T>(input, init);
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function OswellStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => emptyState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyDatabase = useCallback((database: Partial<DemoState>) => {
    setState(normalizeState(database));
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const database = await requestJson<DemoState>("/api/database");
      applyDatabase(database);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load Oswell backend data.");
    } finally {
      setLoading(false);
    }
  }, [applyDatabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addAudit = useCallback((event: AuditEvent) => {
    setState((current) => ({ ...current, auditEvents: [event, ...current.auditEvents].slice(0, 300) }));
  }, []);

  const addActivity = useCallback((event: ActivityEvent) => {
    setState((current) => ({ ...current, activities: [event, ...current.activities].slice(0, 300) }));
  }, []);

  const createRow = useCallback(async (key: string, row: TableRow, action = "Created") => {
    const response = await requestJson<ActionResponse>(`/api/dashboard/${encodeURIComponent(key)}`, {
      method: "POST",
      body: JSON.stringify({ row, action })
    });
    applyDatabase(response.database);
    return response.row ?? row;
  }, [applyDatabase]);

  const updateRow = useCallback(async (key: string, id: string, patch: Partial<TableRow>, action = "Updated") => {
    const response = await requestJson<ActionResponse>(`/api/dashboard/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: JSON.stringify({ id, patch, action })
    });
    applyDatabase(response.database);
  }, [applyDatabase]);

  const deleteRow = useCallback(async (key: string, id: string) => {
    const response = await requestJson<ActionResponse>(`/api/dashboard/${encodeURIComponent(key)}?id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    applyDatabase(response.database);
  }, [applyDatabase]);

  const cloneRow = useCallback(async (key: string, row: TableRow) => {
    const clone: TableRow = {
      ...row,
      id: `${row.id}-copy-${Date.now().toString().slice(-5)}`,
      name: `${row.name ?? row.id} Copy`,
      status: ["Active", "Enabled", "Allowed"].includes(String(row.status)) ? "Draft" : row.status,
      time: "Just now",
      lastUpdated: new Date().toLocaleString()
    };
    return createRow(key, clone, "Cloned");
  }, [createRow]);

  const executeAction = useCallback(async (action: string, options?: { row?: TableRow; key?: string }) => {
    const response = await requestJson<ActionResponse>("/api/actions", {
      method: "POST",
      body: JSON.stringify({ action, ...options })
    });
    applyDatabase(response.database);
    return response;
  }, [applyDatabase]);

  const resetDemo = useCallback(async () => {
    await executeAction("reset");
  }, [executeAction]);

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      loading,
      error,
      getRows: (config) => state.records[getConfigKey(config)] ?? [],
      getKey: getConfigKey,
      refresh,
      createRow,
      updateRow,
      deleteRow,
      cloneRow,
      executeAction,
      addAudit,
      addActivity,
      resetDemo
    }),
    [addActivity, addAudit, cloneRow, createRow, deleteRow, error, executeAction, loading, refresh, resetDemo, state, updateRow]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useOswellStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useOswellStore must be used inside OswellStoreProvider");
  return store;
}
