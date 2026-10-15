"use client";

import { CheckCircle2, ExternalLink, Play, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges/status-badge";
import { SecurityRiskBadge } from "@/components/security/security-risk-badge";
import { SecurityScore } from "@/components/security/security-score";
import { DashboardTabs } from "@/components/dashboard/tabs";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable } from "@/components/tables/data-table";
import { MiniChart } from "@/components/charts/dashboard-chart";
import { LiveDataUnavailableNotice } from "@/components/dashboard/demo-data-notice";
import { agentDetailRows } from "@/data/mockData";
import { demoDataEnabled } from "@/lib/runtime/demo-data";
import { useState } from "react";
import type { TableColumn, TableRow } from "@/types/dashboard";

const runColumns: TableColumn[] = [
  { key: "id", label: "Run ID", type: "text" },
  { key: "status", label: "Status", type: "status" },
  { key: "time", label: "Time", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "duration", label: "Duration", type: "text" },
  { key: "tokens", label: "Tokens", type: "text" },
  { key: "cost", label: "Cost", type: "text" },
  { key: "policy", label: "Policy", type: "status" },
  { key: "confidence", label: "Confidence", type: "text" }
];

export function AgentDetailPage() {
  const [tab, setTab] = useState("Overview");
  const [selected, setSelected] = useState<TableRow | undefined>(agentDetailRows[0]);
  const [toast, setToast] = useState("");
  const runLocalAction = (label: string) => {
    setToast(`${label} updated the agent profile.`);
    window.setTimeout(() => setToast(""), 2200);
  };

  if (!demoDataEnabled()) {
    return (
      <AppShell>
        <LiveDataUnavailableNotice title="Invoice Validation Agent" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-4">
        <div className="mb-2 text-xs font-medium text-[#94A3B8]">Agent Registry &gt; <span className="text-white">Invoice Validation Agent</span></div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[30px] font-semibold leading-tight text-white">Invoice Validation Agent</h1>
              <StatusBadge value="Active" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
              <StatusBadge value="Azure AI Foundry" />
              <StatusBadge value="Pro-code" />
              <StatusBadge value="Production" />
              <span>Owner: Amit Kapoor (IT Ops)</span>
            </div>
            <p className="mt-2 max-w-4xl text-[13px] text-[#94A3B8]">
              Validates and extracts invoice data, checks compliance and business rules, and routes for approval.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => runLocalAction("Run Agent")}><Play className="h-4 w-4" />Run Agent</Button>
            <Button onClick={() => runLocalAction("View Live Runs")}><SlidersHorizontal className="h-4 w-4" />View Live Runs</Button>
            <Button onClick={() => runLocalAction("More Actions")}>More Actions</Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {[["Risk Level", "Medium"], ["Policy Status", "Allowed"], ["Last Used", "2 mins ago"], ["Total Runs (30d)", "1,248"]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#162131] bg-[#09111C] p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-[#94A3B8]">{label}</div>
              <div className="mt-2 text-lg font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
      </header>

      <DashboardTabs tabs={["Overview", "Runs", "Model & Prompt", "Tools & Connectors", "Security & Access", "Memory & State", "Evaluations", "Configuration", "Audit Trail"]} value={tab} onChange={setTab} />

      <div className="grid gap-3 2xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
            <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-white">Agent Health</h2>
                <span className="text-[11px] text-[#94A3B8]">Updated 2 mins ago</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                <MiniChart type="score" />
                <div className="space-y-2 pt-2">
                  {["All connections healthy", "No policy violations", "Guardrails enabled", "Evaluation score: 0.91", "No pending approvals"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-[#DCE5F2]">
                      <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
              <h2 className="mb-3 text-[15px] font-semibold text-white">Recent Activity (Last 7 Days)</h2>
              <div className="grid gap-2 md:grid-cols-4">
                {[
                  { label: "Runs", value: "1,248", icon: "Activity", accent: "purple" as const, trend: "12.5%" },
                  { label: "Success Rate", value: "85.7%", icon: "ShieldCheck", accent: "green" as const, trend: "8.3%" },
                  { label: "Avg Latency", value: "3.64s", icon: "Clock", accent: "orange" as const, trend: "6.7%", trendDirection: "down" as const },
                  { label: "Policy Violations", value: "3", icon: "ShieldAlert", accent: "red" as const, trend: "25%", trendDirection: "down" as const },
                  { label: "Tokens Used", value: "2.4M", icon: "Cpu", accent: "cyan" as const, trend: "15.8%" },
                  { label: "Estimated Cost", value: "$52.84", icon: "DollarSign", accent: "green" as const, trend: "14.2%" },
                  { label: "Tool Calls", value: "3,562", icon: "Network", accent: "blue" as const, trend: "11.1%" },
                  { label: "Human Escalations", value: "12", icon: "Users", accent: "orange" as const, trend: "14.3%", trendDirection: "down" as const }
                ].map((item) => (
                  <KpiCard key={item.label} kpi={item} />
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <InfoPanel title="Agent Information" rows={[["Agent ID", "inv-agent-1001"], ["Source", "Azure AI Foundry"], ["Type", "Pro-code"], ["Environment", "Production"], ["Created On", "May 20, 2024"], ["Owner", "Amit Kapoor"], ["Primary Model", "gpt-4o"], ["Prompt Version", "v2.3.1 (Approved)"]]} />
            <InfoPanel title="Risk & Policy Summary" rows={[["Risk Level", "Medium"], ["Risk Score", "62 / 100"], ["Top Risk Factors", "External connector, DB write"], ["Policy Status", "Allowed"], ["Guardrails", "3 policies applied"], ["Approval Required", "High-risk actions"], ["Human Review", "Not required"]]} />
          </div>

          <DataTable columns={runColumns} rows={agentDetailRows} selectedId={selected?.id} onSelect={setSelected} onRowAction={(label) => runLocalAction(label)} />
        </div>

        <aside className="space-y-3">
          <InfoPanel title="Model & Prompt" rows={[["Model", "gpt-4o"], ["Deployment", "gpt-4o-prod"], ["Prompt Version", "v2.3.1 (Approved)"], ["System Prompt", "Invoice Validation System Prompt v2.3.1"]]} action="View Prompt" onAction={runLocalAction} />
          <InfoPanel title="Tools & Connectors" rows={[["Total Tools", "4"], ["Active Connectors", "5"], ["External Connectors", "1"]]} action="View Tools & Connectors" onAction={runLocalAction} />
          <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-white">Agent Security</h2>
              <SecurityRiskBadge value="Medium" />
            </div>
            <SecurityScore score={92} compact />
            <div className="mt-4 grid gap-2 text-xs">
              {[
                ["Identity Risk", "Low"],
                ["Privilege Risk", "Medium"],
                ["Context Risk", "Low"],
                ["Memory Risk", "Low"],
                ["MCP Risk", "Medium"],
                ["Open Findings", "2"]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-[#94A3B8]">{label}</span>
                  {["Low", "Medium", "High", "Critical"].includes(value) ? (
                    <SecurityRiskBadge value={value} />
                  ) : (
                    <span className="font-medium text-white">{value}</span>
                  )}
                </div>
              ))}
            </div>
            <Button asChild className="mt-4 w-full" variant="secondary">
              <Link href="/security/identity-access">View Security Profile</Link>
            </Button>
          </section>
          <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-white">Evaluations (Last 7 Days)</h2>
            <MiniChart type="score" />
            <div className="mt-2 grid gap-2 text-xs">
              {["Correctness 0.93", "Grounding 0.90", "Faithfulness 0.89", "Safety 0.95"].map((item) => <StatusBadge key={item} value={item} />)}
            </div>
          </section>
          <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-white">Quick Actions</h2>
            <div className="grid gap-2">
              {["Edit Agent", "Clone Agent", "Export Configuration", "Deactivate Agent"].map((action) => (
                <Button key={action} variant={action.includes("Deactivate") ? "danger" : "secondary"} onClick={() => runLocalAction(action)}>
                  {action}
                </Button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[#24334A] bg-[#09111C] px-4 py-3 text-xs text-white shadow-xl">{toast}</div>}
    </AppShell>
  );
}

function InfoPanel({ title, rows, action, onAction }: { title: string; rows: string[][]; action?: string; onAction?: (label: string) => void }) {
  return (
    <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-white">{title}</h2>
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[#94A3B8]">{label}</span>
            <span className="max-w-[210px] truncate text-right font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
      {action && (
        <button onClick={() => onAction?.(action)} className="mt-4 flex items-center gap-1 text-xs font-medium text-[#A78BFA] hover:text-white">
          {action} <ExternalLink className="h-3 w-3" />
        </button>
      )}
    </section>
  );
}
