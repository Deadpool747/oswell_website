import type { TableColumn, TableRow } from "@/types/dashboard";

export const toolSecurityRows: TableRow[] = [
  { id: "tool-invoice-read", name: "invoice.lookup", mcpServer: "Finance MCP Server", category: "Read", agentAccess: "6 Agents", approval: "Not required", isolation: "Server scoped", dataAccess: "Confidential", lastCalled: "2 mins ago", risk: "Low", status: "Enabled", progress: 95, description: "Read-only invoice lookup constrained by tenant and agent identity." },
  { id: "tool-refund-execute", name: "refund.execute", mcpServer: "Finance MCP Server", category: "Write", agentAccess: "2 Agents", approval: "Required", isolation: "Approval lease", dataAccess: "Restricted", lastCalled: "8 mins ago", risk: "Critical", status: "Conditional", progress: 66, description: "High-impact financial tool guarded by approval and lease controls." },
  { id: "tool-email-send", name: "email.send", mcpServer: "Email MCP Server", category: "External Action", agentAccess: "5 Agents", approval: "Required external", isolation: "Domain allowlist", dataAccess: "Customer", lastCalled: "14 mins ago", risk: "High", status: "Conditional", progress: 74, description: "Outbound action requires destination, purpose, and content policy checks." },
  { id: "tool-crm-export", name: "crm.export", mcpServer: "CRM Connector", category: "Export", agentAccess: "1 Agent", approval: "Required", isolation: "Quarantined", dataAccess: "Customer PII", lastCalled: "2 hours ago", risk: "High", status: "Quarantined", progress: 58, description: "Export tool quarantined until least-privilege review is complete." }
];

export const toolSecurityColumns: TableColumn[] = [
  { key: "name", label: "Tool", type: "entity", sortable: true, width: "240px" },
  { key: "mcpServer", label: "Server", type: "text" },
  { key: "category", label: "Category", type: "badge" },
  { key: "agentAccess", label: "Agent Access", type: "text" },
  { key: "approval", label: "Approval", type: "status" },
  { key: "isolation", label: "Isolation", type: "text" },
  { key: "dataAccess", label: "Data Access", type: "badge" },
  { key: "lastCalled", label: "Last Called", type: "text", sortable: true },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "status", label: "Status", type: "status" },
  { key: "actions", label: "Actions", type: "actions" }
];
