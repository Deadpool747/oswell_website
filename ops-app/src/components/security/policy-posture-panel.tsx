"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Database, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { securityApi, type PolicyFinding, type PolicyInvestigation, type PolicyResult, type PolicySummary } from "@/lib/api/security";

type Filter = "All" | "NonCompliant" | "Compliant";

function resourceName(resourceId: string | null) {
  return resourceId?.split("/").filter(Boolean).at(-1) ?? "Subscription control";
}

function severityClass(severity: string) {
  if (severity === "High") return "bg-[#EF4444]/15 text-[#FCA5A5] ring-[#EF4444]/25";
  if (severity === "Medium") return "bg-[#F59E0B]/15 text-[#FCD34D] ring-[#F59E0B]/25";
  return "bg-[#3B82F6]/15 text-[#93C5FD] ring-[#3B82F6]/25";
}

function riskClass(risk: string) {
  if (risk === "critical") return "bg-[#7F1D1D] text-[#FECACA]";
  if (risk === "high") return "bg-[#7C2D12] text-[#FED7AA]";
  if (risk === "medium") return "bg-[#713F12] text-[#FEF3C7]";
  return "bg-[#1E3A5F] text-[#BFDBFE]";
}

export function PolicyPosturePanel() {
  const [summary, setSummary] = useState<PolicySummary | null>(null);
  const [results, setResults] = useState<PolicyResult[]>([]);
  const [findings, setFindings] = useState<PolicyFinding[]>([]);
  const [investigations, setInvestigations] = useState<PolicyInvestigation[]>([]);
  const [selected, setSelected] = useState<PolicyResult | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [nextSummary, nextResults, nextFindings, nextInvestigations] = await Promise.all([
        securityApi.summary(),
        securityApi.results(),
        securityApi.findings(),
        securityApi.investigations(),
      ]);
      setSummary(nextSummary);
      setResults(nextResults);
      setFindings(nextFindings);
      setInvestigations(nextInvestigations);
      setSelected((current) => nextResults.find((item) => item.id === current?.id) ?? nextResults[0] ?? null);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load Azure Policy posture.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function sync() {
    setSyncing(true);
    try {
      const response = await securityApi.sync();
      const policy = response.sources.AzurePolicyMCSB;
      await refresh();
      setMessage(policy?.errors ? (policy.reason ?? "Azure Policy sync failed.") : `Synced ${policy?.fetched ?? 0} live MCSB policy results.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Azure Policy sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function investigateResource() {
    if (!selected?.resource_id) return;
    setInvestigating(true);
    try {
      const response = await securityApi.investigateResource(selected.resource_id);
      setInvestigations((current) => [response.investigation, ...current]);
      setMessage(`Investigation persisted: ${response.investigation.id}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Investigation could not be started.");
    } finally {
      setInvestigating(false);
    }
  }

  const visibleResults = filter === "All" ? results : results.filter((item) => item.compliance_state === filter);
  const selectedFinding = findings.find((finding) => finding.policy_display_name === selected?.policy_definition_display_name && finding.resource_id === selected?.resource_id);
  const selectedInvestigation = investigations.find((item) => item.resource_id === selected?.resource_id);

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-[#162131] bg-[#09111C]">
      <div className="relative overflow-hidden border-b border-[#162131] px-4 py-4 sm:px-5">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#2563EB]/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#1D4E44] bg-[#0B1E1A] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#6EE7B7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" /> LIVE · AZURE POLICY · MCSB
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Policy posture</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#94A3B8]">Real Azure Policy evaluation results. These are security posture controls, not Defender recommendations, incidents, or evidence of compromise.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void refresh()} disabled={loading || syncing}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            <Button size="sm" onClick={() => void sync()} disabled={syncing}>{syncing ? "Syncing" : "Sync Live Policy"}</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-b border-[#1B2D43] bg-[#1B2D43] sm:grid-cols-2 lg:grid-cols-5">
        <Metric icon={Database} label="Resources Evaluated" value={summary?.resources_evaluated ?? null} tone="blue" />
        <Metric icon={ClipboardList} label="Policy Results" value={summary?.policy_results ?? null} tone="blue" />
        <Metric icon={CheckCircle2} label="Compliant" value={summary?.compliant ?? null} tone="green" />
        <Metric icon={ShieldAlert} label="Noncompliant" value={summary?.noncompliant ?? null} tone="amber" />
        <Metric icon={ShieldAlert} label="Open Posture Findings" value={summary?.open_posture_findings ?? null} tone="red" />
      </div>

      <div className="grid min-h-[460px] lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
        <div className="border-b border-[#1B2D43] lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#1B2D43] px-4 py-3">
            {(["All", "NonCompliant", "Compliant"] as Filter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${filter === value ? "bg-[#203250] text-white" : "text-[#94A3B8] hover:bg-[#101D2C] hover:text-white"}`}>{value === "All" ? `All Results (${results.length})` : `${value === "NonCompliant" ? "Noncompliant" : "Compliant"} (${value === "NonCompliant" ? (summary?.noncompliant ?? "Loading") : (summary?.compliant ?? "Loading")})`}</button>)}
            <span className="ml-auto text-[10px] uppercase tracking-[0.08em] text-[#64748B]">Persisted Oswell data</span>
          </div>
          <div className="max-h-[510px] overflow-y-auto">
            {loading && <p className="p-5 text-sm text-[#94A3B8]">Loading live policy posture…</p>}
            {!loading && !visibleResults.length && <p className="p-5 text-sm text-[#94A3B8]">No synchronized policy results match this filter.</p>}
            {visibleResults.map((result) => <button key={result.id} onClick={() => setSelected(result)} className={`block w-full border-b border-[#142236] px-4 py-3 text-left transition hover:bg-[#0D1827] ${selected?.id === result.id ? "bg-[#101E31]" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${result.compliance_state === "NonCompliant" ? "bg-[#F59E0B]" : "bg-[#34D399]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[#E7EEF8]">{result.policy_definition_display_name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#94A3B8]"><span>{resourceName(result.resource_id)}</span><span>•</span><span>{result.resource_type ?? "Subscription"}</span></div>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-semibold ${result.compliance_state === "NonCompliant" ? "bg-[#F59E0B]/15 text-[#FCD34D]" : "bg-[#10B981]/15 text-[#6EE7B7]"}`}>{result.compliance_state}</span>
              </div>
            </button>)}
          </div>
        </div>

        <aside className="bg-[#07101B] p-4 sm:p-5">
          {!selected ? <p className="text-sm text-[#94A3B8]">Select a synchronized policy result to inspect its evidence.</p> : <>
            <div className="mb-3 flex items-start justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Microsoft Policy Evidence</div><h2 className="mt-1 text-base font-semibold text-white">{selected.policy_definition_display_name}</h2></div><span className={`rounded px-2 py-1 text-[10px] font-semibold ring-1 ${severityClass(selected.oswell_posture_severity)}`}>Oswell {selected.oswell_posture_severity}</span></div>
            <p className="text-xs leading-5 text-[#94A3B8]">{selected.policy_definition_description ?? "Azure did not return a policy description for this evaluated result."}</p>
            <dl className="mt-4 space-y-2 border-y border-[#1B2D43] py-3 text-xs"><Detail label="Compliance" value={selected.compliance_state} /><Detail label="Resource" value={selected.resource_id ?? "Subscription scope"} /><Detail label="Resource type" value={selected.resource_type ?? "Microsoft.Resources/subscriptions"} /><Detail label="Policy effect" value={selected.effect ?? "Not returned"} /><Detail label="Evaluation" value={selected.timestamp ? new Date(selected.timestamp).toLocaleString() : "Not returned"} /></dl>
            <div className="mt-4"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Oswell Calculated</div><div className="mt-2 flex flex-wrap gap-2"><span className="rounded bg-[#162B49] px-2 py-1 text-[11px] text-[#BFDBFE]">{selected.classification.replaceAll("_", " ")}</span><span className="rounded bg-[#251F3A] px-2 py-1 text-[11px] text-[#D8B4FE]">Priority {selected.priority_score}/100</span></div></div>
            <div className="mt-4 rounded-lg border border-[#1B2D43] bg-[#09111C] p-3"><div className="flex items-center justify-between gap-2"><div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">AI Investigation</div><p className="mt-1 text-xs text-[#94A3B8]">Bounded to this resource’s real policy evidence and exact matching Azure Activity only.</p></div><Sparkles className="h-4 w-4 text-[#A78BFA]" /></div><Button className="mt-3 w-full" size="sm" onClick={() => void investigateResource()} disabled={selected.compliance_state !== "NonCompliant" || !selected.resource_id || investigating}>{investigating ? "Investigating" : "Investigate Resource"}</Button>{selectedFinding && <p className="mt-2 text-[11px] text-[#FCD34D]">Finding status: {selectedFinding.status}</p>}{selectedInvestigation && <p className="mt-2 text-[11px] text-[#6EE7B7]">Latest investigation persisted {new Date(selectedInvestigation.created_at).toLocaleString()}.</p>}</div>
            {selectedInvestigation && <Assessment investigation={selectedInvestigation} />}
            <p className="mt-3 text-[10px] font-medium tracking-[0.1em] text-[#34D399]">{selected.provenance}</p>
          </>}
        </aside>
      </div>
      <section className="border-t border-[#162131] bg-[#09111C] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Findings</div><h3 className="mt-1 text-base font-semibold text-white">Live posture findings</h3></div><span className="text-[10px] font-semibold tracking-[0.1em] text-[#6EE7B7]">LIVE · OSWELL PERSISTED</span></div>
        {!loading && !findings.length ? <p className="py-3 text-sm text-[#94A3B8]">No live posture findings available.</p> : <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-xs"><thead className="border-y border-[#162131] bg-[#07101B] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]"><tr><th className="px-3 py-2">Severity</th><th className="px-3 py-2">Finding</th><th className="px-3 py-2">Resource</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Classification</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Priority</th></tr></thead><tbody>{findings.map((finding) => <tr key={finding.id} className="border-b border-[#162131] text-[#C9D6E5]"><td className="px-3 py-3"><span className={`rounded px-1.5 py-1 text-[10px] font-semibold ${severityClass(finding.oswell_posture_severity)}`}>{finding.oswell_posture_severity}</span></td><td className="max-w-[290px] px-3 py-3 text-white">{finding.title}</td><td className="max-w-[220px] truncate px-3 py-3">{resourceName(finding.resource_id)}</td><td className="px-3 py-3">Azure Policy / MCSB</td><td className="px-3 py-3">{finding.classification.replaceAll("_", " ")}</td><td className="px-3 py-3">{finding.status}</td><td className="px-3 py-3">{finding.priority_score}/100</td></tr>)}</tbody></table></div>}
      </section>
      {message && <div className="border-t border-[#1B2D43] bg-[#0B1420] px-5 py-3 text-xs text-[#DCE5F2]">{message}</div>}
    </section>
  );
}

export function SecurityControlCenter() {
  return <AppShell>
    <PageHeader
      title="Security"
      subtitle="Live Microsoft Cloud Security Benchmark posture, persisted findings, and bounded Foundry investigations."
      actionLabel="Sync live policy"
      searchPlaceholder="Live policy controls are available below"
      search=""
      onSearch={() => undefined}
      onAction={() => undefined}
      actionsDisabled
      showSearch={false}
      showFilters={false}
      showExport={false}
      showAction={false}
    />
    <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]"><span className="rounded bg-[#101D2C] px-2.5 py-1.5 text-white">Overview</span><span className="rounded px-2.5 py-1.5">Findings</span><span className="rounded px-2.5 py-1.5">Posture</span><span className="rounded px-2.5 py-1.5">Investigations</span><span className="rounded px-2.5 py-1.5">Human review</span></div>
    <PolicyPosturePanel />
  </AppShell>;
}

function Assessment({ investigation }: { investigation: PolicyInvestigation }) {
  const result = investigation.structured_result;
  return <div className="mt-4 space-y-4 border-t border-[#1B2D43] pt-4 text-xs">
    <div className="flex items-center justify-between gap-2"><div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A78BFA]">AI Security Assessment</div><p className="mt-1 font-medium text-[#E7EEF8]">{result.summary}</p></div><span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${riskClass(result.risk_assessment)}`}>{result.risk_assessment}</span></div>
    <div className="grid grid-cols-2 gap-2 rounded-md bg-[#0C1827] p-2 text-[11px]"><Detail label="Confidence" value={`${Math.round(result.confidence * 100)}%`} /><Detail label="Status" value={investigation.status} /><Detail label="Human review" value={investigation.human_review_state} /><Detail label="Requester" value={investigation.requested_by ?? "Not returned"} /><Detail label="Agent" value={investigation.agent_name} /><Detail label="Version" value={investigation.agent_version ?? "Not returned"} /><Detail label="Latency" value={`${investigation.latency_ms} ms`} /><Detail label="Input tokens" value={investigation.input_tokens === null ? "Not available" : String(investigation.input_tokens)} /><Detail label="Output tokens" value={investigation.output_tokens === null ? "Not available" : String(investigation.output_tokens)} /><Detail label="Total tokens" value={investigation.total_tokens === null ? "Not available" : String(investigation.total_tokens)} /><Detail label="Investigation" value={investigation.id} /><Detail label="Response" value={investigation.response_id ?? "Not returned"} /><Detail label="Conversation" value={investigation.conversation_id ?? "Not returned"} /></div>
    <AssessmentList title="Observed Posture Weaknesses" items={result.posture_weaknesses.map((item) => `${item.title}: ${item.evidence}`)} />
    <AssessmentList title="Compliant Controls" items={result.compliant_controls.map((item) => `${item.title}: ${item.evidence}`)} />
    <AssessmentList title="Related Activity" items={result.related_activity.map((item) => `${item.source}: ${item.description}`)} />
    <AssessmentList title="Correlations" items={result.correlations} />
    <AssessmentList title="Hypotheses" items={result.hypotheses.map((item) => `${item.description} (${Math.round(item.confidence * 100)}%)`)} />
    <AssessmentList title="Recommended Actions" items={result.recommended_actions.map((item) => `${item.priority}: ${item.action} - ${item.reason}`)} />
    <div className="flex flex-wrap gap-2 text-[10px] font-semibold tracking-[0.08em]"><span className="text-[#6EE7B7]">LIVE · MICROSOFT FOUNDRY</span><span className="text-[#94A3B8]">{investigation.included_evidence.length} BOUNDED EVIDENCE RECORDS</span></div>
  </div>;
}

function AssessmentList({ title, items }: { title: string; items: string[] }) {
  return <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">{title}</div>{items.length ? <ul className="space-y-1 text-[#C9D6E5]">{items.map((item, index) => <li key={`${title}-${index}`} className="leading-5">{item}</li>)}</ul> : <p className="text-[#64748B]">None returned from the bounded evidence.</p>}</div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Database; label: string; value: number | null; tone: "blue" | "green" | "amber" | "red" }) {
  const colors = { blue: "text-[#93C5FD]", green: "text-[#6EE7B7]", amber: "text-[#FCD34D]", red: "text-[#FCA5A5]" };
  return <div className="bg-[#09111C] px-4 py-3"><div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] ${colors[tone]}`}><Icon className="h-3.5 w-3.5" />{label}</div><div className="mt-1 text-2xl font-semibold text-white">{value ?? "Loading..."}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[105px_minmax(0,1fr)] gap-2"><dt className="text-[#64748B]">{label}</dt><dd className="break-all text-[#DCE5F2]">{value}</dd></div>;
}
