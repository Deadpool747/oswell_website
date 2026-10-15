import type { TableColumn, TableRow } from "@/types/dashboard";

export const agentIdentitySeeds: TableRow[] = [
  { id: "ident-invoice", name: "Invoice Validation Agent", identity: "agent-invoice-prod", authentication: "OAuth 2.0", privilegeLevel: "Restricted", resources: "3 Resources", tokenTtl: "15 min", delegatedBy: "Finance Service", environment: "Production", risk: "Low", lastUsed: "2 mins ago", status: "Active", progress: 94, description: "Least-privilege identity for invoice read and validation workflows." },
  { id: "ident-support", name: "Customer Support Agent", identity: "agent-support-prod", authentication: "OIDC", privilegeLevel: "Standard", resources: "7 Resources", tokenTtl: "30 min", delegatedBy: "Support Platform", environment: "Production", risk: "Medium", lastUsed: "5 mins ago", status: "Active", progress: 86, description: "Delegated support identity with ticket, CRM, and memory access." },
  { id: "ident-finance", name: "Finance Approval Agent", identity: "agent-finance-approve", authentication: "OAuth 2.0", privilegeLevel: "Elevated", resources: "11 Resources", tokenTtl: "4 hours", delegatedBy: "Finance Platform", environment: "Production", risk: "High", lastUsed: "1 min ago", status: "Review Required", progress: 72, description: "Elevated approval identity under least-privilege review." },
  { id: "ident-research", name: "Research Agent", identity: "agent-research-prod", authentication: "OIDC", privilegeLevel: "Restricted", resources: "5 Resources", tokenTtl: "20 min", delegatedBy: "Knowledge Gateway", environment: "Production", risk: "Low", lastUsed: "9 mins ago", status: "Active", progress: 91, description: "Read-only identity for approved retrieval and summarization." }
];

export const agentIdentityColumns: TableColumn[] = [
  { key: "name", label: "Agent", type: "entity", sortable: true, width: "260px" },
  { key: "identity", label: "Identity", type: "text", sortable: true },
  { key: "authentication", label: "Authentication", type: "badge" },
  { key: "privilegeLevel", label: "Privilege Level", type: "badge", sortable: true },
  { key: "resources", label: "Resources", type: "text" },
  { key: "tokenTtl", label: "Token TTL", type: "text", sortable: true },
  { key: "delegatedBy", label: "Delegated By", type: "text" },
  { key: "environment", label: "Environment", type: "environment" },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "lastUsed", label: "Last Used", type: "text", sortable: true },
  { key: "status", label: "Status", type: "status" },
  { key: "actions", label: "Actions", type: "actions" }
];
