"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalAuthSession } from "@/components/providers/entra-auth-provider";
import { apiDownload, apiFetch } from "@/lib/api/client";

type Props = { pageKey: string; onComplete: () => void };

type RecordActionProps = Props & { record: Record<string, unknown> };

export function PlatformRecordActions({ pageKey, record, onComplete }: RecordActionProps) {
  const session = useLocalAuthSession();
  const canManage = session?.role === "Oswell.PlatformAdministrator";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Array<Record<string, unknown>> | null>(null);

  if (!["configurations", "connectors", "feedback", "mcp", "memory", "knowledge"].includes(pageKey)) return null;

  const request = async (path: string, options: RequestInit) => {
    setBusy(true); setError(null);
    try { await apiFetch(path, options); onComplete(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The production action could not be completed."); }
    finally { setBusy(false); }
  };
  const configurationId = String(record.id ?? "");
  const actions: ReactNode[] = [];
  if (pageKey === "configurations") {
    actions.push(<Button key="history" size="sm" variant="ghost" disabled={!configurationId || busy} onClick={() => { setBusy(true); setError(null); void apiFetch<{ records: Array<Record<string, unknown>> }>(`/api/configurations/${encodeURIComponent(configurationId)}/versions?limit=20`).then((result) => setVersions(result.records)).catch((reason) => setError(reason instanceof Error ? reason.message : "Version history could not be loaded.")).finally(() => setBusy(false)); }}>Versions</Button>);
    if (versions?.length) actions.push(<Button key="restore" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void request(`/api/configurations/${encodeURIComponent(configurationId)}/restore`, { method: "POST", body: JSON.stringify({ version: Number(versions[0].version), reason: "Restored from Configuration Center" }) })}>Restore latest</Button>);
  }
  if (pageKey === "connectors") actions.push(<Button key="test" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void request(`/api/connectors/${encodeURIComponent(String(record.connector_id))}/test`, { method: "POST" })}>Test</Button>);
  if (pageKey === "feedback") actions.push(<Button key="review" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void request(`/api/feedback/${encodeURIComponent(String(record.feedback_id))}`, { method: "PATCH", body: JSON.stringify({ status: record.status === "REVIEWED" ? "RESOLVED" : "REVIEWED" }) })}>{record.status === "REVIEWED" ? "Resolve" : "Review"}</Button>);
  if (pageKey === "mcp") actions.push(<Button key="mcp" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void request(`/api/mcp/${encodeURIComponent(String(record.server_id))}`, { method: "PATCH", body: JSON.stringify({ enabled: !Boolean(record.enabled) }) })}>{record.enabled ? "Disable" : "Enable"}</Button>);
  if (pageKey === "memory") actions.push(<Button key="memory" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void request(`/api/memory/${encodeURIComponent(String(record.memory_id))}`, { method: "PATCH", body: JSON.stringify({ action: record.status === "REVOKED" ? "approve" : "revoke" }) })}>{record.status === "REVOKED" ? "Approve" : "Revoke"}</Button>);
  if (pageKey === "knowledge") actions.push(<Button key="knowledge" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void request(`/api/knowledge/${encodeURIComponent(String(record.knowledge_source_id))}`, { method: "PATCH", body: JSON.stringify({ status: record.status === "DISABLED" ? "APPROVED" : "DISABLED" }) })}>{record.status === "DISABLED" ? "Approve" : "Disable"}</Button>);

  return <div className="min-w-[160px] space-y-2"><div className="flex flex-wrap gap-1">{actions}</div>{versions && <p className="text-[10px] text-[#94A3B8]">{versions.map((item) => `v${String(item.version)}`).join(", ")}</p>}{!canManage && pageKey !== "configurations" && <p className="text-[10px] text-[#FDE68A]">Platform Administrator required</p>}{error && <p className="text-[10px] text-[#FCA5A5]">{error}</p>}</div>;
}

