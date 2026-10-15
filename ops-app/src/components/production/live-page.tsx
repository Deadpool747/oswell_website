"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UnifiedAgentRegistry } from "@/components/agents/unified-agent-registry";
import { PageHeader } from "@/components/dashboard/page-header";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api/client";
import { PlatformActions, PlatformRecordActions } from "@/components/production/platform-actions";

type LivePageProps = { title: string; subtitle: string; emptyState: string };
type PanelRecord = Record<string, unknown>;
type PanelResponse = {
  status: "LIVE" | "LIVE_EMPTY_STATE";
  provenance: string;
  title: string;
  description: string;
  records: PanelRecord[];
  record_count: number;
  action?: { label: string; href: string };
};
type DashboardResponse = {
  provenance: string;
  metrics: Array<{ label: string; value: number; provenance: string }>;
  chart_status: string;
};

const pageKeys: Record<string, string> = {
  "Alerts": "alerts", "Approvals & Audit": "approvals", "Configuration Center": "configurations", "Connector & MCP Governance": "connectors",
  "Quota, Cost & Capacity": "cost-capacity", "Deployment & Environment": "deployment", "Evaluations": "evaluations", "Exports": "exports",
  "Feedback & Quality Loop": "feedback", "Guardrails": "guardrails", "RAG & Knowledge Governance": "knowledge", "Live Runs": "live-runs",
  "Memory & State Management": "memory", "Metrics": "metrics", "Policy Center": "policies", "Prompt Manager": "prompts", "Replay Studio": "replay",
  "Secrets & Credentials": "secrets", "Context Security": "context", "Agent Identity & Access": "identity-access", "Threats & Incidents": "incidents",
  "MCP & Tool Security": "mcp", "Memory Security": "memory-security", "Testing & Regression Suite": "testing", "Agent Registry": "agent-detail", "Invoice Validation": "invoice-validation",
};

const liveEndpoints: Record<string, string> = {
  configurations: "/api/configurations?limit=50&offset=0",
  connectors: "/api/connectors?limit=50&offset=0",
  deployment: "/api/platform/deployment?limit=50&offset=0",
  exports: "/api/exports?limit=50&offset=0",
  feedback: "/api/feedback?limit=50&offset=0",
  guardrails: "/api/guardrails?limit=50&offset=0",
  knowledge: "/api/knowledge?limit=50&offset=0",
  memory: "/api/memory?limit=50&offset=0",
  prompts: "/api/prompts?limit=50&offset=0",
  secrets: "/api/platform/secrets?limit=50",
  context: "/api/security/context?limit=50&offset=0",
  "identity-access": "/api/security/identity-access",
  mcp: "/api/security/mcp?limit=50&offset=0",
  "memory-security": "/api/security/memory?limit=50&offset=0",
  "agent-detail": "/api/agent-governance/agents",
  "invoice-validation": "/api/platform/invoice-validation",
};

function labelFor(key: string) {
  return key.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("total_tokens" in record) return record.total_tokens === null || record.total_tokens === undefined ? "Not available" : `${String(record.total_tokens)} tokens`;
    return "Available";
  }
  if (typeof value === "string" && /_at$/.test(String(value))) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
  }
  return String(value);
}

function LivePageFrame({ title, subtitle, onRefresh, refreshing, children }: { title: string; subtitle: string; onRefresh?: () => void; refreshing?: boolean; children: React.ReactNode }) {
  return <AppShell><PageHeader title={title} subtitle={subtitle} actionLabel={refreshing ? "Refreshing..." : "Refresh"} searchPlaceholder="Live records are loaded from Oswell API" search="" onSearch={() => undefined} onAction={onRefresh ?? (() => undefined)} actionsDisabled={!onRefresh || refreshing} showSearch={false} showFilters={false} showExport={false} showAction={Boolean(onRefresh)} />{children}</AppShell>;
}

