import type { DashboardConfig } from "@/types/dashboard";
import { kpi, makeRows } from "@/data/common";
import { agentIdentityColumns, agentIdentitySeeds } from "@/data/mockAgentIdentities";
import { contextThreatColumns, contextThreatRows } from "@/data/mockContextThreats";
import { incidentTimeline, securityIncidentColumns, securityIncidentRows } from "@/data/mockSecurityIncidents";
import { mcpServerColumns, mcpServerRows, mcpTrustPosture } from "@/data/mockMcpSecurity";
import { memoryThreatColumns, memoryThreatRows } from "@/data/mockMemoryThreats";
import { permissionColumns, permissionRecommendations, permissionRows } from "@/data/mockPermissions";
import { securityEventColumns, securityEventSeeds } from "@/data/mockSecurityEvents";
import { tokenColumns, tokenRows } from "@/data/mockTokens";
import { toolSecurityColumns, toolSecurityRows } from "@/data/mockToolSecurity";

const securityTrend = [
  { name: "Aug 11", score: 87, incidents: 9, contained: 6 },
  { name: "Aug 12", score: 89, incidents: 7, contained: 5 },
  { name: "Aug 13", score: 88, incidents: 8, contained: 7 },
  { name: "Aug 14", score: 91, incidents: 5, contained: 4 },
  { name: "Aug 15", score: 92, incidents: 4, contained: 4 },
  { name: "Aug 16", score: 90, incidents: 6, contained: 5 },
  { name: "Aug 17", score: 93, incidents: 5, contained: 4 }
];

const securityDomains = [
  { name: "Identity", value: 92 },
  { name: "MCP Tools", value: 84 },
  { name: "Context", value: 89 },
  { name: "Memory", value: 86 },
  { name: "Incidents", value: 91 }
];

const threatMix = [
  { name: "Tool Abuse", value: 29, color: "#EF4444" },
  { name: "Context Injection", value: 24, color: "#F59E0B" },
  { name: "Excess Privilege", value: 21, color: "#6D4AFF" },
  { name: "Memory Risk", value: 15, color: "#3B82F6" },
  { name: "Credential Risk", value: 11, color: "#94A3B8" }
];

