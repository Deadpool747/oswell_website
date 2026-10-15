"use client";

import { useEffect, useState } from "react";
import { AgentGovernancePanel } from "@/components/agents/agent-governance-panel";
import { useLocalAuthSession } from "@/components/providers/entra-auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";

type OpenAIStatus = {
  configured: boolean;
  connected: boolean;
  status: string;
  models_available: number;
  latency_ms?: number;
  capabilities: Record<string, boolean>;
};
type Model = { id: string };
type Agent = { id: string; name: string; description?: string | null; model: string; instructions: string; tools: unknown[]; environment: string; status: string; updated_at: string; active_revision: number };
type OpenAIPrompt = { agent: Agent; active_revision: { revision: number; instructions: string } | null; draft: { instructions: string; etag: string; base_revision: number } | null };
type GoogleAgent = { id: string; display_name: string; description?: string | null; external_agent_id?: string | null; status: string; metadata_json?: { google_location?: string; google_project_id?: string; operation_schemas?: unknown[] } };
type Run = { id: string; status: string; conversation_id?: string | null; response_id?: string | null; output_text?: string; output?: string | null; latency_ms?: number | null; token_usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null };

export function UnifiedAgentRegistry() {
  const localSession = useLocalAuthSession();
  const [provider, setProvider] = useState<"all" | "foundry" | "openai" | "google">("all");
  const [status, setStatus] = useState<OpenAIStatus | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [googleAgents, setGoogleAgents] = useState<GoogleAgent[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [instructions, setInstructions] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("Give a concise status summary.");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [result, setResult] = useState<Run | null>(null);
  const [openaiDraftEtag, setOpenaiDraftEtag] = useState<string | null>(null);
  const [openaiDraftPresent, setOpenaiDraftPresent] = useState(false);
  const canManage = localSession?.role === "Oswell.PlatformAdministrator";

  async function refresh() {
    setError(null);
    try {
      const [nextStatus, openaiAgents, vertexAgents] = await Promise.all([
        apiFetch<OpenAIStatus>("/api/openai/status"),
        apiFetch<{ items: Agent[] }>("/api/openai/agents"),
        apiFetch<GoogleAgent[]>("/api/agents?provider=google_vertex"),
      ]);
      setStatus(nextStatus);
      setAgents(openaiAgents.items);
      setGoogleAgents(vertexAgents);
      setSelected((current) => openaiAgents.items.find((agent) => agent.id === current?.id) ?? null);
      if (nextStatus.connected) {
        const discovered = await apiFetch<{ items: Model[] }>("/api/providers/openai/models");
        setModels(discovered.items);
      } else {
        setModels([]);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load the unified registry.");
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function create() {
    if (!canManage) {
      setError("Platform Administrator access is required to create OpenAI agent configurations.");
      return;
    }
    setBusy(true); setError(null);
    try {
      await apiFetch("/api/openai/agents", { method: "POST", body: JSON.stringify({ name, model, instructions, reason, environment: "production", tools: [] }) });
      setShowCreate(false); setName(""); setModel(""); setInstructions(""); setReason("");
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create the OpenAI agent.");
    } finally { setBusy(false); }
  }

  async function save() {
    if (!selected) return;
    if (!canManage) {
      setError("Platform Administrator access is required to save OpenAI prompt drafts.");
      return;
    }
    setBusy(true); setError(null);
    try {
      const draft = await apiFetch<{ etag: string }>(`/api/openai/agents/${encodeURIComponent(selected.id)}/prompt/draft`, { method: "PUT", body: JSON.stringify({ base_revision: selected.active_revision, prompt_name: `${selected.name} Instructions`, instructions, description: selected.description, change_notes: reason, etag: openaiDraftEtag }) });
      setOpenaiDraftEtag(draft.etag); setOpenaiDraftPresent(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save this OpenAI prompt draft.");
    } finally { setBusy(false); }
  }

  async function publishOpenAIDraft() {
    if (!selected || !canManage) return;
    setBusy(true); setError(null);
    try {
      await apiFetch<Agent>(`/api/openai/agents/${encodeURIComponent(selected.id)}/prompt/publish`, { method: "POST", body: JSON.stringify({ base_revision: selected.active_revision }) });
      setReason(""); setOpenaiDraftEtag(null); setOpenaiDraftPresent(false); await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "OpenAI prompt was not published. The active prompt remains unchanged.");
    } finally { setBusy(false); }
  }

  async function loadOpenAIPrompt(agent: Agent) {
    try {
      const prompt = await apiFetch<OpenAIPrompt>(`/api/openai/agents/${encodeURIComponent(agent.id)}/prompt`);
      setInstructions(prompt.draft?.instructions ?? prompt.active_revision?.instructions ?? agent.instructions);
      setOpenaiDraftEtag(prompt.draft?.etag ?? null);
      setOpenaiDraftPresent(Boolean(prompt.draft));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load OpenAI prompt history.");
    }
  }

  async function newConversation() {
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      const response = await apiFetch<{ conversation_id: string }>(`/api/openai/agents/${encodeURIComponent(selected.id)}/conversations`, { method: "POST" });
      setConversationId(response.conversation_id); setResult(null);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Unable to start an OpenAI conversation."); }
    finally { setBusy(false); }
  }

  async function run() {
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      const response = await apiFetch<Run>(`/api/openai/agents/${encodeURIComponent(selected.id)}/runs`, { method: "POST", body: JSON.stringify({ input: message, conversation_id: conversationId }) });
      setResult(response); setConversationId(response.conversation_id ?? conversationId);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "OpenAI execution failed."); }
    finally { setBusy(false); }
  }

  const openaiVisible = provider === "all" || provider === "openai";
  const foundryVisible = provider === "all" || provider === "foundry";
  const googleVisible = provider === "all" || provider === "google";
  const selectAgent = (agent: Agent) => { setSelected(agent); setModel(agent.model); setInstructions(agent.instructions); setReason(""); setConversationId(null); setResult(null); void loadOpenAIPrompt(agent); };

  return <section className="space-y-4">
    <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#38BDF8]">Live · unified provider registry</div><h2 className="mt-1 text-[15px] font-semibold text-white">Agent Registry</h2><p className="mt-1 text-xs text-[#94A3B8]">Foundry-native agents and Oswell-managed OpenAI response agents, with provider lifecycle differences shown honestly.</p></div><Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={busy}>Refresh</Button></div>
      <div className="mt-4 flex flex-wrap gap-2">{([ ["all", "All Providers"], ["foundry", "Microsoft Foundry"], ["openai", "OpenAI"], ["google", "Google Cloud"] ] as const).map(([value, label]) => <button key={value} onClick={() => setProvider(value)} className={`rounded border px-3 py-1.5 text-xs ${provider === value ? "border-[#38BDF8] bg-[#102036] text-white" : "border-[#1B2940] text-[#94A3B8] hover:text-white"}`}>{label}</button>)}</div>
      {error && <p className="mt-3 text-xs text-[#FCA5A5]">{error}</p>}
    </section>

    {openaiVisible && <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A7F3D0]">Live · OpenAI</div><h3 className="mt-1 text-sm font-semibold text-white">OpenAI Response Agents</h3><p className="mt-1 text-xs text-[#94A3B8]">{status?.connected ? `${status.models_available} real models available. OpenAI provider-agent registry: unavailable; Oswell-managed agent configurations use the Responses API.` : "OpenAI is not connected. Add the Key Vault-backed server secret before creating agents."}</p></div><Button size="sm" onClick={() => setShowCreate((value) => !value)} disabled={!status?.connected || !canManage || busy}>New OpenAI Agent</Button></div>
      {!canManage && <p className="mt-3 rounded border border-[#5B3D1A] bg-[#22170B] p-3 text-xs text-[#FDE68A]">PLATFORM_ADMINISTRATOR_ROLE_REQUIRED for OpenAI agent creation and revision changes. Your current access can run agents and review Live Runs.</p>}
      {status && <div className="mt-3 grid gap-3 text-xs sm:grid-cols-4"><div><div className="text-[#64748B]">Connection</div><div className="mt-1 text-white">{status.status}</div></div><div><div className="text-[#64748B]">Models</div><div className="mt-1 text-white">{status.models_available}</div></div><div><div className="text-[#64748B]">Responses</div><div className="mt-1 text-white">{status.capabilities.responses ? "Available" : "Not available"}</div></div><div><div className="text-[#64748B]">Conversations</div><div className="mt-1 text-white">{status.capabilities.conversations ? "Available" : "Not available"}</div></div></div>}
      {showCreate && <div className="mt-4 grid gap-3 rounded border border-[#1B2940] bg-[#07101B] p-4 lg:grid-cols-2"><div><label className="text-xs text-white">Agent name</label><Input value={name} onChange={(event) => setName(event.target.value)} className="mt-1" /><label className="mt-3 block text-xs text-white">Real OpenAI model</label><select value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded border border-[#1B2940] bg-[#09111C] px-3 py-2 text-xs text-white"><option value="">Choose a live model</option>{models.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></div><div><label className="text-xs text-white">Instructions</label><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} className="mt-1 min-h-24 w-full rounded border border-[#1B2940] bg-[#07101B] p-3 text-xs text-white" /><label className="mt-3 block text-xs text-white">Reason</label><Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1" placeholder="Required audit reason" /><div className="mt-3 flex gap-2"><Button size="sm" disabled={!canManage || !name || !model || !instructions || !reason || busy} onClick={() => void create()}>Create Oswell-managed Agent</Button><Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button></div></div></div>}
      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.6fr]"><div className="rounded border border-[#1B2940]">{agents.length ? agents.map((agent) => <button key={agent.id} onClick={() => selectAgent(agent)} className={`block w-full border-b border-[#162131] px-4 py-3 text-left text-xs ${selected?.id === agent.id ? "bg-[#102036]" : "hover:bg-[#0D1827]"}`}><strong className="text-white">{agent.name}</strong><div className="mt-1 text-[#94A3B8]">OpenAI · {agent.model} · Prompt v{agent.active_revision}</div></button>) : <p className="p-4 text-xs text-[#94A3B8]">No Oswell-managed OpenAI agents exist.</p>}</div><div className="rounded border border-[#1B2940] p-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A7F3D0]">{selected ? "OpenAI · Oswell managed" : "Select an OpenAI agent"}</div><h4 className="mt-1 text-sm font-semibold text-white">{selected?.name ?? "No agent selected"}</h4>{selected && <><div className="mt-3 rounded border border-[#1B2940] bg-[#07101B] p-3 text-xs"><div className="flex justify-between gap-3"><span className="text-[#94A3B8]">Active prompt</span><span className="text-white">v{selected.active_revision}</span></div><p className="mt-2 text-[#64748B]">OpenAI runs use the active Oswell revision. Saving a draft never changes production behavior.</p></div><label className="mt-4 block text-xs text-white">Instructions</label><textarea value={instructions} disabled={!canManage} onChange={(event) => setInstructions(event.target.value)} className="mt-1 min-h-32 w-full rounded border border-[#1B2940] bg-[#07101B] p-3 text-xs text-white" /><div className="mt-1 text-right text-[10px] text-[#64748B]">{instructions.length.toLocaleString()} characters</div><label className="mt-3 block text-xs text-white">Revision notes</label><Input value={reason} disabled={!canManage} onChange={(event) => setReason(event.target.value)} className="mt-1" placeholder="Required for the prompt audit" /><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => void save()} disabled={!canManage || !instructions || !reason || busy}>Save Draft</Button><Button size="sm" variant="secondary" onClick={() => void publishOpenAIDraft()} disabled={!canManage || !openaiDraftPresent || busy}>Publish Changes</Button><span className="self-center text-[10px] text-[#64748B]">{openaiDraftPresent ? "Draft ready for review and publish." : "No active draft."}</span></div><div className="mt-5 border-t border-[#162131] pt-4"><label className="text-xs text-white">Message</label><Input value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2" /><div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={() => void newConversation()} disabled={busy}>New Conversation</Button><Button size="sm" onClick={() => void run()} disabled={busy}>{conversationId ? "Continue Conversation" : "Run Agent"}</Button></div>{conversationId && <p className="mt-2 text-[10px] text-[#94A3B8]">Conversation ID: {conversationId}</p>}{result && <div className="mt-3 rounded border border-[#1D4E44] bg-[#0B1E1A] p-3 text-xs"><div className="font-medium text-[#6EE7B7]">{result.status} · {result.latency_ms ?? "Not available"} ms</div><p className="mt-2 whitespace-pre-wrap text-[#D1FAE5]">{result.output_text ?? result.output ?? "No output was returned."}</p><div className="mt-2 text-[#A7F3D0]">Tokens: {result.token_usage?.total_tokens ?? "Not available"} · Response: {result.response_id ?? "Not available"}</div></div>}</div></>}</div></div>
    </section>}
    {googleVisible && <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FDE68A]">Live · Google Cloud · Vertex AI Agent Engine</div><h3 className="mt-1 text-sm font-semibold text-white">Google Cloud Agent Engines</h3><p className="mt-1 text-xs text-[#94A3B8]">Only Agent Engines synchronized by the Oswell backend appear here. Configure and test a Google Cloud Vertex AI connection in Connection Center before syncing.</p></div><Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={busy}>Refresh</Button></div><div className="mt-4 overflow-x-auto rounded border border-[#1B2940]"><table className="min-w-full text-left text-xs"><thead className="bg-[#07101B] text-[#94A3B8]"><tr><th className="px-3 py-2">Agent Engine</th><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Project / Region</th><th className="px-3 py-2">State</th></tr></thead><tbody>{googleAgents.length ? googleAgents.map((agent) => <tr key={agent.id} className="border-t border-[#162131]"><td className="px-3 py-3 text-white"><div>{agent.display_name}</div><div className="mt-1 max-w-[360px] truncate text-[10px] text-[#64748B]">{agent.external_agent_id ?? "Provider resource unavailable"}</div></td><td className="px-3 py-3 text-[#FDE68A]">Google Cloud Vertex AI</td><td className="px-3 py-3 text-[#DCE5F2]">{agent.metadata_json?.google_project_id ?? "Not available"} / {agent.metadata_json?.google_location ?? "Not available"}</td><td className="px-3 py-3 text-[#DCE5F2]">{agent.status}</td></tr>) : <tr><td colSpan={4} className="px-3 py-5 text-[#94A3B8]">No Google Agent Engines have been synchronized. This is a live empty state, not a sample dataset.</td></tr>}</tbody></table></div></section>}
    {foundryVisible && <AgentGovernancePanel />}
  </section>;
}
