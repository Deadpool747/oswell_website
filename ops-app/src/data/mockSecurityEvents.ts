import type { TableRow } from "@/types/dashboard";

export const securityEventSeeds: TableRow[] = [
  { id: "SEC-2026-00831", name: "SEC-2026-00831", time: "2 mins ago", agent: "Invoice Validation Agent", threat: "Excess Privilege", source: "Finance Database", target: "Write Permission", severity: "High", action: "Recommended", confidence: "96%", status: "Open", risk: "High", environment: "Production", description: "Agent has write access although recent workflow activity only requires read scope." },
  { id: "SEC-2026-00832", name: "SEC-2026-00832", time: "4 mins ago", agent: "Research Agent", threat: "Context Manipulation", source: "Retrieved Document", target: "Agent Context", severity: "High", action: "Blocked", confidence: "97%", status: "Contained", risk: "High", environment: "Production", description: "Retrieved content attempted to alter agent instructions during answer generation." },
  { id: "SEC-2026-00833", name: "SEC-2026-00833", time: "6 mins ago", agent: "Customer Support Agent", threat: "Memory Poisoning", source: "External Message", target: "Conversation Memory", severity: "Critical", action: "Blocked", confidence: "99%", status: "Contained", risk: "Critical", environment: "Production", description: "External user attempted to create a persistent memory conflicting with verified profile state." },
  { id: "SEC-2026-00834", name: "SEC-2026-00834", time: "8 mins ago", agent: "Finance Agent", threat: "Unauthorized Tool Call", source: "MCP Finance Server", target: "refund.execute", severity: "Critical", action: "Blocked", confidence: "99%", status: "Contained", risk: "Critical", environment: "Production", description: "Tool authorization policy blocked a refund execution attempt without approval context." },
  { id: "SEC-2026-00835", name: "SEC-2026-00835", time: "12 mins ago", agent: "Sales Email Assistant", threat: "Credential Risk", source: "OAuth Delegation", target: "CRM Export Scope", severity: "Medium", action: "Review", confidence: "91%", status: "Open", risk: "Medium", environment: "Production", description: "Delegated scope allows export capability that has not been used by the current workflow." }
];

export const securityEventColumns = [
  { key: "time", label: "Time", type: "text" as const, sortable: true },
  { key: "agent", label: "Agent", type: "text" as const, sortable: true },
  { key: "threat", label: "Threat", type: "badge" as const, sortable: true },
  { key: "source", label: "Source", type: "text" as const },
  { key: "target", label: "Target", type: "text" as const },
  { key: "severity", label: "Severity", type: "risk" as const, sortable: true },
  { key: "action", label: "Action", type: "status" as const },
  { key: "confidence", label: "Confidence", type: "text" as const, sortable: true },
  { key: "status", label: "Status", type: "status" as const, sortable: true },
  { key: "actions", label: "Actions", type: "actions" as const }
];
