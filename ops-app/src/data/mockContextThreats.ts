import type { TableColumn, TableRow } from "@/types/dashboard";

export const contextThreatRows: TableRow[] = [
  { id: "ctx-prompt-injection", name: "Prompt Injection Attempt", agent: "Research Agent", vector: "Retrieved Document", contextLayer: "RAG Context", control: "Instruction boundary", signal: "Policy override phrase", confidence: "97%", risk: "High", status: "Contained", time: "4 mins ago", progress: 91, description: "Retrieved document contained instructions that attempted to override the system task." },
  { id: "ctx-data-exfil", name: "Data Exfiltration Request", agent: "Customer Support Agent", vector: "User Message", contextLayer: "Conversation", control: "DLP + intent gate", signal: "Bulk PII request", confidence: "95%", risk: "High", status: "Blocked", time: "7 mins ago", progress: 88, description: "User asked the agent to reveal customer records beyond the active ticket." },
  { id: "ctx-agent-spoof", name: "Agent Data Injection", agent: "Invoice Validation Agent", vector: "Attachment Metadata", contextLayer: "Document Context", control: "Source verification", signal: "Spoofed approval note", confidence: "93%", risk: "Medium", status: "Open", time: "16 mins ago", progress: 78, description: "Attachment metadata included an unverified approval claim." },
  { id: "ctx-tool-context", name: "Tool Output Confusion", agent: "Finance Approval Agent", vector: "Tool Result", contextLayer: "Tool Context", control: "Schema validation", signal: "Unexpected instruction field", confidence: "98%", risk: "Critical", status: "Contained", time: "19 mins ago", progress: 84, description: "Tool result included a field resembling follow-on agent instructions." }
];

export const contextThreatColumns: TableColumn[] = [
  { key: "name", label: "Threat", type: "entity", sortable: true, width: "260px" },
  { key: "agent", label: "Agent", type: "text", sortable: true },
  { key: "vector", label: "Vector", type: "badge" },
  { key: "contextLayer", label: "Context Layer", type: "text" },
  { key: "control", label: "Control", type: "text" },
  { key: "signal", label: "Signal", type: "text" },
  { key: "confidence", label: "Confidence", type: "text", sortable: true },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "status", label: "Status", type: "status", sortable: true },
  { key: "time", label: "Time", type: "text", sortable: true },
  { key: "actions", label: "Actions", type: "actions" }
];