function EmptyState({ response, fallback }: { response: PanelResponse; fallback: string }) {
  return <section className="rounded-xl border border-[#162131] bg-[#09111C] p-6 shadow-lg shadow-black/20"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Live empty state</div><h2 className="mt-2 text-xl font-semibold text-white">{response.description || fallback}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">This production module is connected and has no records to show. No sample records are created.</p>{response.action && <Link href={response.action.href} className="mt-4 inline-flex rounded-md border border-[#28405C] bg-[#0C1827] px-3 py-2 text-xs font-semibold text-[#C9D6E5] hover:border-[#38BDF8] hover:text-white">{response.action.label}</Link>}</section>;
}

function RecordsTable({ records, pageKey, onComplete }: { records: PanelRecord[]; pageKey: string; onComplete: () => void }) {
  const fields = Object.keys(records[0] ?? {}).filter((field) => field !== "id" && field !== "provenance").slice(0, 8);
  const supportsActions = ["configurations", "connectors", "feedback", "mcp", "memory", "knowledge"].includes(pageKey);
  return <div className="overflow-x-auto rounded-xl border border-[#162131] bg-[#09111C]"><table className="min-w-full text-left text-xs"><thead className="border-b border-[#162131] bg-[#0C1827] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]"><tr>{fields.map((field) => <th key={field} className="whitespace-nowrap px-3 py-3">{labelFor(field)}</th>)}<th className="whitespace-nowrap px-3 py-3">Provenance</th>{supportsActions && <th className="whitespace-nowrap px-3 py-3">Actions</th>}</tr></thead><tbody>{records.map((record, index) => <tr key={String(record.id ?? index)} className="border-b border-[#111D2C] last:border-0">{fields.map((field) => <td key={field} className="max-w-[280px] break-words px-3 py-3 text-[#DCE5F2]">{formatValue(record[field])}</td>)}<td className="whitespace-nowrap px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6EE7B7]">{formatValue(record.provenance)}</td>{supportsActions && <td className="px-3 py-3"><PlatformRecordActions pageKey={pageKey} record={record} onComplete={onComplete} /></td>}</tr>)}</tbody></table></div>;
}

function RouteDataPanel({ pageKey, fallback, endpoint }: { pageKey: string; fallback: string; endpoint?: string }) {
  const [response, setResponse] = useState<PanelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  useEffect(() => {
    let active = true;
    setResponse(null);
    setError(null);
    void apiFetch<PanelResponse>(endpoint ?? liveEndpoints[pageKey] ?? `/api/control-panel/pages/${pageKey}?limit=50&offset=0`).then((result) => { if (active) setResponse(result); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Provider temporarily unavailable."); });
    return () => { active = false; };
  }, [endpoint, pageKey, refreshToken]);
  const refreshing = response === null && error === null;
  return <LivePageFrame title={response?.title ?? fallback} subtitle={response?.description ?? "Loading live data from the authenticated Oswell API."} onRefresh={() => setRefreshToken((value) => value + 1)} refreshing={refreshing}>
    {refreshing && <section className="rounded-xl border border-[#162131] bg-[#09111C] p-6 text-sm text-[#94A3B8]">Loading live data...</section>}
    {error && <section className="rounded-xl border border-[#4C1D2A] bg-[#1A0C13] p-6"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FCA5A5]">Provider temporarily unavailable</div><p className="mt-2 text-sm text-[#FDE2E7]">{error}</p></section>}
    {response && response.records.length === 0 && <EmptyState response={response} fallback={fallback} />}
    {response && response.records.length > 0 && <section><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6EE7B7]">{response.provenance}</div><div className="text-xs text-[#94A3B8]">{response.record_count} real records returned</div></div><RecordsTable records={response.records} pageKey={pageKey} onComplete={() => setRefreshToken((value) => value + 1)} /></section>}
    {response && <PlatformActions pageKey={pageKey} onComplete={() => setRefreshToken((value) => value + 1)} />}
  </LivePageFrame>;
}

export function TruthfulEmptyPage({ title, subtitle, emptyState }: LivePageProps) {
  return <RouteDataPanel pageKey={pageKeys[title] ?? "not-available"} fallback={emptyState || subtitle} />;
}

export function LiveApprovalsPage() {
  const [response, setResponse] = useState<PanelResponse | null>(null);
  const [platformAudit, setPlatformAudit] = useState<PanelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setResponse(null);
    setError(null);
    void Promise.all([
      apiFetch<PanelResponse>("/api/control-panel/approvals?limit=50&offset=0"),
      apiFetch<PanelResponse>("/api/platform/audit?limit=50&offset=0"),
    ]).then(([approvals, audit]) => { if (active) { setResponse(approvals); setPlatformAudit(audit); } }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Provider temporarily unavailable."); });
    return () => { active = false; };
  }, [refreshToken]);
  async function review(id: string, action: "mark_reviewed" | "resolve" | "reopen") {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/security/policy/investigations/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ action }) });
      setRefreshToken((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The review action could not be completed.");
    } finally {
      setBusyId(null);
    }
  }
  const refreshing = response === null && error === null;
  return <LivePageFrame title="Approvals & Audit" subtitle="Persisted human-review-required investigations and authorized review actions." onRefresh={() => setRefreshToken((value) => value + 1)} refreshing={refreshing}>
    {refreshing && <section className="rounded-xl border border-[#162131] bg-[#09111C] p-6 text-sm text-[#94A3B8]">Loading live approval requests...</section>}
    {error && <section className="rounded-xl border border-[#4C1D2A] bg-[#1A0C13] p-6 text-sm text-[#FDE2E7]">{error}</section>}
    {response && response.records.length === 0 && <EmptyState response={response} fallback="No approval requests are currently pending." />}
    {response && response.records.length > 0 && <section className="overflow-x-auto rounded-xl border border-[#162131] bg-[#09111C]"><table className="min-w-full text-left text-xs"><thead className="border-b border-[#162131] bg-[#0C1827] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]"><tr><th className="px-3 py-3">Request</th><th className="px-3 py-3">Resource</th><th className="px-3 py-3">Requested By</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{response.records.map((record) => { const id = String(record.id); const status = String(record.status ?? ""); const busy = busyId === id; return <tr key={id} className="border-b border-[#111D2C] last:border-0"><td className="px-3 py-3 text-white">{formatValue(record.request)}</td><td className="max-w-[260px] break-words px-3 py-3 text-[#DCE5F2]">{formatValue(record.resource)}</td><td className="px-3 py-3 text-[#DCE5F2]">{formatValue(record.requested_by)}</td><td className="px-3 py-3 text-[#DCE5F2]">{formatValue(record.created_at)}</td><td className="px-3 py-3 text-[#FCD34D]">{status}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2">{status === "RESOLVED_BY_HUMAN" ? <button disabled={busy} onClick={() => void review(id, "reopen")} className="rounded border border-[#28405C] px-2 py-1 text-[10px] text-[#BFDBFE] disabled:opacity-50">Reopen</button> : <><button disabled={busy} onClick={() => void review(id, "mark_reviewed")} className="rounded border border-[#28405C] px-2 py-1 text-[10px] text-[#BFDBFE] disabled:opacity-50">Mark Reviewed</button><button disabled={busy} onClick={() => void review(id, "resolve")} className="rounded border border-[#4C3A1D] px-2 py-1 text-[10px] text-[#FDE68A] disabled:opacity-50">Resolve</button></>}</div></td></tr>; })}</tbody></table></section>}
    {platformAudit && <section className="mt-5"><div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6EE7B7]">Platform audit · read only</div>{platformAudit.records.length > 0 ? <RecordsTable records={platformAudit.records} pageKey="audit" onComplete={() => setRefreshToken((value) => value + 1)} /> : <EmptyState response={platformAudit} fallback="No platform audit records are available." />}</section>}
  </LivePageFrame>;
}

export function LiveDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    void apiFetch<DashboardResponse>("/api/control-panel/dashboard").then((result) => { if (active) setData(result); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Provider temporarily unavailable."); });
    return () => { active = false; };
  }, [refreshToken]);
  return <LivePageFrame title="Production Dashboard" subtitle="Real production aggregates from persisted Oswell, Azure Policy, Entra, and Foundry data." onRefresh={() => setRefreshToken((value) => value + 1)} refreshing={!data && !error}>
    {!data && !error && <section className="rounded-xl border border-[#162131] bg-[#09111C] p-6 text-sm text-[#94A3B8]">Loading live production aggregates...</section>}
    {error && <section className="rounded-xl border border-[#4C1D2A] bg-[#1A0C13] p-6 text-sm text-[#FDE2E7]">Provider temporarily unavailable: {error}</section>}
    {data && <><div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6EE7B7]">{data.provenance}</div><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.metrics.map((metric) => <div key={metric.label} className="rounded-xl border border-[#162131] bg-[#09111C] p-4"><div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{metric.label}</div><div className="mt-2 text-3xl font-semibold text-white">{metric.value}</div><div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6EE7B7]">{metric.provenance}</div></div>)}</section><section className="mt-4 rounded-xl border border-[#162131] bg-[#09111C] p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Historical charts</div><p className="mt-2 text-sm text-[#94A3B8]">{data.chart_status}</p></section></>}
  </LivePageFrame>;
}

export function LiveAgentsPage() {
  return <LivePageFrame title="Agent Registry" subtitle="Real Microsoft Foundry agents and server-managed OpenAI Response agents."><UnifiedAgentRegistry /></LivePageFrame>;
}

export function LiveConnectionCenterPage() {
  return <RouteDataPanel pageKey="connections" fallback="Provider connections" endpoint="/api/control-panel/connections" />;
}
