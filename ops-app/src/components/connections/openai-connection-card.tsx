"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type OpenAIStatus = {
  configured: boolean;
  connected: boolean;
  status: string;
  models_available: number;
  last_checked_at: string;
  latency_ms: number | null;
  message?: string;
};

type OpenAIModel = { id: string; owned_by: string; availability: string };

export function OpenAIConnectionCard() {
  const [status, setStatus] = useState<OpenAIStatus | null>(null);
  const [models, setModels] = useState<OpenAIModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function loadStatus(refresh = false) {
    try {
      setError(null);
      const next = await apiFetch<OpenAIStatus>(`/api/openai/status${refresh ? "?refresh=true" : ""}`);
      setStatus(next);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load OpenAI status.");
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function testConnection() {
    setTesting(true);
    try {
      setError(null);
      setStatus(await apiFetch<OpenAIStatus>("/api/openai/test", { method: "POST" }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "OpenAI test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function viewModels() {
    try {
      setError(null);
      const response = await apiFetch<{ items: OpenAIModel[] }>("/api/providers/openai/models");
      setModels(response.items);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load OpenAI models.");
    }
  }

  const stateLabel = status?.connected ? "Connected" : status?.configured ? "Authentication Error" : "Not Configured";

  return (
    <section className="mb-4 rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">OpenAI</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">Server-side provider connection. Credentials remain outside the browser.</p>
        </div>
        <span className={status?.connected ? "text-xs font-medium text-[#34D399]" : "text-xs font-medium text-[#FBBF24]"}>{status ? stateLabel : "Checking..."}</span>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <div><div className="text-[#64748B]">Models</div><div className="mt-1 text-white">{status ? status.models_available : "--"}</div></div>
        <div><div className="text-[#64748B]">Last Checked</div><div className="mt-1 text-white">{status?.last_checked_at ? new Date(status.last_checked_at).toLocaleString() : "--"}</div></div>
        <div><div className="text-[#64748B]">Latency</div><div className="mt-1 text-white">{status?.latency_ms == null ? "--" : `${status.latency_ms} ms`}</div></div>
      </div>
      {error && <p className="mt-3 text-xs text-[#FCA5A5]">{error}</p>}
      {status?.message && !status.connected && <p className="mt-3 text-xs text-[#FCA5A5]">{status.message}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void testConnection()} disabled={testing}>{testing ? "Testing OpenAI connection..." : "Test Connection"}</Button>
        <Button size="sm" variant="secondary" onClick={() => void viewModels()} disabled={!status?.connected}>View Models</Button>
        <Button size="sm" variant="ghost" onClick={() => void loadStatus(true)} disabled={testing}>Refresh</Button>
      </div>
      {models && (
        <div className="mt-4 max-h-56 overflow-auto rounded border border-[#162131]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07101B] text-[#94A3B8]"><tr><th className="px-3 py-2">Model</th><th className="px-3 py-2">Owner</th><th className="px-3 py-2">Availability</th></tr></thead>
            <tbody>{models.map((model) => <tr key={model.id} className="border-t border-[#162131]"><td className="px-3 py-2 text-white">{model.id}</td><td className="px-3 py-2 text-[#B6C2D2]">{model.owned_by}</td><td className="px-3 py-2 text-[#34D399]">{model.availability}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
