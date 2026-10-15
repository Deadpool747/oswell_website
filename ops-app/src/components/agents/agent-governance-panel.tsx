"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalAuthSession } from "@/components/providers/entra-auth-provider";
import { apiFetch } from "@/lib/api/client";

type GovernanceStatus = {
  connected: boolean;
  identity: string;
  permission: string;
  agent_count: number;
  latency_ms: number;
};

type GovernanceOverview = {
  total_agents: number;
  versions: number | "Not available";
  tests_executed: number;
  prompt_changes: number;
  pending_governance_actions: number | "Not available";
};

type Agent = {
  name: string;
  description: string | null;
  latest_version: string | null;
  model: string | null;
  state: string | null;
  protected: boolean;
};

type Model = { id: string; source: string };

type AgentVersion = {
  version: string;
  description: string | null;
  created_at: string | null;
  definition: { model?: string; instructions?: string; tools?: Array<{ type?: string }> };
  status: string | null;
};

type TestResult = {
  output_text: string;
  response_id: string | null;
  conversation_id: string | null;
  latency_ms: number;
  usage: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null;
};

type AuditEvent = {
  id: string;
  action: string;
  actor: string | null;
  agent_name: string;
  previous_version: string | null;
  new_version: string | null;
  created_at: string;
};

type ManagedAgent = { id: string; external_agent_name: string; provider: string };
type PromptCapabilities = {
  view: boolean;
  edit: boolean;
  draft: boolean;
  publish: boolean;
  rollback: boolean;
  provider_requires_new_version: boolean;
  reason: string | null;
};
type PromptRevision = {
  id: string;
  revision_number: number;
  provider_version_id: string | null;
  status: "draft" | "published" | "superseded" | "failed";
  prompt_name: string | null;
  prompt_text: string;
  prompt_hash: string;
  change_notes: string | null;
  etag: string;
  created_by: string | null;
  created_at: string;
  published_by: string | null;
  published_at: string | null;
};