export const securityPages: Record<string, DashboardConfig> = {
  security: {
    title: "AI Security Center",
    subtitle: "Unified security posture for agent identity, permissions, MCP tools, context, memory, and incident response.",
    actionLabel: "Run Security Review",
    searchPlaceholder: "Search security events, agents, tools...",
    kpis: [
      kpi("Security Score", "93%", "ShieldCheck", "green", "4 pp vs last week"),
      kpi("Open Critical", "2", "TriangleAlert", "red", "1 contained", "down"),
      kpi("Risky Tool Calls", "18", "Network", "orange", "22% vs yesterday", "down"),
      kpi("Excess Privileges", "7", "UserRoundCheck", "orange", "3 recommended"),
      kpi("Memory Quarantines", "4", "DatabaseZap", "blue", "2 resolved"),
      kpi("Mean Response", "11m", "Clock", "green", "3m faster")
    ],
    tabs: ["Overview", "Threats", "Identity", "MCP Tools", "Context", "Memory", "Incidents"],
    filters: [
      { label: "Severity", options: ["All Severities", "Critical", "High", "Medium", "Low"] },
      { label: "Status", options: ["All Statuses", "Open", "Contained", "Blocked"] },
      { label: "Environment", options: ["All Environments", "Production", "Staging"] }
    ],
    columns: securityEventColumns,
    rows: makeRows(securityEventSeeds, 45),
    charts: [
      { title: "Security Score Trend", type: "line", data: securityTrend, series: [{ key: "score", label: "Security Score", color: "#10B981" }], yDomain: [70, 100] },
      { title: "Threat Mix", type: "donut", data: threatMix },
      { title: "Security Domains", type: "bars", data: securityDomains }
    ],
    sideCards: [
      {
        title: "Security Architecture",
        text: "Every agent request is evaluated through identity, policy, tool authorization, context integrity, memory provenance, and incident correlation layers before action.",
        rows: [
          { label: "Control Plane", value: "Policy + Audit", tone: "green" },
          { label: "Data Plane", value: "Context + Memory Guards", tone: "green" },
          { label: "Tool Plane", value: "MCP Authorization", tone: "orange" }
        ],
        actions: ["View Architecture", "Export Posture"]
      },
      {
        title: "Top Recommended Fixes",
        text: permissionRecommendations.join("\n"),
        actions: ["Create Remediation Plan", "Assign Findings"]
      },
      {
        title: "Response Readiness",
        chart: "score",
        rows: [
          { label: "Playbooks Ready", value: "8 / 9", tone: "green" },
          { label: "Owner Coverage", value: "96%", tone: "green" },
          { label: "SLA Breaches", value: "0", tone: "green" }
        ]
      }
    ],
    details: {
      title: "Security Event",
      eyebrow: "AI Security",
      status: "Open",
      tabs: ["Summary", "Evidence", "Blast Radius", "Response"],
      sections: [
        { title: "Event Summary", text: "Security event correlated across agent run metadata, policy decisions, and tool authorization logs.", rows: [{ label: "Severity", value: "High", tone: "red" }, { label: "Confidence", value: "96%" }, { label: "Environment", value: "Production", tone: "green" }] },
        { title: "Affected Control Layers", actions: ["Identity", "MCP Tooling", "Context Integrity", "Audit Trail"] },
        { title: "Signal Trend", chart: "line" },
        { title: "Mock Response Actions", actions: ["Contain", "Assign Owner", "Create Finding", "Export Evidence"] }
      ]
    }
  },
  "identity-access": {
    title: "Agent Identity & Access",
    subtitle: "Review agent identities, token leases, delegated access, and least-privilege recommendations.",
    actionLabel: "Review Access",
    searchPlaceholder: "Search identities, permissions, scopes...",
    kpis: [
      kpi("Managed Identities", "128", "UserRoundCheck", "green", "12 new"),
      kpi("Least Privilege", "91%", "ShieldCheck", "green", "3 pp vs last week"),
      kpi("Elevated Agents", "7", "TriangleAlert", "orange", "3 under review"),
      kpi("Stale Scopes", "11", "KeyRound", "orange", "5 removable"),
      kpi("Token TTL Median", "18m", "Clock", "blue", "Healthy"),
      kpi("Approval Leases", "24", "LockKeyhole", "purple", "All active")
    ],
    tabs: ["Agent Identities", "Permissions", "Tokens", "Delegation", "Owners", "Audit"],
    filters: [
      { label: "Privilege", options: ["All Privileges", "Restricted", "Standard", "Elevated"] },
      { label: "Risk", options: ["All Risk Levels", "Low", "Medium", "High"] },
      { label: "Environment", options: ["All Environments", "Production", "Staging"] }
    ],
    columns: agentIdentityColumns,
    rows: makeRows(agentIdentitySeeds, 36),
    charts: [
      { title: "Least Privilege Coverage", type: "line", data: securityTrend, series: [{ key: "score", label: "Coverage", color: "#10B981" }], yDomain: [70, 100] },
      { title: "Permission Risk", type: "bars", data: [{ name: "Low", value: 82 }, { name: "Medium", value: 28 }, { name: "High", value: 7 }] }
    ],
    sideCards: [
      { title: "Permission Diff", text: "Compare current scopes against observed usage and recommended least-privilege access.", rows: [{ label: "Removable Scopes", value: "11", tone: "orange" }, { label: "Approval-Gated", value: "5", tone: "green" }], actions: ["Preview Permission Changes"] },
      { title: "Token Lease Posture", rows: [{ label: "Ephemeral Tokens", value: "91%", tone: "green" }, { label: "Long TTL Tokens", value: "3", tone: "orange" }, { label: "Vault Brokered", value: "100%", tone: "green" }], actions: ["Rotate Mock Tokens"] },
      { title: "Permission Recommendations", text: permissionRecommendations.join("\n") }
    ],
    details: {
      title: "Agent Identity",
      eyebrow: "Identity Security",
      status: "Active",
      tabs: ["Identity", "Permissions", "Tokens", "Audit"],
      sections: [
        { title: "Identity Summary", rows: [{ label: "Auth Method", value: "OIDC", tone: "green" }, { label: "Privilege", value: "Restricted", tone: "green" }, { label: "Token TTL", value: "15 min" }] },
        { title: "Least Privilege", chart: "score", rows: [{ label: "Unused Scopes", value: "1", tone: "orange" }, { label: "Blast Radius", value: "Department" }] },
        { title: "Mock Controls", actions: ["Preview Scope Reduction", "Require Approval Lease", "View Audit Trail"] }
      ]
    }
  },
  mcp: {
    title: "MCP & Tool Security",
    subtitle: "Secure MCP servers, tools, tool authorization, isolation boundaries, egress, and high-impact actions.",
    actionLabel: "Assess MCP Risk",
    searchPlaceholder: "Search MCP servers, tools, policies...",
    kpis: [
      kpi("MCP Servers", "14", "Network", "blue", "3 restricted"),
      kpi("High-Impact Tools", "9", "Wrench", "orange", "4 approval-gated"),
      kpi("Blocked Tool Calls", "18", "ShieldAlert", "red", "22% vs yesterday", "down"),
      kpi("Trusted Servers", "78%", "ShieldCheck", "green", "6 pp vs last week"),
      kpi("Egress Policies", "31", "LockKeyhole", "purple", "All enforced"),
      kpi("Tool Drift", "3", "TriangleAlert", "orange", "Needs review")
    ],
    tabs: ["MCP Servers", "Tools", "Authorization", "Isolation", "Egress", "Audit"],
    filters: [
      { label: "Trust Tier", options: ["All Trust Tiers", "Trusted", "Sandboxed", "Conditional", "Review Required"] },
      { label: "Risk", options: ["All Risk Levels", "Critical", "High", "Medium", "Low"] },
      { label: "Environment", options: ["All Environments", "Production", "Staging"] }
    ],
    columns: mcpServerColumns,
    rows: makeRows(mcpServerRows, 28),
    charts: [
      { title: "MCP Trust Posture", type: "donut", data: mcpTrustPosture },
      { title: "Tool Call Risk Trend", type: "line", data: securityTrend, series: [{ key: "incidents", label: "Risky Calls", color: "#F59E0B" }, { key: "contained", label: "Contained", color: "#10B981" }] }
    ],
    sideCards: [
      { title: "Tool Security Snapshot", rows: [{ label: "Critical Tools", value: "2", tone: "red" }, { label: "Approval Gated", value: "9", tone: "green" }, { label: "Quarantined", value: "1", tone: "orange" }], actions: ["Open Tool Inventory"] },
      { title: "Isolation Controls", text: "Mock view of server-scoped permissions, tool leases, allowlisted egress, and approval-gated external actions.", actions: ["Review Isolation", "Review Egress"] },
      { title: "High-Risk Tools", text: toolSecurityRows.map((tool) => `${tool.name}: ${tool.risk}`).join("\n") }
    ],
    details: {
      title: "MCP Server",
      eyebrow: "MCP Security",
      status: "Active",
      tabs: ["Server", "Tools", "Policies", "Audit"],
      sections: [
        { title: "Server Trust", rows: [{ label: "Trust Tier", value: "Restricted", tone: "orange" }, { label: "Authentication", value: "mTLS + OIDC" }, { label: "Egress", value: "Private network" }] },
        { title: "Tool Authorization", chart: "bars", rows: [{ label: "Approval-Gated Tools", value: "4", tone: "green" }, { label: "Critical Tools", value: "1", tone: "red" }] },
        { title: "Mock Controls", actions: ["Quarantine Server", "Review Tool Access", "Export Tool Audit"] }
      ]
    }
  },
  context: {
    title: "Context Security",
    subtitle: "Monitor prompt injection, agent data injection, retrieved context integrity, and tool output manipulation.",
    actionLabel: "Scan Context",
    searchPlaceholder: "Search context threats, vectors, agents...",
    kpis: [
      kpi("Context Score", "89%", "ScanSearch", "green", "5 pp vs last week"),
      kpi("Injection Blocks", "42", "ShieldAlert", "red", "18% vs yesterday", "down"),
      kpi("Trusted Sources", "94%", "ShieldCheck", "green", "2 pp vs last week"),
      kpi("Unverified Inputs", "16", "TriangleAlert", "orange", "5 open"),
      kpi("RAG Integrity", "91%", "Database", "blue", "Healthy"),
      kpi("Tool Output Guards", "100%", "LockKeyhole", "purple", "Enforced")
    ],
    tabs: ["Threats", "Prompt Injection", "RAG Context", "Tool Outputs", "Boundaries", "Audit"],
    filters: [
      { label: "Vector", options: ["All Vectors", "Retrieved Document", "User Message", "Attachment Metadata", "Tool Result"] },
      { label: "Risk", options: ["All Risk Levels", "Critical", "High", "Medium", "Low"] },
      { label: "Status", options: ["All Statuses", "Open", "Contained", "Blocked"] }
    ],
    columns: contextThreatColumns,
    rows: makeRows(contextThreatRows, 40),
    charts: [
      { title: "Context Threat Trend", type: "line", data: securityTrend, series: [{ key: "incidents", label: "Threats", color: "#F59E0B" }, { key: "contained", label: "Contained", color: "#10B981" }] },
      { title: "Context Vector Mix", type: "donut", data: [{ name: "RAG", value: 39, color: "#6D4AFF" }, { name: "User Message", value: 26, color: "#F59E0B" }, { name: "Tool Output", value: 21, color: "#EF4444" }, { name: "Attachment", value: 14, color: "#3B82F6" }] }
    ],
    sideCards: [
      { title: "Instruction Boundary", text: "Mock review of system, developer, retrieved, user, and tool-output context layers.", rows: [{ label: "Boundary Escapes", value: "0", tone: "green" }, { label: "Untrusted Segments", value: "16", tone: "orange" }] },
      { title: "Context Provenance", rows: [{ label: "Verified Sources", value: "94%", tone: "green" }, { label: "Signed Corpora", value: "18 / 20", tone: "green" }, { label: "Quarantined Docs", value: "3", tone: "orange" }] },
      { title: "Mock Controls", actions: ["Quarantine Context", "Review Source", "Export Evidence"] }
    ],
    details: {
      title: "Context Threat",
      eyebrow: "Context Security",
      status: "Contained",
      tabs: ["Threat", "Source", "Boundary", "Response"],
      sections: [
        { title: "Threat Summary", text: "Detected suspicious context content in a mock retrieved source and preserved a safe evidence trail.", rows: [{ label: "Vector", value: "Retrieved Document" }, { label: "Risk", value: "High", tone: "red" }, { label: "Confidence", value: "97%" }] },
        { title: "Boundary Signals", chart: "line" },
        { title: "Mock Controls", actions: ["Quarantine Source", "Mark Trusted", "Create Incident"] }
      ]
    }
  },
  memory: {
    title: "Memory Security",
    subtitle: "Govern memory provenance, persistence, quarantine, retention, and cross-agent shared memory safety.",
    actionLabel: "Review Memory",
    searchPlaceholder: "Search memory threats, stores, provenance...",
    kpis: [
      kpi("Memory Score", "86%", "DatabaseZap", "green", "3 pp vs last week"),
      kpi("Quarantined Writes", "4", "ShieldAlert", "orange", "2 resolving"),
      kpi("Verified Provenance", "93%", "ShieldCheck", "green", "Healthy"),
      kpi("Expired Recall Blocks", "11", "Clock", "blue", "All redacted"),
      kpi("Shared Memory Risk", "2", "TriangleAlert", "red", "Needs review"),
      kpi("Retention Coverage", "98%", "Archive", "green", "Policy aligned")
    ],
    tabs: ["Signals", "Provenance", "Quarantine", "Retention", "Shared Memory", "Audit"],
    filters: [
      { label: "Store", options: ["All Stores", "User Profile Memory", "Shared Planning Memory", "Conversation Memory"] },
      { label: "Risk", options: ["All Risk Levels", "Critical", "High", "Medium", "Low"] },
      { label: "Status", options: ["All Statuses", "Trusted", "Contained", "Quarantined", "Open"] }
    ],
    columns: memoryThreatColumns,
    rows: makeRows(memoryThreatRows, 34),
    charts: [
      { title: "Memory Quarantine Trend", type: "line", data: securityTrend, series: [{ key: "incidents", label: "Signals", color: "#F59E0B" }, { key: "contained", label: "Contained", color: "#10B981" }] },
      { title: "Memory Control Coverage", type: "bars", data: [{ name: "Provenance", value: 93 }, { name: "Retention", value: 98 }, { name: "Quarantine", value: 91 }, { name: "Redaction", value: 96 }] }
    ],
    sideCards: [
      { title: "Provenance Chain", rows: [{ label: "Verified Writes", value: "93%", tone: "green" }, { label: "Untrusted Writes", value: "4", tone: "orange" }, { label: "Cross-Agent Writes", value: "2", tone: "red" }] },
      { title: "Quarantine Queue", text: "Mock queue for memory writes that require owner review before becoming persistent context.", actions: ["Review Queue", "Release Trusted", "Purge Quarantined"] },
      { title: "Retention Guardrails", rows: [{ label: "Expired Recall Blocks", value: "11", tone: "green" }, { label: "Policy Coverage", value: "98%", tone: "green" }, { label: "Open Exceptions", value: "1", tone: "orange" }] }
    ],
    details: {
      title: "Memory Signal",
      eyebrow: "Memory Security",
      status: "Quarantined",
      tabs: ["Signal", "Provenance", "Retention", "Response"],
      sections: [
        { title: "Signal Summary", rows: [{ label: "Store", value: "Shared Planning Memory" }, { label: "Risk", value: "High", tone: "red" }, { label: "Containment", value: "Quarantined", tone: "orange" }] },
        { title: "Provenance Trend", chart: "line" },
        { title: "Mock Controls", actions: ["Approve Memory", "Purge Memory", "Create Incident"] }
      ]
    }
  },
  incidents: {
    title: "Threats & Incidents",
    subtitle: "Track AI security incidents, response playbooks, blast radius, ownership, and evidence timelines.",
    actionLabel: "Create Incident",
    searchPlaceholder: "Search incidents, agents, owners...",
    kpis: [
      kpi("Open Incidents", "4", "TriangleAlert", "orange", "2 contained"),
      kpi("Critical Incidents", "1", "ShieldAlert", "red", "Contained", "down"),
      kpi("Mean Time To Contain", "11m", "Clock", "green", "3m faster"),
      kpi("Response SLA", "98%", "Gauge", "green", "No breaches"),
      kpi("Evidence Bundles", "37", "Archive", "blue", "12 new"),
      kpi("Playbooks", "9", "ClipboardCheck", "purple", "8 ready")
    ],
    tabs: ["Incidents", "Timeline", "Playbooks", "Evidence", "Owners", "Reports"],
    filters: [
      { label: "Severity", options: ["All Severities", "Critical", "High", "Medium"] },
      { label: "Area", options: ["All Areas", "MCP Tooling", "Memory", "Context", "Identity"] },
      { label: "Status", options: ["All Statuses", "Open", "Contained"] }
    ],
    columns: securityIncidentColumns,
    rows: makeRows(securityIncidentRows, 24),
    charts: [
      { title: "Incident Trend", type: "line", data: securityTrend, series: [{ key: "incidents", label: "Opened", color: "#F59E0B" }, { key: "contained", label: "Contained", color: "#10B981" }] },
      { title: "Incident Areas", type: "donut", data: [{ name: "MCP", value: 34, color: "#EF4444" }, { name: "Context", value: 27, color: "#F59E0B" }, { name: "Memory", value: 22, color: "#3B82F6" }, { name: "Identity", value: 17, color: "#6D4AFF" }] }
    ],
    sideCards: [
      { title: "Active Response Timeline", text: incidentTimeline.join("\n") },
      { title: "Response Playbook", rows: [{ label: "Containment", value: "Complete", tone: "green" }, { label: "Eradication", value: "In Review", tone: "orange" }, { label: "Recovery", value: "Pending", tone: "orange" }], actions: ["Open Playbook", "Export Evidence"] },
      { title: "Blast Radius", rows: [{ label: "Agents", value: "2" }, { label: "Tools", value: "1", tone: "orange" }, { label: "Data Stores", value: "0", tone: "green" }] }
    ],
    details: {
      title: "Security Incident",
      eyebrow: "Incident Response",
      status: "Contained",
      tabs: ["Summary", "Timeline", "Evidence", "Remediation"],
      sections: [
        { title: "Incident Summary", text: "Mock incident view with owner, stage, affected control plane, and response status.", rows: [{ label: "Severity", value: "Critical", tone: "red" }, { label: "Stage", value: "Containment", tone: "orange" }, { label: "SLA", value: "14m left" }] },
        { title: "Timeline", text: incidentTimeline.join("\n") },
        { title: "Response Actions", actions: ["Assign Owner", "Mark Contained", "Create Remediation", "Export Evidence"] }
      ]
    }
  },
  permissions: {
    title: "Permission Review",
    subtitle: "Detailed least-privilege permission review dataset used by the Agent Identity & Access workspace.",
    actionLabel: "Create Review",
    searchPlaceholder: "Search permission reviews...",
    kpis: [kpi("Reviews", "11", "KeyRound", "orange"), kpi("Compliant", "91%", "ShieldCheck", "green"), kpi("High Risk", "3", "TriangleAlert", "red"), kpi("Removable Scopes", "11", "Scissors", "orange")],
    tabs: ["Permissions"],
    filters: [{ label: "Risk", options: ["All Risk Levels", "High", "Medium", "Low"] }],
    columns: permissionColumns,
    rows: makeRows(permissionRows, 18),
    details: { title: "Permission", sections: [{ title: "Scope Review", text: permissionRecommendations.join("\n") }] }
  },
  tokens: {
    title: "Token Lease Review",
    subtitle: "Detailed token and session lease dataset used by the Agent Identity & Access workspace.",
    actionLabel: "Review Tokens",
    searchPlaceholder: "Search token leases...",
    kpis: [kpi("Active Leases", "24", "KeyRound", "green"), kpi("Median TTL", "18m", "Clock", "blue"), kpi("Long TTL", "3", "TriangleAlert", "orange"), kpi("Vault Brokered", "100%", "ShieldCheck", "green")],
    tabs: ["Tokens"],
    filters: [{ label: "Risk", options: ["All Risk Levels", "High", "Medium", "Low"] }],
    columns: tokenColumns,
    rows: makeRows(tokenRows, 18),
    details: { title: "Token Lease", sections: [{ title: "Lease Summary", chart: "score" }] }
  },
  tools: {
    title: "Tool Security Inventory",
    subtitle: "Detailed high-impact tool dataset used by the MCP & Tool Security workspace.",
    actionLabel: "Review Tools",
    searchPlaceholder: "Search tools...",
    kpis: [kpi("Tools", "46", "Wrench", "blue"), kpi("Critical", "2", "ShieldAlert", "red"), kpi("Approval Gated", "9", "LockKeyhole", "green"), kpi("Quarantined", "1", "TriangleAlert", "orange")],
    tabs: ["Tools"],
    filters: [{ label: "Risk", options: ["All Risk Levels", "Critical", "High", "Medium", "Low"] }],
    columns: toolSecurityColumns,
    rows: makeRows(toolSecurityRows, 24),
    details: { title: "Tool", sections: [{ title: "Tool Policy", chart: "bars" }] }
  }
};
