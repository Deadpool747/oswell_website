import type { TableColumn, TableRow } from "@/types/dashboard";

export const memoryThreatRows: TableRow[] = [
  { id: "mem-poison-profile", name: "Profile Memory Poisoning", agent: "Customer Support Agent", store: "User Profile Memory", provenance: "External Message", containment: "Write blocked", retention: "Not persisted", confidence: "99%", risk: "Critical", status: "Contained", time: "6 mins ago", progress: 90, description: "Attempted persistent preference conflicted with verified account profile state." },
  { id: "mem-shared-taint", name: "Shared Memory Taint", agent: "Multi-Agent Planner", store: "Shared Planning Memory", provenance: "Untrusted Tool Output", containment: "Quarantined", retention: "24h review", confidence: "94%", risk: "High", status: "Quarantined", time: "11 mins ago", progress: 72, description: "Untrusted tool output tried to write reusable cross-agent instructions." },
  { id: "mem-stale-context", name: "Stale Sensitive Recall", agent: "Invoice Validation Agent", store: "Conversation Memory", provenance: "Archived Run", containment: "Redacted", retention: "Expired", confidence: "92%", risk: "Medium", status: "Open", time: "22 mins ago", progress: 79, description: "Expired sensitive field surfaced in a recall candidate and was redacted." },
  { id: "mem-good-provenance", name: "Verified Memory Write", agent: "Research Agent", store: "Research Preferences", provenance: "Verified Admin", containment: "Allowed", retention: "90 days", confidence: "98%", risk: "Low", status: "Trusted", time: "31 mins ago", progress: 96, description: "Memory write passed source, scope, and retention checks." }
];

export const memoryThreatColumns: TableColumn[] = [
  { key: "name", label: "Memory Signal", type: "entity", sortable: true, width: "260px" },
  { key: "agent", label: "Agent", type: "text", sortable: true },
  { key: "store", label: "Store", type: "text" },
  { key: "provenance", label: "Provenance", type: "badge" },
  { key: "containment", label: "Containment", type: "status" },
  { key: "retention", label: "Retention", type: "text" },
  { key: "confidence", label: "Confidence", type: "text", sortable: true },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "status", label: "Status", type: "status" },
  { key: "time", label: "Time", type: "text", sortable: true },
  { key: "actions", label: "Actions", type: "actions" }
];
