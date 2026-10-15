import type { TableColumn, TableRow } from "@/types/dashboard";

export const mcpServerRows: TableRow[] = [
  { id: "mcp-finance", name: "Finance MCP Server", description: "Invoices, payment status, and approval tools.", trustTier: "Restricted", authentication: "mTLS + OIDC", tools: "8 Tools", egress: "Private network", policy: "Approval gated", anomalies: "1", environment: "Production", risk: "Medium", status: "Active", progress: 88 },
  { id: "mcp-email", name: "Email MCP Server", description: "Draft, classify, and send email actions.", trustTier: "Conditional", authentication: "OIDC", tools: "6 Tools", egress: "Allowlisted domains", policy: "Human approval send", anomalies: "0", environment: "Production", risk: "Medium", status: "Active", progress: 86 },
  { id: "mcp-browser", name: "Browser Automation MCP", description: "Read-only browser inspection and screenshot capture.", trustTier: "Sandboxed", authentication: "Session broker", tools: "4 Tools", egress: "Browser sandbox", policy: "Read-only", anomalies: "0", environment: "Staging", risk: "Low", status: "Trusted", progress: 94 },
  { id: "mcp-legacy", name: "Legacy ERP MCP", description: "Legacy purchase-order and vendor lookup tools.", trustTier: "Review Required", authentication: "Static credential broker", tools: "5 Tools", egress: "Vendor VPN", policy: "Quarantine pending", anomalies: "3", environment: "Production", risk: "High", status: "Review Required", progress: 61 }
];

export const mcpServerColumns: TableColumn[] = [
  { key: "name", label: "MCP Server", type: "entity", sortable: true, width: "280px" },
  { key: "trustTier", label: "Trust Tier", type: "status", sortable: true },
  { key: "authentication", label: "Auth", type: "badge" },
  { key: "tools", label: "Tools", type: "text" },
  { key: "egress", label: "Egress", type: "text" },
  { key: "policy", label: "Policy", type: "text" },
  { key: "anomalies", label: "Anomalies", type: "text", sortable: true },
  { key: "environment", label: "Environment", type: "environment" },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "status", label: "Status", type: "status" },
  { key: "actions", label: "Actions", type: "actions" }
];

export const mcpTrustPosture = [
  { name: "Trusted", value: 42, color: "#10B981" },
  { name: "Sandboxed", value: 28, color: "#3B82F6" },
  { name: "Conditional", value: 19, color: "#F59E0B" },
  { name: "Review", value: 11, color: "#EF4444" }
];
