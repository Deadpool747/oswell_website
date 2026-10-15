"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { foundryFetch, type FoundryStatus } from "@/lib/api/foundry";

export function FoundryConnectionCard() {
  const [status, setStatus] = useState<FoundryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function refresh() {
    try {
      setError(null);
      setStatus(await foundryFetch<FoundryStatus>("/status"));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load Microsoft Foundry status.");
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function testConnection() {
    setTesting(true);
    try {
      setError(null);
      setStatus(await foundryFetch<FoundryStatus>("/test", { method: "POST" }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Microsoft Foundry test failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="mb-4 rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Microsoft Foundry</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">Live project connection authenticated by the server&apos;s Azure identity.</p>
        </div>
        <span className={status?.connected ? "text-xs font-medium text-[#34D399]" : "text-xs font-medium text-[#FBBF24]"}>{status?.connected ? "Connected" : status ? "Unavailable" : "Checking..."}</span>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <div><div className="text-[#64748B]">Configured agent</div><div className="mt-1 text-white">{status?.configured_agent ?? "--"}</div></div>
        <div><div className="text-[#64748B]">Authentication</div><div className="mt-1 text-white">{status?.authentication ?? "--"}</div></div>
        <div><div className="text-[#64748B]">Latency</div><div className="mt-1 text-white">{status ? `${status.latency_ms} ms` : "--"}</div></div>
      </div>
      {status && !status.agent_management_available && <p className="mt-3 text-xs text-[#94A3B8]">Agent management is unavailable under runtime least-privilege mode. The configured security investigator remains available for direct invocation.</p>}
      {error && <p className="mt-3 text-xs text-[#FCA5A5]">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void testConnection()} disabled={testing}>{testing ? "Testing Foundry..." : "Test Connection"}</Button>
        <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={testing}>Refresh</Button>
      </div>
    </section>
  );
}
