import type { TableColumn, TableRow } from "@/types/dashboard";

export const securityIncidentRows: TableRow[] = [
  { id: "inc-2026-0042", name: "Unauthorized Tool Execution Blocked", severity: "Critical", agent: "Finance Approval Agent", affectedArea: "MCP Tooling", stage: "Containment", owner: "Rahul Verma", status: "Contained", opened: "Aug 17, 2026 09:12", sla: "14m left", risk: "Critical", progress: 82, description: "Refund execution was blocked because approval context was missing." },
  { id: "inc-2026-0041", name: "Memory Poisoning Attempt", severity: "High", agent: "Customer Support Agent", affectedArea: "Memory", stage: "Eradication", owner: "Neha Sharma", status: "Contained", opened: "Aug 17, 2026 08:45", sla: "42m left", risk: "High", progress: 76, description: "Persistent memory write was quarantined and linked to an external user message." },
  { id: "inc-2026-0040", name: "Prompt Injection in Retrieved Context", severity: "High", agent: "Research Agent", affectedArea: "Context", stage: "Review", owner: "Amit Kapoor", status: "Open", opened: "Aug 17, 2026 08:22", sla: "1h 5m left", risk: "High", progress: 68, description: "Retrieved context attempted to change answer constraints." },
  { id: "inc-2026-0039", name: "Excess Privilege Finding", severity: "Medium", agent: "Invoice Validation Agent", affectedArea: "Identity", stage: "Remediation", owner: "Priya Nair", status: "Open", opened: "Aug 16, 2026 18:10", sla: "6h left", risk: "Medium", progress: 58, description: "Unused vendor read permission needs removal from agent identity." }
];

export const securityIncidentColumns: TableColumn[] = [
  { key: "name", label: "Incident", type: "entity", sortable: true, width: "280px" },
  { key: "severity", label: "Severity", type: "risk", sortable: true },
  { key: "agent", label: "Agent", type: "text", sortable: true },
  { key: "affectedArea", label: "Area", type: "badge", sortable: true },
  { key: "stage", label: "Stage", type: "status" },
  { key: "owner", label: "Owner", type: "text" },
  { key: "status", label: "Status", type: "status", sortable: true },
  { key: "opened", label: "Opened", type: "text", sortable: true },
  { key: "sla", label: "SLA", type: "text" },
  { key: "actions", label: "Actions", type: "actions" }
];

export const incidentTimeline = [
  "Signal correlated across MCP authorization, agent run, and approval logs.",
  "Policy engine blocked execution and isolated tool lease.",
  "Security owner assigned with response playbook attached.",
  "Remediation task queued for least-privilege permission review."
];
