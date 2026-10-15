"use client";

import { X } from "lucide-react";
import { StatusBadge } from "@/components/badges/status-badge";
import { Button } from "@/components/ui/button";
import { MiniChart } from "@/components/charts/dashboard-chart";
import type { DashboardConfig, TableRow } from "@/types/dashboard";

type EntityDetailsPanelProps = {
  config: DashboardConfig;
  selected?: TableRow;
  open: boolean;
  onClose: () => void;
  onAction: (label: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

export function EntityDetailsPanel({ config, selected, open, onClose, onAction, activeTab, onTabChange }: EntityDetailsPanelProps) {
  if (!open) return null;

  if (!selected) {
    return (
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[360px] overflow-y-auto border-l border-[#162131] bg-[#07101B] p-3 shadow-2xl shadow-black/40 xl:static xl:max-h-[calc(100vh-32px)] xl:w-[330px] xl:shrink-0 xl:rounded-lg xl:border xl:shadow-none">
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[#162131] bg-[#09111C] p-3">
          <div>
            <div className="text-[15px] font-semibold text-white">No record selected</div>
            <p className="mt-1 text-[12px] leading-5 text-[#94A3B8]">Select a record from the table to view backend-provided details.</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#94A3B8] hover:bg-[#162131] hover:text-white" aria-label="Close details panel">
            <X className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  const title = selected.name ?? selected.id;
  const status = selected.status;
  const currentTab = activeTab ?? config.details.tabs?.[0] ?? "Overview";
  const baseSections = buildSelectedSections(config, selected);
  const visibleSections = getVisibleSections(baseSections, currentTab);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[360px] overflow-y-auto border-l border-[#162131] bg-[#07101B] p-3 shadow-2xl shadow-black/40 xl:static xl:max-h-[calc(100vh-32px)] xl:w-[330px] xl:shrink-0 xl:rounded-lg xl:border xl:shadow-none">
      <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-[#162131] bg-[#09111C] p-3">
        <div className="min-w-0">
          {config.details.eyebrow && <div className="text-[10px] uppercase tracking-[0.1em] text-[#94A3B8]">{config.details.eyebrow}</div>}
          <div className="truncate text-[15px] font-semibold text-white">{title}</div>
          {status && <StatusBadge value={status} className="mt-2" />}
        </div>
        <button onClick={onClose} className="rounded p-1 text-[#94A3B8] hover:bg-[#162131] hover:text-white" aria-label="Close details panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      {config.details.tabs && (
        <div className="mb-3 flex gap-4 overflow-x-auto border-b border-[#162131]">
          {config.details.tabs.map((tab, index) => (
            <button key={`${tab}-${index}`} onClick={() => onTabChange?.(tab)} className={`relative h-8 shrink-0 text-[11px] ${currentTab === tab ? "text-[#C4B5FD]" : "text-[#94A3B8]"}`}>
              {tab}
              {currentTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#7C5CFF]" />}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visibleSections.map((section, sectionIndex) => (
          <section key={`${section.title}-${sectionIndex}`} className="rounded-lg border border-[#162131] bg-[#09111C] p-3">
            <h3 className="mb-3 text-[13px] font-semibold text-white">{section.title}</h3>
            {section.text && <p className="mb-3 text-[12px] leading-5 text-[#B6C2D2]">{section.text}</p>}
            {section.chart && <MiniChart type={section.chart} />}
            {section.rows && (
              <div className="space-y-2">
                {section.rows.map((row, rowIndex) => (
                  <div key={`${row.label}-${rowIndex}`} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-[#94A3B8]">{row.label}</span>
                    <span className="max-w-[175px] truncate text-right font-medium text-white">
                      {row.tone ? <StatusBadge value={row.value} /> : row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {section.actions && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {section.actions.map((action, actionIndex) => (
                  <Button key={`${action}-${actionIndex}`} size="sm" variant={action.toLowerCase().includes("delete") || action.toLowerCase().includes("deactivate") || action.toLowerCase().includes("reject") ? "danger" : "secondary"} onClick={() => onAction(action)}>
                    {action}
                  </Button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}

function getVisibleSections(sections: DashboardConfig["details"]["sections"], activeTab: string) {
  const matches = sections.filter((section) => sectionMatchesTab(section, activeTab));
  return matches.length ? matches : sections;
}

function sectionMatchesTab(section: DashboardConfig["details"]["sections"][number], activeTab: string) {
  const tab = normalizeText(activeTab);
  if (!tab || tab === "overview") return true;
  const haystack = [section.title, section.text, ...(section.rows ?? []).flatMap((row) => [row.label, row.value]), ...(section.actions ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/prompt/.test(tab)) return /prompt|input|request|conversation|replay/.test(haystack);
  if (/cost/.test(tab)) return /cost|token|invoice|tax|billing|charge|spend|latency/.test(haystack);
  if (/policy|audit/.test(tab)) return /policy|audit|risk|violation|guardrail|approval|compliance/.test(haystack);
  return haystack.includes(tab);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function buildSelectedSections(config: DashboardConfig, row: TableRow): DashboardConfig["details"]["sections"] {
  if (config.title === "Live Runs") {
    return [
      {
        title: "Execution Summary",
        rows: [
          { label: "Run ID", value: String(row.id) },
          { label: "Agent", value: String(row.agent ?? row.name ?? "Unknown") },
          { label: "Environment", value: String(row.environment ?? "Production"), tone: "green" },
          { label: "Status", value: String(row.status ?? "Unknown"), tone: mapTone(row.status) }
        ]
      },
      {
        title: "Prompt & Response",
        text: typeof row.output === "string" && row.output.trim()
          ? `Prompt: ${String(row.input ?? row.description ?? "")}\n\nResponse: ${row.output}`
          : String(row.input ?? row.description ?? "No prompt or response stored for this run yet.")
      },
      {
        title: "Model & Cost",
        rows: [
          { label: "Model", value: String(row.model ?? "--") },
          { label: "Total Tokens", value: String(row.tokens ?? "--") },
          { label: "Duration", value: String(row.duration ?? "--") },
          { label: "Cost", value: String(row.cost ?? "--") }
        ]
      },
      {
        title: "Tools & Connectors",
        rows: [
          { label: "Connector", value: String(row.source ?? row.connectorId ?? "Unassigned") },
          { label: "Provider", value: String(row.connectorProvider ?? row.provider ?? "Unknown") },
          { label: "Policy", value: String(row.policy ?? "Unknown") }
        ],
        actions: Array.isArray(row.tools) && row.tools.length ? row.tools.map((tool) => String(tool)) : ["Audit Log"]
      },
      {
        title: "Guardrails & Policy",
        rows: [
          { label: "Risk", value: String(row.risk ?? "Unknown"), tone: mapTone(row.risk) },
          { label: "Confidence", value: String(row.confidence ?? "--") },
          { label: "Last Updated", value: String(row.lastUpdated ?? row.time ?? "Just now") }
        ]
      }
    ];
  }

  if (config.title === "Connector & MCP Governance") {
    return [
      {
        title: "Connector Summary",
        text: String(row.description ?? "No connector description recorded."),
        rows: [
          { label: "Connector", value: String(row.name ?? row.id) },
          { label: "Provider", value: String(row.provider ?? row.type ?? "Unknown") },
          { label: "Environment", value: String(row.environment ?? "Production"), tone: "green" },
          { label: "Status", value: String(row.status ?? "Unknown"), tone: mapTone(row.status) }
        ]
      },
      {
        title: "Configuration",
        rows: [
          { label: "Endpoint", value: String(row.endpoint ?? row.apiBase ?? "--") },
          { label: "Deployment / Model", value: String(row.deployment ?? row.model ?? "--") },
          { label: "Authentication", value: String(row.authentication ?? "--") },
          { label: "Permissions", value: String(row.permissions ?? "--") }
        ]
      },
      {
        title: "Health & Activity",
        rows: [
          { label: "Health", value: String(row.health ?? "--"), tone: mapTone(row.health) },
          { label: "Latency", value: String(row.latency ?? "--") },
          { label: "Last Tested", value: String(row.lastTested ?? row.lastUpdated ?? row.time ?? "--") },
          { label: "Risk", value: String(row.risk ?? "--"), tone: mapTone(row.risk) }
        ]
      },
      {
        title: "Quick Actions",
        actions: ["Edit Connector", "Test Connection", "Deactivate Connector"]
      }
    ];
  }

  if (config.title === "Agent Registry") {
    return [
      {
        title: "Agent Summary",
        text: String(row.description ?? "No agent description recorded."),
        rows: [
          { label: "Agent", value: String(row.name ?? row.id) },
          { label: "Type", value: String(row.type ?? "--") },
          { label: "Capability", value: String(row.capability ?? "--") },
          { label: "Environment", value: String(row.environment ?? "Production"), tone: "green" }
        ]
      },
      {
        title: "Runtime Binding",
        rows: [
          { label: "Connector ID", value: String(row.connectorId ?? "--") },
          { label: "Provider", value: String(row.provider ?? "--") },
          { label: "Version", value: String(row.version ?? "--") },
          { label: "Status", value: String(row.status ?? "--"), tone: mapTone(row.status) }
        ]
      },
      {
        title: "Health & Usage",
        rows: [
          { label: "Health", value: String(row.health ?? "--"), tone: mapTone(row.health) },
          { label: "Risk", value: String(row.risk ?? "--"), tone: mapTone(row.risk) },
          { label: "Progress", value: `${String(row.progress ?? "--")}${typeof row.progress === "number" ? "%" : ""}` },
          { label: "Last Updated", value: String(row.lastUpdated ?? row.time ?? "--") }
        ]
      },
      {
        title: "Quick Actions",
        actions: ["Edit Agent", "Run Agent", "View Activity Logs", "Deactivate Agent"]
      }
    ];
  }

  return config.details.sections;
}

function mapTone(value: TableRow[string]) {
  const text = String(value ?? "").toLowerCase();
  if (/(active|healthy|allowed|completed|passed|ready|valid|low)/.test(text)) return "green";
  if (/(warning|pending|medium|review)/.test(text)) return "orange";
  if (/(failed|blocked|high|inactive|rejected|missing|degraded|not connected|unavailable|not configured)/.test(text)) return "red";
  return undefined;
}