function formatTimestamp(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function promptLines(value: string | undefined) {
  return (value ?? "").split("\n");
}

function PromptDiff({ before, after }: { before?: string; after?: string }) {
  const beforeLines = promptLines(before);
  const afterLines = promptLines(after);
  const rows = [...new Set([...beforeLines, ...afterLines])];
  if (!before && !after) return <p className="text-xs text-[#94A3B8]">Not available.</p>;
  return <div className="max-h-52 space-y-1 overflow-auto rounded border border-[#1B2940] bg-[#07101B] p-3 font-mono text-[11px] leading-5">
    {rows.map((line) => {
      const removed = beforeLines.includes(line) && !afterLines.includes(line);
      const added = afterLines.includes(line) && !beforeLines.includes(line);
      return <p key={`${line}-${removed}-${added}`} className={added ? "text-[#6EE7B7]" : removed ? "text-[#FCA5A5]" : "text-[#CBD5E1]"}>{added ? "+ " : removed ? "- " : "  "}{line || " "}</p>;
    })}
  </div>;
}

export function AgentGovernancePanel() {
  const session = useLocalAuthSession();
  const canManage = session?.role === "Oswell.PlatformAdministrator";
  const [status, setStatus] = useState<GovernanceStatus | null>(null);
  const [overview, setOverview] = useState<GovernanceOverview | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [managedAgents, setManagedAgents] = useState<ManagedAgent[]>([]);
  const [promptCapabilities, setPromptCapabilities] = useState<PromptCapabilities | null>(null);
  const [promptRevisions, setPromptRevisions] = useState<PromptRevision[]>([]);
  const [instructions, setInstructions] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [testMessage, setTestMessage] = useState("Describe what you can help with in one short sentence.");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [compareVersion, setCompareVersion] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newChangeReason, setNewChangeReason] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [acknowledgeProtected, setAcknowledgeProtected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setError(null);
    try {
      const [nextStatus, nextOverview, nextAgents, nextModels, nextAudit, nextManaged] = await Promise.all([
        apiFetch<GovernanceStatus>("/api/agent-governance/status"),
        apiFetch<GovernanceOverview>("/api/agent-governance/overview"),
        apiFetch<Agent[]>("/api/agent-governance/agents"),
        apiFetch<{ items: Model[] }>("/api/agent-governance/models"),
        apiFetch<AuditEvent[]>("/api/agent-governance/audit?limit=20"),
        apiFetch<ManagedAgent[]>("/api/agents?provider=microsoft-foundry"),
      ]);
      setStatus(nextStatus);
      setOverview(nextOverview);
      setAgents(nextAgents);
      setModels(nextModels.items);
      setNewModel((current) => current || nextModels.items[0]?.id || "");
      setAudit(nextAudit);
      setManagedAgents(nextManaged);
      setSelected((current) => nextAgents.find((agent) => agent.name === current?.name) ?? nextAgents[0] ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load real Foundry governance data.");
    }
  }

  async function loadVersions(agent: Agent | null) {
    if (!agent) {
      setVersions([]);
      return;
    }
    try {
      const nextVersions = await apiFetch<AgentVersion[]>(`/api/agent-governance/agents/${encodeURIComponent(agent.name)}/versions`);
      setVersions(nextVersions);
      setInstructions(nextVersions[0]?.definition.instructions ?? "");
      setSelectedModel(nextVersions[0]?.definition.model ?? "");
      setCompareVersion(nextVersions[1]?.version ?? "");
      setConversationId(null);
      setResult(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load Foundry versions.");
    }
  }

  async function loadPrompt(agent: Agent | null) {
    const managed = managedAgents.find((item) => item.external_agent_name === agent?.name);
    if (!managed) {
      setPromptCapabilities(null);
      setPromptRevisions([]);
      return;
    }
    try {
      const capabilities = await apiFetch<PromptCapabilities>(`/api/agents/${managed.id}/prompt/capabilities`);
      setPromptCapabilities(capabilities);
      if (!capabilities.view) {
        setPromptRevisions([]);
        return;
      }
      const revisions = await apiFetch<PromptRevision[]>(`/api/agents/${managed.id}/prompt/revisions`);
      setPromptRevisions(revisions);
      const active = revisions.find((revision) => revision.status === "published");
      const draft = revisions.find((revision) => revision.status === "draft");
      setInstructions((draft ?? active)?.prompt_text ?? "");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load prompt history.");
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => { void loadVersions(selected); }, [selected?.name]);
  useEffect(() => { void loadPrompt(selected); }, [selected?.name, managedAgents]);

  async function testAgent() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch<TestResult>(`/api/agent-governance/agents/${encodeURIComponent(selected.name)}/test`, {
        method: "POST",
        body: JSON.stringify({ message: testMessage, version: versions[0]?.version, conversation_id: conversationId }),
      });
      setResult(response);
      setConversationId(response.conversation_id ?? conversationId);
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Foundry test failed.");
    } finally {
      setBusy(false);
    }
  }

  async function newConversation() {
    if (!selected) return;
    setBusy(true);
    try {
      const value = await apiFetch<{ conversation_id: string }>(`/api/agent-governance/agents/${encodeURIComponent(selected.name)}/conversations`, {
        method: "POST",
        body: JSON.stringify({ version: versions[0]?.version }),
      });
      setConversationId(value.conversation_id);
      setResult(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to start a Foundry conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    const managed = managedAgents.find((item) => item.external_agent_name === selected?.name);
    const active = promptRevisions.find((revision) => revision.status === "published");
    const draft = promptRevisions.find((revision) => revision.status === "draft");
    if (!managed || !active || !canManage || !changeReason.trim() || !instructions.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/api/agents/${managed.id}/prompt/draft`, {
        method: "PUT",
        body: JSON.stringify({
          prompt_name: `${selected?.name} Instructions`,
          instructions,
          description: selected?.description,
          change_notes: changeReason,
          base_revision_number: active.revision_number,
          etag: draft?.etag,
        }),
      });
      await loadPrompt(selected);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Prompt draft could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function publishDraft() {
    const managed = managedAgents.find((item) => item.external_agent_name === selected?.name);
    const active = promptRevisions.find((revision) => revision.status === "published");
    const draft = promptRevisions.find((revision) => revision.status === "draft");
    if (!managed || !active || !draft || !canManage) return;
    setBusy(true);
    try {
      await apiFetch(`/api/agents/${managed.id}/prompt/publish`, {
        method: "POST",
        body: JSON.stringify({ revision_id: draft.id, base_revision_number: active.revision_number }),
      });
      setChangeReason("");
      await refresh();
      await loadPrompt(selected);
      await loadVersions(selected);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Prompt was not published. The current production prompt remains active.");
    } finally {
      setBusy(false);
    }
  }

  async function rollbackPrompt(revision: PromptRevision) {
    const managed = managedAgents.find((item) => item.external_agent_name === selected?.name);
    const active = promptRevisions.find((item) => item.status === "published");
    if (!managed || !active || !canManage || !changeReason.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/api/agents/${managed.id}/prompt/rollback/${revision.id}`, {
        method: "POST",
        body: JSON.stringify({ base_revision_number: active.revision_number, change_notes: changeReason }),
      });
      setChangeReason("");
      await refresh();
      await loadPrompt(selected);
      await loadVersions(selected);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Prompt rollback failed. The current production prompt remains active.");
    } finally {
      setBusy(false);
    }
  }

  async function createAgent() {
    if (!canManage || !newName.trim() || !newModel || !newInstructions.trim() || !newChangeReason.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/api/agent-governance/agents", {
        method: "POST",
        body: JSON.stringify({ name: newName, model: newModel, instructions: newInstructions, description: newDescription || null, change_reason: newChangeReason }),
      });
      setCreating(false);
      setNewName("");
      setNewDescription("");
      setNewInstructions("");
      setNewChangeReason("");
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Foundry agent creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAgent() {
    if (!selected || !canManage || deleteConfirmation !== selected.name) return;
    setBusy(true);
    try {
      await apiFetch(`/api/agent-governance/agents/${encodeURIComponent(selected.name)}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation: deleteConfirmation, acknowledge_protected: acknowledgeProtected }),
      });
      setDeleteConfirmation("");
      setAcknowledgeProtected(false);
      setSelected(null);
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Foundry agent deletion failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteVersion() {
    if (!selected || !canManage || !compareVersion || deleteConfirmation !== selected.name) return;
    setBusy(true);
    try {
      await apiFetch(`/api/agent-governance/agents/${encodeURIComponent(selected.name)}/versions/${encodeURIComponent(compareVersion)}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation: deleteConfirmation, acknowledge_protected: acknowledgeProtected, version: compareVersion }),
      });
      setDeleteConfirmation("");
      await loadVersions(selected);
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Foundry version deletion failed.");
    } finally {
      setBusy(false);
    }
  }

  const latest = versions[0];
  const comparison = versions.find((version) => version.version === compareVersion);

  return <section className="space-y-4">
    <div className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Live · Microsoft Foundry</div>
          <h2 className="mt-1 text-[15px] font-semibold text-white">Agent Governance</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">Real Foundry agents, versions, conversations, and controlled governance actions.</p>
        </div>
        <div className="flex gap-2"><Button size="sm" onClick={() => setCreating((value) => !value)} disabled={!canManage || busy}>New Agent</Button><Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={busy}>Refresh from Foundry</Button></div>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
        <div><div className="text-[#64748B]">Governance connection</div><div className="mt-1 text-white">{status?.connected ? "Connected" : status ? "Unavailable" : "Checking..."}</div></div>
        <div><div className="text-[#64748B]">Identity</div><div className="mt-1 text-white">{status?.identity ?? "Not available"}</div></div>
        <div><div className="text-[#64748B]">Permission</div><div className="mt-1 text-white">{status?.permission ?? "Not available"}</div></div>
        <div><div className="text-[#64748B]">Foundry latency</div><div className="mt-1 text-white">{status ? `${status.latency_ms} ms` : "Not available"}</div></div>
      </div>
      {!canManage && <p className="mt-4 rounded border border-[#5B3D1A] bg-[#22170B] p-3 text-xs text-[#FDE68A]">PLATFORM_ADMINISTRATOR_ROLE_REQUIRED for agent creation, prompt/version changes, and deletion. Your current security-administrator access remains read/test only.</p>}
      {error && <p className="mt-3 text-xs text-[#FCA5A5]">{error}</p>}
      {creating && <div className="mt-4 grid gap-3 rounded border border-[#1B2940] bg-[#07101B] p-4 lg:grid-cols-2"><div><label className="text-xs text-white">Agent Name</label><Input aria-label="New agent name" value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-1" /><label className="mt-3 block text-xs text-white">Description</label><Input aria-label="New agent description" value={newDescription} onChange={(event) => setNewDescription(event.target.value)} className="mt-1" /><label className="mt-3 block text-xs text-white">Verified Model</label><select aria-label="New agent model" value={newModel} onChange={(event) => setNewModel(event.target.value)} className="mt-1 w-full rounded border border-[#1B2940] bg-[#09111C] px-3 py-2 text-xs text-white"><option value="">Choose a live model</option>{models.map((model) => <option key={model.id} value={model.id}>{model.id}</option>)}</select></div><div><label className="text-xs text-white">Instructions / System Prompt</label><textarea aria-label="New agent instructions" value={newInstructions} onChange={(event) => setNewInstructions(event.target.value)} className="mt-1 min-h-24 w-full rounded border border-[#1B2940] bg-[#09111C] p-3 text-xs text-white" /><label className="mt-3 block text-xs text-white">Change Reason</label><Input aria-label="New agent change reason" value={newChangeReason} onChange={(event) => setNewChangeReason(event.target.value)} className="mt-1" placeholder="Required governance reason" /><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void createAgent()} disabled={!newName || !newModel || !newInstructions || !newChangeReason || busy}>Create in Foundry</Button><Button size="sm" variant="ghost" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button></div></div></div>}
    </div>

    <div className="grid gap-3 sm:grid-cols-5">
      {[
        ["Total Foundry Agents", overview?.total_agents],
        ["Versions", overview?.versions],
        ["Tests Executed", overview?.tests_executed],
        ["Prompt Changes", overview?.prompt_changes],
        ["Pending Governance Actions", overview?.pending_governance_actions],
      ].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-[#162131] bg-[#09111C] p-3"><div className="text-[10px] uppercase tracking-wide text-[#64748B]">{label}</div><div className="mt-2 text-lg font-semibold text-white">{value ?? "Not available"}</div><div className="mt-1 text-[10px] text-[#64748B]">OSWELL CALCULATED</div></div>)}
    </div>

    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.6fr]">
      <div className="rounded-lg border border-[#162131] bg-[#09111C]">
        <div className="border-b border-[#162131] px-4 py-3 text-xs font-medium text-white">Agents</div>
        {agents.length ? agents.map((agent) => <button key={agent.name} onClick={() => setSelected(agent)} className={`block w-full border-b border-[#162131] px-4 py-3 text-left text-xs ${selected?.name === agent.name ? "bg-[#102036]" : "hover:bg-[#0D1827]"}`}><div className="flex items-center justify-between gap-2"><strong className="text-white">{agent.name}</strong>{agent.protected && <span className="rounded border border-[#7F1D1D] px-1.5 py-0.5 text-[9px] font-semibold text-[#FCA5A5]">PROTECTED</span>}</div><div className="mt-1 text-[#94A3B8]">{agent.latest_version ? `Version ${agent.latest_version}` : "Version not returned"} · {agent.model ?? "Model not returned"}</div></button>) : <p className="p-4 text-xs text-[#94A3B8]">No real Foundry agents are available.</p>}
      </div>

      <div className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Live · Microsoft Foundry</div><h3 className="mt-1 text-sm font-semibold text-white">{selected?.name ?? "Select an agent"}</h3><p className="mt-1 text-xs text-[#94A3B8]">{selected?.protected ? "Protected agent. Deletion requires an explicit protected confirmation." : selected?.description ?? "No Foundry description returned."}</p></div><Button size="sm" variant="ghost" onClick={() => { if (selected) void loadVersions(selected); }} disabled={!selected || busy}>Refresh Versions</Button></div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded border border-[#1B2940] p-3 text-xs"><div className="text-[#64748B]">Current Version</div><div className="mt-1 text-white">{latest?.version ?? "Not available"}</div><div className="mt-2 text-[#64748B]">Model</div><div className="mt-1 text-white">{latest?.definition.model ?? "Not available"}</div></div>
          <div className="rounded border border-[#1B2940] p-3 text-xs"><div className="text-[#64748B]">Foundry Status</div><div className="mt-1 text-white">{latest?.status ?? selected?.state ?? "Not available"}</div><div className="mt-2 text-[#64748B]">Created</div><div className="mt-1 text-white">{formatTimestamp(latest?.created_at ?? null)}</div></div>
        </div>

        <div className="mt-4 rounded border border-[#1B2940] bg-[#07101B] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Prompt management</div><h4 className="mt-1 text-xs font-semibold text-white">System / Agent Instructions</h4></div>
            <span className="rounded border border-[#28405C] px-2 py-1 text-[10px] text-[#BFDBFE]">{promptRevisions.find((revision) => revision.status === "published") ? `Published v${promptRevisions.find((revision) => revision.status === "published")?.revision_number}` : "Prompt unavailable"}</span>
          </div>
          {promptCapabilities?.reason && <p className="mt-3 text-xs text-[#FDE68A]">{promptCapabilities.reason}</p>}
          {promptCapabilities?.view && <>
            <label className="mt-4 block text-xs font-medium text-white">Instructions</label>
            <textarea aria-label="Current Prompt" value={instructions} onChange={(event) => setInstructions(event.target.value)} disabled={!canManage || busy} className="mt-2 min-h-44 w-full rounded border border-[#1B2940] bg-[#09111C] p-3 text-xs leading-5 text-[#E2E8F0] outline-none focus:border-[#38BDF8] disabled:opacity-70" />
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#64748B]"><span>{instructions.length.toLocaleString()} characters</span><span>{promptRevisions.find((revision) => revision.status === "draft") ? "Draft saved" : "Published prompt"}</span></div>
            <label className="mt-3 block text-xs font-medium text-white">Revision Notes</label>
            <Input aria-label="Change Reason" value={changeReason} onChange={(event) => setChangeReason(event.target.value)} disabled={!canManage || busy} placeholder="Required for draft and publish audit" className="mt-2" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void saveDraft()} disabled={!canManage || !promptCapabilities.draft || !instructions.trim() || !changeReason.trim() || busy}>Save Draft</Button>
              <Button size="sm" variant="secondary" onClick={() => void publishDraft()} disabled={!canManage || !promptCapabilities.publish || !promptRevisions.some((revision) => revision.status === "draft") || busy}>Publish Changes</Button>
              <span className="self-center text-[10px] text-[#64748B]">Drafts never alter the production agent. Publish creates a verified new Foundry version.</span>
            </div>
            <div className="mt-5 border-t border-[#162131] pt-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Version History</div>{promptRevisions.length ? <div className="mt-3 divide-y divide-[#162131] rounded border border-[#162131] text-xs">{promptRevisions.map((revision) => <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><strong className="text-white">v{revision.revision_number}</strong><span className="ml-2 text-[#94A3B8]">{revision.status.toUpperCase()} · {formatTimestamp(revision.published_at ?? revision.created_at)}</span></div><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setInstructions(revision.prompt_text)}>View</Button><Button size="sm" variant="secondary" onClick={() => void rollbackPrompt(revision)} disabled={!canManage || !promptCapabilities.rollback || revision.status === "draft" || !changeReason.trim() || busy}>Restore</Button></div></div>)}</div> : <p className="mt-3 text-xs text-[#94A3B8]">No verified prompt history is available.</p>}</div>
          </>}
        </div>

        <div className="mt-5 border-t border-[#162131] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Provider Version Comparison</div><h4 className="mt-1 text-xs font-semibold text-white">Compare Foundry Definitions</h4></div><select aria-label="Compare Version" value={compareVersion} onChange={(event) => setCompareVersion(event.target.value)} className="rounded border border-[#1B2940] bg-[#07101B] px-2 py-1.5 text-xs text-white"><option value="">Choose version</option>{versions.slice(1).map((version) => <option key={version.version} value={version.version}>Version {version.version}</option>)}</select></div><div className="mt-3"><PromptDiff before={comparison?.definition.instructions} after={latest?.definition.instructions} /></div><p className="mt-2 text-[10px] text-[#64748B]">+ added · - removed · unchanged lines are neutral. Use Prompt Version History above to restore a prompt safely through the draft/publish lifecycle.</p></div>

        <div className="mt-5 border-t border-[#162131] pt-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FCA5A5]">Controlled deletion</div><h4 className="mt-1 text-xs font-semibold text-white">Delete Agent or Prior Version</h4><p className="mt-1 text-xs text-[#94A3B8]">Type the exact agent name before deletion. The current Foundry version is never deletable.</p><Input aria-label="Delete confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} disabled={!canManage || busy} placeholder={selected ? `Type ${selected.name}` : "Select an agent"} className="mt-3" />{selected?.protected && <label className="mt-2 flex items-center gap-2 text-xs text-[#FDE68A]"><input type="checkbox" checked={acknowledgeProtected} onChange={(event) => setAcknowledgeProtected(event.target.checked)} disabled={!canManage || busy} />I acknowledge this is a protected security agent.</label>}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="danger" onClick={() => void deleteVersion()} disabled={!selected || !canManage || !compareVersion || deleteConfirmation !== selected.name || busy}>Delete Compared Version</Button><Button size="sm" variant="danger" onClick={() => void deleteAgent()} disabled={!selected || !canManage || deleteConfirmation !== selected.name || (selected.protected && !acknowledgeProtected) || busy}>Delete Agent</Button></div></div>

        <div className="mt-5 border-t border-[#162131] pt-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Live · Microsoft Foundry</div><h4 className="mt-1 text-xs font-semibold text-white">Test Agent</h4><Input aria-label="Test agent message" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} className="mt-3" disabled={!selected || busy} /><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => void newConversation()} disabled={!selected || busy}>New Conversation</Button><Button size="sm" onClick={() => void testAgent()} disabled={!selected || busy}>{conversationId ? "Continue Conversation" : "Test Agent"}</Button></div>{conversationId && <p className="mt-2 text-xs text-[#94A3B8]">Conversation ID: {conversationId}</p>}{result && <div className="mt-3 rounded border border-[#1D4E44] bg-[#0B1E1A] p-3 text-xs"><div className="font-medium text-[#6EE7B7]">Completed in {result.latency_ms} ms</div><p className="mt-2 whitespace-pre-wrap text-[#D1FAE5]">{result.output_text}</p><div className="mt-3 grid gap-2 text-[#A7F3D0] sm:grid-cols-3"><span>Response ID: {result.response_id ?? "Not available"}</span><span>Input tokens: {result.usage?.input_tokens ?? "Not available"}</span><span>Output tokens: {result.usage?.output_tokens ?? "Not available"}</span></div></div>}</div>
      </div>
    </div>

    <div className="rounded-lg border border-[#162131] bg-[#09111C] p-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Oswell Audit</div><h3 className="mt-1 text-sm font-semibold text-white">Governance History</h3>{audit.length ? <div className="mt-3 divide-y divide-[#162131] text-xs">{audit.map((event) => <div key={event.id} className="grid gap-1 py-2 md:grid-cols-[1.2fr_1.5fr_1fr]"><span className="font-medium text-white">{event.action}</span><span className="text-[#94A3B8]">{event.agent_name} {event.previous_version ? `v${event.previous_version} → ` : ""}{event.new_version ? `v${event.new_version}` : ""}</span><span className="text-[#64748B]">{formatTimestamp(event.created_at)}</span></div>)}</div> : <p className="mt-3 text-xs text-[#94A3B8]">No persisted governance history is available yet.</p>}</div>
  </section>;
}
