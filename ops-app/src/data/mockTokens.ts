import type { TableColumn, TableRow } from "@/types/dashboard";

export const tokenRows: TableRow[] = [
  { id: "tok-invoice-session", name: "Invoice Agent Session Token", agent: "Invoice Validation Agent", tokenType: "Ephemeral", ttl: "15 min", age: "3 min", scope: "invoice.read", storage: "In-memory only", rotation: "Automatic", risk: "Low", status: "Active", progress: 94, description: "Short-lived session lease for invoice validation workflows." },
  { id: "tok-support-delegated", name: "Support Delegated OAuth", agent: "Customer Support Agent", tokenType: "Delegated", ttl: "30 min", age: "18 min", scope: "ticket.read, ticket.comment", storage: "Vault broker", rotation: "Automatic", risk: "Medium", status: "Active", progress: 86, description: "Delegated access token brokered through policy-controlled support flows." },
  { id: "tok-finance-approval", name: "Finance Approval Lease", agent: "Finance Approval Agent", tokenType: "Approval Lease", ttl: "10 min", age: "9 min", scope: "refund.approval", storage: "Vault broker", rotation: "On approval", risk: "High", status: "Review Required", progress: 68, description: "Lease is close to expiry and tied to a high-impact approval action." },
  { id: "tok-research-read", name: "Research Retrieval Token", agent: "Research Agent", tokenType: "Ephemeral", ttl: "20 min", age: "5 min", scope: "knowledge.read", storage: "In-memory only", rotation: "Automatic", risk: "Low", status: "Active", progress: 92, description: "Read-only retrieval token constrained to approved knowledge sources." }
];

export const tokenColumns: TableColumn[] = [
  { key: "name", label: "Token / Lease", type: "entity", sortable: true, width: "260px" },
  { key: "agent", label: "Agent", type: "text", sortable: true },
  { key: "tokenType", label: "Type", type: "badge" },
  { key: "ttl", label: "TTL", type: "text", sortable: true },
  { key: "age", label: "Age", type: "text" },
  { key: "scope", label: "Scope", type: "text" },
  { key: "storage", label: "Storage", type: "badge" },
  { key: "rotation", label: "Rotation", type: "text" },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "status", label: "Status", type: "status" },
  { key: "actions", label: "Actions", type: "actions" }
];
