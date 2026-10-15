import type { TableColumn, TableRow } from "@/types/dashboard";

export const permissionRows: TableRow[] = [
  { id: "perm-finance-read", name: "Finance DB Read", agent: "Invoice Validation Agent", resource: "finance.invoices", currentScope: "read:invoice, read:vendor", recommendedScope: "read:invoice", unusedScope: "read:vendor", blastRadius: "Department", risk: "Medium", status: "Recommended", progress: 82, description: "Vendor read scope is unused in the last 30 days." },
  { id: "perm-refund-write", name: "Refund Execution", agent: "Finance Approval Agent", resource: "payments.refund.execute", currentScope: "execute:refund", recommendedScope: "approval-gated execute", unusedScope: "None", blastRadius: "Customer Funds", risk: "High", status: "Review Required", progress: 64, description: "Execution scope requires stronger approval context before tool use." },
  { id: "perm-ticket-update", name: "Ticket Update", agent: "Customer Support Agent", resource: "support.tickets", currentScope: "read, comment, update", recommendedScope: "read, comment", unusedScope: "update", blastRadius: "Customer Data", risk: "Medium", status: "Recommended", progress: 76, description: "Update permission is only needed for escalated workflows." },
  { id: "perm-knowledge-read", name: "Knowledge Retrieval", agent: "Research Agent", resource: "knowledge.approved", currentScope: "read:approved", recommendedScope: "read:approved", unusedScope: "None", blastRadius: "Public/Internal Docs", risk: "Low", status: "Compliant", progress: 96, description: "Read-only scope matches the current agent workflow." }
];

export const permissionColumns: TableColumn[] = [
  { key: "name", label: "Permission", type: "entity", sortable: true, width: "260px" },
  { key: "agent", label: "Agent", type: "text", sortable: true },
  { key: "resource", label: "Resource", type: "text" },
  { key: "currentScope", label: "Current Scope", type: "text" },
  { key: "recommendedScope", label: "Recommended Scope", type: "text" },
  { key: "unusedScope", label: "Unused Scope", type: "badge" },
  { key: "blastRadius", label: "Blast Radius", type: "text" },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "status", label: "Status", type: "status", sortable: true },
  { key: "actions", label: "Actions", type: "actions" }
];

export const permissionRecommendations = [
  "Reduce Finance DB vendor read from the invoice agent profile.",
  "Require human approval context before refund.execute is available.",
  "Move ticket update permission behind an escalation-only role.",
  "Keep research retrieval pinned to approved corpora only."
];