export function PlatformActions({ pageKey, onComplete }: Props) {
  const session = useLocalAuthSession();
  const canManage = session?.role === "Oswell.PlatformAdministrator";
  const canExport = canManage || session?.role === "Oswell.SecurityAdministrator";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [third, setThird] = useState("");

  const labels: Record<string, string> = { configurations: "Save Configuration", feedback: "Submit Feedback", mcp: "Register MCP Server", memory: "Add Approved Memory", knowledge: "Register Knowledge Source" };
  const needsAdmin = ["configurations", "mcp", "memory", "knowledge"].includes(pageKey);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      if (pageKey === "configurations") {
        let value: unknown = third;
        try { value = JSON.parse(third); } catch { /* Plain strings are valid configuration values. */ }
        await apiFetch("/api/configurations", { method: "POST", body: JSON.stringify({ namespace: first, key: second, value, is_sensitive: false, reason: "Created or updated from Configuration Center" }) });
      } else if (pageKey === "feedback") {
        await apiFetch("/api/feedback", { method: "POST", body: JSON.stringify({ target_type: "PLATFORM_UX", target_id: first, category: "Needs Review", comment: second }) });
      } else if (pageKey === "mcp") {
        await apiFetch("/api/mcp", { method: "POST", body: JSON.stringify({ name: first, endpoint_reference: second, auth_type: "KEY_VAULT_REFERENCE", allowed_tools: third ? third.split(",").map((item) => item.trim()).filter(Boolean) : [], risk_level: "MEDIUM", enabled: false }) });
      } else if (pageKey === "memory") {
        await apiFetch("/api/memory", { method: "POST", body: JSON.stringify({ agent: first, type: "OPERATOR_APPROVED", content_reference: second, sensitivity: "MEDIUM", approved: true }) });
      } else if (pageKey === "knowledge") {
        await apiFetch("/api/knowledge", { method: "POST", body: JSON.stringify({ name: first, type: "REFERENCE_DOCUMENT", reference: second }) });
      }
      setOpen(false); setFirst(""); setSecond(""); setThird(""); onComplete();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The production action could not be completed."); }
    finally { setBusy(false); }
  };
  if (pageKey === "exports") return <div className="flex flex-wrap gap-2">{["security-findings", "mcsb-compliance", "governance-audit", "agent-test-history", "human-review"].map((type) => <Button key={type} size="sm" variant="secondary" disabled={!canExport || busy} onClick={() => { setBusy(true); void apiDownload(`/api/exports/${type}`, `oswell-${type}.csv`).then(onComplete).catch((reason) => setError(reason instanceof Error ? reason.message : "Export failed.")).finally(() => setBusy(false)); }}>{type.replaceAll("-", " ")}</Button>)}{error && <p className="basis-full text-xs text-[#FCA5A5]">{error}</p>}</div>;
  if (!labels[pageKey]) return null;
  return <div className="mt-4 rounded-xl border border-[#1B2940] bg-[#07101B] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">Authorized Production Action</div><p className="mt-1 text-xs text-[#94A3B8]">{labels[pageKey]} creates a persisted Oswell record and audit event.</p></div><Button size="sm" disabled={(needsAdmin && !canManage) || busy} onClick={() => setOpen((value) => !value)}>{labels[pageKey]}</Button></div>{needsAdmin && !canManage && <p className="mt-3 text-xs text-[#FDE68A]">PLATFORM_ADMINISTRATOR_ROLE_REQUIRED. Your current role has read-only access to this registry.</p>}{open && <div className="mt-4 grid gap-3 md:grid-cols-3"><Input value={first} onChange={(event) => setFirst(event.target.value)} placeholder={pageKey === "configurations" ? "Namespace" : pageKey === "feedback" ? "Target ID" : pageKey === "mcp" ? "Server name" : pageKey === "memory" ? "Agent name" : "Source name"} /><Input value={second} onChange={(event) => setSecond(event.target.value)} placeholder={pageKey === "configurations" ? "Configuration key" : pageKey === "feedback" ? "Feedback comment" : pageKey === "mcp" ? "Endpoint reference, not secret" : pageKey === "memory" ? "Content reference, not payload" : "Document or URL reference"} />{["configurations", "mcp"].includes(pageKey) && <Input value={third} onChange={(event) => setThird(event.target.value)} placeholder={pageKey === "configurations" ? "JSON or plain value" : "Allowed tools, comma-separated"} />}<div className="flex gap-2"><Button size="sm" disabled={!first.trim() || !second.trim() || busy} onClick={() => void submit()}>Save</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button></div>{error && <p className="text-xs text-[#FCA5A5]">{error}</p>}</div>}</div>;
}
