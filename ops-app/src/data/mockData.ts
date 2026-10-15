import type { DashboardConfig, TableColumn, TableRow } from "@/types/dashboard";
import { baseListColumns, barData, defaultSections, donutData, kpi, makeRows, sentimentData } from "./common";

const envs = ["Production", "Staging", "Development", "UAT"];
const statuses = ["Active", "Active", "Active", "Warning", "Inactive"];
const risks = ["Low", "Low", "Medium", "High"];

const agentSeeds: TableRow[] = [
  { id: "agent-invoice", name: "Invoice Validation Agent", description: "Validates invoices and extracts data", type: "Task", capability: "Document Processing", status: "Active", environment: "Production", health: "Healthy", progress: 98, risk: "Medium" },
  { id: "agent-contract", name: "Contract Analysis Agent", description: "Analyzes contracts and extracts clauses", type: "Analysis", capability: "NLP", status: "Active", environment: "Production", health: "Healthy", progress: 96, risk: "Low" },
  { id: "agent-hr", name: "HR Policy Assistant", description: "Answers HR policy related queries", type: "Assistant", capability: "Q&A", status: "Active", environment: "Production", health: "Healthy", progress: 93, risk: "Low" },
  { id: "agent-expense", name: "Expense Report Agent", description: "Processes and categorizes expenses", type: "Task", capability: "Data Extraction", status: "Active", environment: "Staging", health: "Healthy", progress: 91, risk: "Medium" },
  { id: "agent-support", name: "Customer Support Agent", description: "Handles customer queries and tickets", type: "Assistant", capability: "Conversational", status: "Active", environment: "Production", health: "Degraded", progress: 72, risk: "Medium" },
  { id: "agent-sales", name: "Sales Insights Agent", description: "Provides insights on sales data", type: "Analysis", capability: "Analytics", status: "Active", environment: "Production", health: "Healthy", progress: 97, risk: "Low" },
  { id: "agent-helpdesk", name: "IT Helpdesk Agent", description: "Resolves IT related issues", type: "Assistant", capability: "Troubleshooting", status: "Inactive", environment: "Development", health: "Offline", progress: 0, risk: "Low" },
  { id: "agent-compliance", name: "Compliance Checker Agent", description: "Checks compliance of documents", type: "Task", capability: "Compliance", status: "Active", environment: "Staging", health: "Healthy", progress: 89, risk: "High" },
  { id: "agent-marketing", name: "Marketing Content Agent", description: "Generates marketing content", type: "Generator", capability: "Content Gen", status: "Draft", environment: "Development", health: "Unknown", progress: 28, risk: "Medium" },
  { id: "agent-vendor", name: "Vendor Risk Assessment Agent", description: "Assesses vendor risk and score", type: "Analysis", capability: "Risk Assessment", status: "Active", environment: "Production", health: "Healthy", progress: 94, risk: "Low" }
];

const connectorSeeds: TableRow[] = [
  { id: "conn-azure", name: "Azure OpenAI Service", description: "AOAI - East US", type: "AI Service", status: "Active", environment: "Production", progress: 98, risk: "Low", time: "2 mins ago" },
  { id: "conn-snowflake", name: "Snowflake Data Warehouse", description: "Snowflake - Account ACME_PROD", type: "Data Warehouse", status: "Active", environment: "Production", progress: 95, risk: "Medium", time: "5 mins ago" },
  { id: "conn-sharepoint", name: "SharePoint Online", description: "Microsoft 365 - Finance Site", type: "Document Store", status: "Active", environment: "Production", progress: 97, risk: "Low", time: "8 mins ago" },
  { id: "conn-salesforce", name: "Salesforce CRM", description: "Salesforce - Production Org", type: "CRM", status: "Active", environment: "Production", progress: 93, risk: "Medium", time: "10 mins ago" },
  { id: "conn-postgres", name: "PostgreSQL Database", description: "RDS - acme-prod-db", type: "Database", status: "Active", environment: "Production", progress: 96, risk: "Low", time: "12 mins ago" },
  { id: "conn-confluence", name: "Confluence Cloud", description: "Atlassian - acme-space", type: "Knowledge Base", status: "Active", environment: "Staging", progress: 90, risk: "Low", time: "15 mins ago" },
  { id: "conn-slack", name: "Slack Workspace", description: "Slack - acme-workspace", type: "Collaboration", status: "Active", environment: "Production", progress: 94, risk: "Low", time: "18 mins ago" },
  { id: "conn-stripe", name: "Stripe Payments API", description: "Stripe - Live Mode", type: "Payment API", status: "Active", environment: "Production", progress: 91, risk: "High", time: "20 mins ago" },
  { id: "conn-servicenow", name: "ServiceNow ITSM", description: "ServiceNow - acme-instance", type: "ITSM", status: "Inactive", environment: "Development", progress: 0, risk: "Medium", time: "2 hours ago" },
  { id: "conn-gdrive", name: "Google Drive", description: "Google Workspace - Shared Drive", type: "File Storage", status: "Active", environment: "Production", progress: 88, risk: "Medium", time: "2 hours ago" }
];

const policySeeds: TableRow[] = [
  { id: "pol-data", name: "Data Classification Policy", description: "Classifies and handles data based on sensitivity level", type: "Data", framework: "ISO 27001", status: "Active", progress: 96, risk: "Low", time: "May 15, 2024\n10:32 AM" },
  { id: "pol-use", name: "AI Usage Acceptable Use Policy", description: "Defines acceptable use of AI tools and services", type: "Usage", framework: "NIST AI RMF", status: "Active", progress: 93, risk: "Low" },
  { id: "pol-pii", name: "PII Protection Policy", description: "Protects personally identifiable information", type: "Security", framework: "GDPR", status: "Active", progress: 98, risk: "Low" },
  { id: "pol-model", name: "Model Governance Policy", description: "Governance for AI/ML model lifecycle", type: "AI Governance", framework: "NIST AI RMF", status: "In Review", progress: 87, risk: "Medium" },
  { id: "pol-access", name: "Access Control Policy", description: "Controls access to AI systems and data", type: "Security", framework: "ISO 27001", status: "Active", progress: 94, risk: "Low" },
  { id: "pol-content", name: "Content Generation Policy", description: "Guidelines for AI-generated content usage", type: "Usage", framework: "EU AI Act", status: "Active", progress: 90, risk: "Low" },
  { id: "pol-vendor", name: "Vendor Risk Policy", description: "Manages third-party AI vendor risks", type: "Compliance", framework: "SOC 2", status: "Active", progress: 92, risk: "Medium" },
  { id: "pol-retention", name: "Data Retention Policy", description: "Defines retention periods for AI data", type: "Data", framework: "GDPR", status: "Active", progress: 89, risk: "Low" },
  { id: "pol-bias", name: "AI Bias Mitigation Policy", description: "Ensures fairness and bias mitigation in AI", type: "AI Governance", framework: "NIST AI RMF", status: "Deprecated", progress: 65, risk: "High" },
  { id: "pol-incident", name: "Incident Response Policy", description: "Response procedures for AI incidents", type: "Security", framework: "ISO 27001", status: "In Review", progress: 86, risk: "Medium" }
];

const approvalSeeds: TableRow[] = [
  { id: "APR-2024-00189", name: "High Risk Action Approval", agent: "Invoice Validation Agent", action: "Refund Initiate", resource: "Order #ORD-98213", risk: "High", policy: "High Risk Action Approval", status: "Pending", sla: "15m", time: "2 mins ago" },
  { id: "APR-2024-00188", name: "Database Update", agent: "Financial Analyzer", action: "Database Update", resource: "SQL Database finance-prod", risk: "High", policy: "DB Write Protection", status: "Pending", sla: "30m", time: "4 mins ago" },
  { id: "APR-2024-00187", name: "External Email Send", agent: "Contract Analysis Agent", action: "External Email Send", resource: "Vendor LegalEdge Inc.", risk: "Medium", policy: "External Communication Approval", status: "Pending", sla: "45m", time: "9 mins ago" },
  { id: "APR-2024-00186", name: "Bulk Data Export", agent: "HR Policy Assistant", action: "Bulk Data Export", resource: "HR Data Export employees.csv", risk: "High", policy: "Data Export Approval", status: "Pending", sla: "1h", time: "12 mins ago" }
];

const configurationSeeds: TableRow[] = [
  { id: "cfg-prompt", name: "Invoice Validation Prompt v2.1", description: "Extracts and validates invoice data", type: "Prompt", environment: "Production", status: "Active", version: "v2.1.0", impact: "High" },
  { id: "cfg-model", name: "gpt-4o-prod Deployment", description: "Primary model for enterprise agents", type: "Model", environment: "Production", status: "Active", version: "v1.3.4", impact: "High" },
  { id: "cfg-pii", name: "PII Detection Guardrail v1.0", description: "Detects and masks PII in responses", type: "Guardrail", environment: "Production", status: "Active", version: "v1.0.2", impact: "Medium" },
  { id: "cfg-refund", name: "Refund Approval Tool", description: "Process customer refunds", type: "Tool", environment: "Production", status: "Active", version: "v1.2.0", impact: "High" },
  { id: "cfg-finance", name: "Finance Data Connector", description: "Connects to Finance SQL Database", type: "Connector", environment: "Production", status: "Active", version: "v2.0.1", impact: "Medium" },
  { id: "cfg-routing", name: "High Risk Routing Policy", description: "Routes high risk requests for approval", type: "Routing", environment: "Production", status: "Active", version: "v1.1.0", impact: "High" },
  { id: "cfg-quota", name: "Token Limit - Finance Agents", description: "Monthly token limit for finance agents", type: "Quota", environment: "Production", status: "Active", version: "v1.0.3", impact: "Medium" },
  { id: "cfg-dev", name: "Dev Environment Settings", description: "Default settings for development", type: "Environment", environment: "Development", status: "Active", version: "v3.2.0", impact: "Low" },
  { id: "cfg-email", name: "Email MCP Server", description: "MCP server for sending emails", type: "MCP Server", environment: "Production", status: "Draft", version: "v0.9.0", impact: "Medium" },
  { id: "cfg-fallback", name: "Fallback Model - gpt-4o-mini", description: "Fallback model for failures", type: "Model", environment: "Production", status: "Active", version: "v1.0.5", impact: "Low" }
];

const knowledgeSeeds: TableRow[] = [
  { id: "know-finance", name: "Finance Policies SharePoint", description: "Company finance policies and procedures", type: "SharePoint", environment: "Production", status: "Active", documents: "12,843", chunks: "256,721", progress: 91, sensitivity: "Confidential", time: "2 mins ago" },
  { id: "know-hr", name: "HR Employee Handbook", description: "Employee handbook and HR policies", type: "SharePoint", environment: "Production", status: "Active", documents: "8,231", chunks: "182,243", progress: 88, sensitivity: "Internal", time: "15 mins ago" },
  { id: "know-product", name: "Product Docs Confluence", description: "Product documentation and guides", type: "Confluence", environment: "Production", status: "Active", documents: "15,432", chunks: "312,654", progress: 89, sensitivity: "Internal", time: "18 mins ago" },
  { id: "know-support", name: "Customer Support KB", description: "Support articles and troubleshooting", type: "Zendesk", environment: "Production", status: "Active", documents: "24,156", chunks: "521,894", progress: 84, sensitivity: "Internal", time: "25 mins ago" },
  { id: "know-legal", name: "Legal Contracts Repository", description: "Contracts, NDAs and legal documents", type: "SharePoint", environment: "Production", status: "Active", documents: "6,721", chunks: "145,672", progress: 93, sensitivity: "Highly Confidential", time: "32 mins ago" },
  { id: "know-eng", name: "Engineering Runbooks", description: "SRE runbooks and operations", type: "GitHub", environment: "Production", status: "Active", documents: "3,876", chunks: "98,432", progress: 81, sensitivity: "Internal", time: "45 mins ago" },
  { id: "know-sales", name: "Sales Playbooks", description: "Sales playbooks and enablement", type: "SharePoint", environment: "UAT", status: "Active", documents: "5,342", chunks: "112,987", progress: 79, sensitivity: "Internal", time: "1 hour ago" },
  { id: "know-research", name: "Research Papers", description: "Industry research and whitepapers", type: "Web Crawler", environment: "Production", status: "Active", documents: "18,763", chunks: "642,118", progress: 77, sensitivity: "Public", time: "2 hours ago" },
  { id: "know-assets", name: "Marketing Assets", description: "Marketing collateral and assets", type: "Azure Blob", environment: "Production", status: "Syncing", documents: "2,987", chunks: "74,221", progress: 72, sensitivity: "Internal", time: "Syncing" },
  { id: "know-legacy", name: "Legacy Docs Archive", description: "Legacy documents and archives", type: "File Share", environment: "Development", status: "Failed", documents: "1,234", chunks: "28,743", progress: 0, sensitivity: "Internal", time: "Failed" }
];

const secretSeeds: TableRow[] = [
  { id: "sec-aoai", name: "Azure OpenAI Production Key", type: "API Key", vault: "Azure Key Vault", environment: "Production", status: "Active", rotation: "Due in 5d", risk: "High", time: "2 mins ago" },
  { id: "sec-sql", name: "Finance SQL Service Principal", type: "Service Principal", vault: "Azure Key Vault", environment: "Production", status: "Active", rotation: "30d", risk: "High", time: "18 mins ago" },
  { id: "sec-copilot", name: "Copilot Studio OAuth Client", type: "OAuth Client", vault: "Azure Key Vault", environment: "UAT", status: "Active", rotation: "60d", risk: "Medium", time: "1 hour ago" },
  { id: "sec-pinecone", name: "Pinecone Vector DB API Key", type: "API Key", vault: "HashiCorp Vault", environment: "Production", status: "Warning", rotation: "Due in 2d", risk: "Medium", time: "2 hours ago" },
  { id: "sec-mcp", name: "MCP Server Certificate", type: "Certificate", vault: "Azure Key Vault", environment: "Production", status: "Active", rotation: "60d", risk: "Medium", time: "3 hours ago" },
  { id: "sec-graph", name: "Microsoft Graph App Secret", type: "Service Principal", vault: "Azure Vault", environment: "Production", status: "Expired", rotation: "Overdue", risk: "High", time: "1 day ago" },
  { id: "sec-sendgrid", name: "SendGrid API Key", type: "API Key", vault: "AWS Secrets Manager", environment: "Development", status: "Active", rotation: "30d", risk: "Low", time: "2 hours ago" },
  { id: "sec-sharepoint", name: "SharePoint Connector Credential", type: "Connector Credential", vault: "Azure Key Vault", environment: "UAT", status: "Warning", rotation: "Due in 10d", risk: "Medium", time: "5 hours ago" },
  { id: "sec-appinsights", name: "App Insights Ingestion Key", type: "API Key", vault: "Azure Key Vault", environment: "Production", status: "Active", rotation: "60d", risk: "Low", time: "30 mins ago" },
  { id: "sec-stripe", name: "Stripe Webhook Secret", type: "API Key", vault: "AWS Secrets Manager", environment: "Production", status: "Disabled", rotation: "N/A", risk: "Low", time: "7 days ago" }
];

const memorySeeds: TableRow[] = [
  { id: "mem-conversation", name: "Agent Conversation Memory", description: "Stores conversation history and context", type: "Vector DB", environment: "Production", status: "Active", progress: 72, records: "3.2M", retention: "90 days" },
  { id: "mem-profile", name: "User Profile Memory", description: "User preferences and behavioral memory", type: "Document Store", environment: "Production", status: "Active", progress: 48, records: "1.7M", retention: "180 days" },
  { id: "mem-workflow", name: "Workflow State Store", description: "Tracks workflow execution state", type: "Key-Value Store", environment: "Staging", status: "Active", progress: 35, records: "812K", retention: "30 days" },
  { id: "mem-longterm", name: "Long Term Knowledge Memory", description: "Long term knowledge recall", type: "Vector DB", environment: "Production", status: "Active", progress: 81, records: "4.6M", retention: "365 days" },
  { id: "mem-session", name: "Session State Cache", description: "Short term session state cache", type: "In-Memory", environment: "Production", status: "Active", progress: 62, records: "2.1M", retention: "7 days" },
  { id: "mem-tool", name: "Tool Execution State", description: "Tool call state and outputs", type: "Key-Value Store", environment: "Development", status: "Active", progress: 28, records: "530K", retention: "15 days" },
  { id: "mem-shared", name: "Multi-Agent Shared Memory", description: "Shared memory across agents", type: "Vector DB", environment: "Production", status: "Active", progress: 66, records: "2.9M", retention: "120 days" },
  { id: "mem-scratch", name: "Ephemeral Scratchpad", description: "Temporary scratchpad for reasoning", type: "In-Memory", environment: "Staging", status: "Active", progress: 14, records: "210K", retention: "1 day" }
];

const testSeeds: TableRow[] = [
  { id: "test-invoice", name: "Invoice Processing Regression", description: "Validates invoice extraction accuracy", type: "Regression", environment: "Production", status: "Passed", progress: 96.8, baseline: "v2.4.1", time: "May 25, 2025\n10:32 AM" },
  { id: "test-support", name: "Customer Support Evaluation", description: "Evaluates response quality and safety", type: "Evaluation", environment: "Staging", status: "Passed", progress: 92.3, baseline: "v1.8.3" },
  { id: "test-policy", name: "Policy Compliance Test", description: "Checks policy adherence and guardrails", type: "Compliance", environment: "Production", status: "Failed", progress: 78.6, baseline: "v3.0.0" },
  { id: "test-rag", name: "RAG Retriever Quality", description: "Retrieval relevance and grounding", type: "Evaluation", environment: "Production", status: "Passed", progress: 94.1, baseline: "v2.2.0" },
  { id: "test-tools", name: "Agent Tool Calling Suite", description: "Tool selection and execution accuracy", type: "Regression", environment: "Staging", status: "Passed", progress: 93.7, baseline: "v1.6.2" },
  { id: "test-orchestration", name: "Multi-Agent Orchestration", description: "End-to-end multi-agent workflows", type: "Load", environment: "Staging", status: "Passed", progress: 91.5, baseline: "v2.1.0" },
  { id: "test-safety", name: "Safety & Hallucination Check", description: "Detects unsafe and hallucinated outputs", type: "Evaluation", environment: "Production", status: "Warning", progress: 85.2, baseline: "v2.4.1" },
  { id: "test-load", name: "Performance Load Test", description: "System reliability under load", type: "Load", environment: "Production", status: "Failed", progress: 68.3, baseline: "v1.9.7" }
];

const feedbackSeeds: TableRow[] = [
  { id: "fb_8f21a6fe", agent: "Invoice Processing Agent", runId: "run_a73b9d2", rating: "4", sentiment: "Positive", feedback: "Extracted all invoice fields correctly and matched PO.", source: "End User (In-App)", time: "May 25, 10:24 AM", status: "Positive" },
  { id: "fb_3cfd14b9", agent: "HR Policy Assistant", runId: "run_bc12e34f", rating: "2", sentiment: "Negative", feedback: "Response was inaccurate about parental leave policy.", source: "End User (In-App)", time: "May 25, 09:18 AM", status: "Negative" },
  { id: "fb_7e9aef21", agent: "Claims Processing Agent", runId: "run_cd45167a", rating: "5", sentiment: "Positive", feedback: "Quick response and correct claim status update.", source: "Agent Rating", time: "May 25, 08:55 AM", status: "Positive" },
  { id: "fb_1d9e2b77", agent: "Invoice Processing Agent", runId: "run_de56f78b", rating: "3", sentiment: "Neutral", feedback: "Missing discount value in the extracted output.", source: "Support Ticket", time: "May 24, 06:41 PM", status: "Neutral" }
];

const runColumns: TableColumn[] = [
  { key: "id", label: "Run ID", type: "text", sortable: true },
  { key: "source", label: "Source", type: "badge", sortable: true },
  { key: "agent", label: "Agent", type: "text", sortable: true },
  { key: "status", label: "Status", type: "status", sortable: true },
  { key: "model", label: "Model", type: "text", sortable: true },
  { key: "input", label: "Input Preview", type: "text", width: "240px" },
  { key: "tools", label: "Tools", type: "tools" },
  { key: "tokens", label: "Tokens", type: "text", sortable: true },
  { key: "cost", label: "Cost", type: "text", sortable: true },
  { key: "duration", label: "Duration", type: "text", sortable: true },
  { key: "confidence", label: "Confidence", type: "text", sortable: true },
  { key: "risk", label: "Risk", type: "risk", sortable: true },
  { key: "policy", label: "Policy", type: "status" },
  { key: "time", label: "Time", type: "text", sortable: true }
];

const runRows = makeRows(
  [
    { id: "a759c942", source: "Azure AI Foundry", agent: "Invoice Validation Agent", status: "Completed", model: "gpt-4o", input: "Validate invoice INV-2024-1587 for vendor Acme Corp", tools: ["InvoiceCheck", "TaxCalculator"], tokens: "24,913", cost: "$0.104", duration: "1.64s", confidence: "0.96", risk: "Low", policy: "Allowed", time: "2m ago" },
    { id: "e1e4d5f3", source: "Copilot Studio", agent: "HR Policy Assistant", status: "Completed", model: "gpt-4o-mini", input: "What is our parental leave policy for US employees?", tools: ["HRKB"], tokens: "8,742", cost: "$0.021", duration: "1.21s", confidence: "0.94", risk: "Low", policy: "Allowed", time: "3m ago" },
    { id: "d2b7e1c9", source: "Microsoft 365 Copilot", agent: "Sales Email Assistant", status: "Completed", model: "gpt-4o", input: "Draft a follow-up email to Carrot & Zucchi re proposal", tools: ["Outlook", "CRM"], tokens: "12,185", cost: "$0.046", duration: "1.38s", confidence: "0.92", risk: "Low", policy: "Allowed", time: "5m ago" },
    { id: "f9c2afe6", source: "Azure AI Foundry", agent: "Claims Processing Agent", status: "Completed", model: "gpt-4o", input: "Process claim CLM-649541 for John Doe", tools: ["ClaimsDB", "PolicyCheck"], tokens: "31,442", cost: "$0.118", duration: "2.71s", confidence: "0.93", risk: "Medium", policy: "Allowed", time: "7m ago" },
    { id: "e187f0dd", source: "Azure AI Foundry", agent: "Invoice Validation Agent", status: "Warning", model: "gpt-4o", input: "Validate invoice INV-2024-L15 vendor Global Industries", tools: ["InvoiceCheck"], tokens: "17,604", cost: "$0.073", duration: "1.81s", confidence: "0.88", risk: "Medium", policy: "Warned", time: "14m ago" },
    { id: "5d3e1f0b", source: "Copilot Studio", agent: "Claims Processing Agent", status: "Failed", model: "gpt-4o", input: "Process claim CLM-648944 for Jane Smith", tools: ["ClaimsDB"], tokens: "14,207", cost: "$0.031", duration: "2.24s", confidence: "--", risk: "High", policy: "Blocked", time: "18m ago" }
  ],
  126
);

function variations(total: number) {
  return Array.from({ length: total }, (_, index) => ({
    environment: envs[index % envs.length],
    status: statuses[index % statuses.length],
    risk: risks[index % risks.length],
    progress: Math.max(12, 99 - (index % 37))
  }));
}

export const pages: Record<string, DashboardConfig> = {
  "live-runs": {
    title: "Live Runs",
    subtitle: "Real-time observability of AI agent executions across Azure AI Foundry, Copilot Studio, and enterprise agents.",
    actionLabel: "Run",
    searchPlaceholder: "Search runs...",
    kpis: [
      kpi("Total Runs", "12,486", "Activity", "orange", "18.6% vs last 24h"),
      kpi("Success Rate", "97.4%", "Gauge", "green", "2.1 pp vs last 24h"),
      kpi("Avg Latency", "1.82s", "Clock", "orange", "0.34s vs last 24h", "down"),
      kpi("Policy Violations", "34", "ShieldAlert", "red", "22.7% vs last 24h", "down")
    ],
    tabs: ["All Runs", "Azure AI Foundry", "Copilot Studio", "App Insights", "Power Platform"],
    filters: [
      { label: "Tenant", options: ["All Tenants", "Finance", "Product", "Research"] },
      { label: "Agent", options: ["All Agents", "Invoice Validation Agent", "HR Policy Assistant"] },
      { label: "Source", options: ["All Sources", "Azure AI Foundry", "Copilot Studio"] },
      { label: "Risk", options: ["All Risk Levels", "Low", "Medium", "High"] },
      { label: "Time Range", options: ["Last 24 hours", "Last 7 days", "Last 30 days"] }
    ],
    columns: runColumns,
    rows: runRows,
    details: {
      title: "Run Details",
      status: "Completed",
      tabs: ["Overview", "Prompt", "Cost", "Policy"],
      sections: [
        { title: "Execution Summary", rows: [{ label: "Run ID", value: "a759c942-b15e" }, { label: "Agent", value: "Invoice Validation Agent" }, { label: "Environment", value: "Production", tone: "green" }, { label: "Time", value: "May 15, 2025 10:24 AM" }] },
        { title: "Prompt & Response", text: "Validate invoice INV-2024-1587 from Acme Corp for $12,450. Response preview confirms all required fields were extracted and checked against PO records." },
        { title: "Model & Cost", chart: "line", rows: [{ label: "Model", value: "gpt-4o" }, { label: "Total Tokens", value: "24,913" }, { label: "Cost", value: "$0.104" }] },
        { title: "Tools & Connectors", actions: ["InvoiceCheck", "TaxCalculator", "Audit Log"] },
        { title: "Guardrails & Policy", rows: [{ label: "Prompt Injection", value: "Passed", tone: "green" }, { label: "DLP Detection", value: "None Detected", tone: "green" }, { label: "Final Policy", value: "Allowed", tone: "green" }] }
      ]
    },
    heroCards: [
      { title: "Azure AI Foundry", rows: [{ label: "Status", value: "Not Connected", tone: "red" }] },
      { title: "Copilot Studio", rows: [{ label: "Status", value: "Not Connected", tone: "red" }] },
      { title: "App Insights", rows: [{ label: "Status", value: "Not Connected", tone: "red" }] },
      { title: "Power Platform", rows: [{ label: "Status", value: "Not Connected", tone: "red" }] }
    ]
  },
  agents: {
    title: "Agent Registry",
    subtitle: "Discover, register, and manage all AI agents across your organization.",
    actionLabel: "Register New Agent",
    searchPlaceholder: "Search agents by name, type, capability...",
    kpis: [kpi("Total Agents", "128", "Bot", "purple", "16 vs last 30 days"), kpi("Active Agents", "102", "CheckCircle2", "green", "80% of total"), kpi("Deployed Agents", "76", "Rocket", "blue", "59% of total"), kpi("Inactive Agents", "18", "PauseCircle", "orange", "14% of total"), kpi("Draft Agents", "28", "Pencil", "purple", "22% of total", "neutral"), kpi("Critical Alerts", "3", "ShieldAlert", "red", "Needs attention", "down")],
    tabs: ["All Agents", "Task Agents", "Assistants", "Analysis", "Generators", "Drafts"],
    filters: [{ label: "Type", options: ["All Types", "Task", "Analysis", "Assistant", "Generator"] }, { label: "Status", options: ["All Statuses", "Active", "Inactive", "Draft"] }, { label: "Environment", options: ["All Environments", ...envs] }, { label: "Owner", options: ["All Owners", "Amit Kapoor", "Priya Nair"] }, { label: "Capability", options: ["All Capabilities", "Document Processing", "NLP", "Analytics"] }],
    columns: [
      { key: "name", label: "Agent Name", type: "entity", sortable: true, width: "280px" },
      { key: "type", label: "Type", type: "badge", sortable: true },
      { key: "capability", label: "Capability", type: "badge", sortable: true },
      { key: "status", label: "Status", type: "status", sortable: true },
      { key: "environment", label: "Environment", type: "environment", sortable: true },
      { key: "version", label: "Version", type: "text" },
      { key: "lastUpdated", label: "Last Updated", type: "text", sortable: true },
      { key: "owner", label: "Owner", type: "avatar", sortable: true },
      { key: "health", label: "Health", type: "status", sortable: true },
      { key: "actions", label: "Actions", type: "actions" }
    ],
    rows: makeRows(agentSeeds, 128),
    details: {
      title: "Invoice Validation Agent",
      status: "Active",
      tabs: ["Overview", "Capabilities", "Versions", "Activity", "Alerts"],
      sections: [
        { title: "Agent Summary", text: "Validates invoices, extracts key fields and verifies against business rules.", rows: [{ label: "Agent ID", value: "AGT-INV-001" }, { label: "Type", value: "Task" }, { label: "Environment", value: "Production", tone: "green" }, { label: "Version", value: "v2.1.0" }] },
        { title: "Capabilities", actions: ["Document Processing", "Data Extraction", "Validation", "OCR"] },
        { title: "Health & Usage", chart: "line", rows: [{ label: "Success Rate", value: "98.6%", tone: "green" }, { label: "Avg Latency", value: "1.2s" }, { label: "Runs (30d)", value: "12,842" }] },
        { title: "Quick Actions", actions: ["Edit Agent", "View Versions", "View Activity Logs", "Deactivate Agent"] }
      ]
    }
  },
  connectors: {
    title: "Connector & MCP Governance",
    subtitle: "Discover, monitor, and govern all connectors and MCP servers across your AI ecosystem.",
    actionLabel: "Add Connector / MCP",
    searchPlaceholder: "Search connectors, MCP servers...",
    kpis: [kpi("Total Connectors", "56", "Network", "purple", "7 vs last 30 days"), kpi("Active Connectors", "42", "CheckCircle2", "green", "75% of total"), kpi("MCP Servers", "14", "Box", "blue", "3 vs last 30 days"), kpi("Health Score (Avg)", "92%", "HeartPulse", "green", "6% vs last 30 days"), kpi("Policy Violations", "3", "TriangleAlert", "orange", "2 vs last 30 days", "down")],
    tabs: ["All Connectors", "MCP Servers", "Datastores", "APIs", "Services", "Custom"],
    filters: [{ label: "Type", options: ["All Types", "AI Service", "Data Warehouse", "CRM", "API"] }, { label: "Status", options: ["All Statuses", "Active", "Inactive"] }, { label: "Environment", options: ["All Environments", ...envs] }, { label: "Risk Level", options: ["All Risk Levels", "Low", "Medium", "High"] }],
    columns: baseListColumns,
    rows: makeRows(connectorSeeds, 56),
    details: { title: "Azure OpenAI Service", status: "Active", tabs: ["Overview", "Configuration", "Policies", "Activity", "Logs"], sections: [{ title: "Connector Summary", text: "Azure OpenAI resource for LLM completions, embeddings, and chat.", rows: [{ label: "Environment", value: "Production", tone: "green" }, { label: "Health Score", value: "98%", tone: "green" }, { label: "Risk Level", value: "Low", tone: "green" }] }, { title: "Capabilities", actions: ["Chat Completions", "Embeddings", "Function Calling", "Vision", "Moderation"] }, { title: "Policy Compliance", chart: "donut", rows: [{ label: "Compliant", value: "9", tone: "green" }, { label: "Warning", value: "2", tone: "orange" }, { label: "Violation", value: "1", tone: "red" }] }, { title: "Quick Actions", actions: ["Edit Connector", "Test Connection", "Deactivate Connector"] }] }
  },
  policies: {
    title: "Policy Center",
    subtitle: "Create, manage, and enforce AI usage policies and compliance rules across your organization.",
    actionLabel: "Create New Policy",
    searchPlaceholder: "Search policies, rules, frameworks...",
    kpis: [kpi("Total Policies", "24", "ScrollText", "purple", "4 vs last 30 days"), kpi("Active Policies", "19", "ShieldCheck", "green", "79% of total"), kpi("Policies in Review", "3", "Clock", "orange", "13% of total"), kpi("Deprecated Policies", "2", "Archive", "red", "8% of total", "neutral"), kpi("Compliance Score (Avg)", "91%", "ShieldCheck", "green", "5% vs last 30 days"), kpi("Violations (30d)", "7", "TriangleAlert", "red", "3 vs last 30 days", "down")],
    tabs: ["All Policies", "Data Policies", "Security Policies", "Usage Policies", "Access Policies", "Compliance Policies", "Custom Policies"],
    filters: [{ label: "Type", options: ["All Types", "Data", "Usage", "Security", "AI Governance"] }, { label: "Status", options: ["All Statuses", "Active", "In Review", "Deprecated"] }, { label: "Framework", options: ["All Frameworks", "ISO 27001", "NIST AI RMF", "GDPR"] }, { label: "Owner", options: ["All Owners", "Neha Sharma", "Rahul Verma"] }],
    columns: [{ key: "name", label: "Policy Name", type: "entity", sortable: true, width: "300px" }, { key: "type", label: "Type", type: "badge" }, { key: "framework", label: "Framework", type: "badge" }, { key: "status", label: "Status", type: "status" }, { key: "progress", label: "Compliance Score", type: "progress" }, { key: "time", label: "Last Updated", type: "text" }, { key: "owner", label: "Owner", type: "avatar" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(policySeeds, 24),
    details: { title: "Data Classification Policy", status: "Active", tabs: ["Overview", "Rules", "Violations", "Versions", "Audit Trail"], sections: [{ title: "Policy Summary", text: "Classifies and handles data based on sensitivity level and usage requirements.", rows: [{ label: "Framework", value: "ISO 27001" }, { label: "Version", value: "v2.1.0" }] }, { title: "Compliance Score", chart: "donut", rows: [{ label: "Compliant", value: "18", tone: "green" }, { label: "Partial", value: "4", tone: "orange" }, { label: "Non-Compliant", value: "2", tone: "red" }] }, { title: "Related Framework Controls", actions: ["ISO 27001: A.5", "ISO 27001: A.8", "ISO 27001: A.18"] }, { title: "Quick Actions", actions: ["Edit Policy", "Clone Policy", "View Rules", "View Violations", "Deactivate Policy"] }] }
  },
  approvals: {
    title: "Approvals & Audit",
    subtitle: "Manage approval requests, review high-risk actions, and audit all agent activities.",
    actionLabel: "New Approval Rule",
    searchPlaceholder: "Search requests, agents, users, actions...",
    kpis: [kpi("Pending Approvals", "18", "Clock", "purple", "5 vs last 30 days"), kpi("Approved (30d)", "432", "CheckCircle2", "green", "12% vs last 30 days"), kpi("Rejected (30d)", "54", "XCircle", "red", "8% vs last 30 days", "down"), kpi("Escalated (30d)", "23", "Users", "orange", "3 vs last 30 days"), kpi("Avg Time to Approve", "2h 34m", "Timer", "blue", "18m vs last 30 days", "down"), kpi("Approval SLA Met", "92%", "Shield", "slate", "6% vs last 30 days")],
    tabs: ["Pending", "Approved", "Rejected", "Escalated", "Audit Trail"],
    filters: [{ label: "Tenant", options: ["All Tenants", "Finance", "HR"] }, { label: "Agent", options: ["All Agents", "Invoice Validation Agent"] }, { label: "Policy", options: ["All Policies", "High Risk Action Approval"] }, { label: "Risk", options: ["All Risk Levels", "Low", "Medium", "High"] }, { label: "Reviewer", options: ["All Reviewers", "Amit Kapoor"] }],
    columns: [{ key: "id", label: "Request ID", type: "text" }, { key: "time", label: "Time", type: "text" }, { key: "agent", label: "Agent / Source", type: "text" }, { key: "action", label: "Action", type: "text" }, { key: "resource", label: "Resource", type: "text" }, { key: "risk", label: "Risk", type: "risk" }, { key: "policy", label: "Policy", type: "text" }, { key: "owner", label: "Requested By", type: "avatar" }, { key: "sla", label: "SLA", type: "text" }, { key: "status", label: "Status", type: "status" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(approvalSeeds, 18),
    details: { title: "APR-2024-00189", status: "Pending", tabs: ["Overview", "Request Details", "History", "Audit Trail"], sections: [{ title: "Request Summary", text: "Requires approval for refund actions above $1,000.", rows: [{ label: "Action", value: "Refund Initiate" }, { label: "Resource", value: "Order #ORD-98213" }, { label: "Risk Level", value: "High", tone: "red" }, { label: "SLA", value: "15 minutes", tone: "red" }] }, { title: "Impact Analysis", rows: [{ label: "Financial Impact", value: "$2,450" }, { label: "Affected Systems", value: "3" }, { label: "Data Sensitivity", value: "Confidential" }] }, { title: "Approval Workflow", actions: ["Requested", "In Review", "Approved", "Completed"] }, { title: "Review Actions", actions: ["Approve", "Reject", "Escalate", "Add Comment"] }] }
  },
  configurations: {
    title: "Configuration Center",
    subtitle: "Manage and version all configuration assets including models, prompts, tools, guardrails, routing, and quotas.",
    actionLabel: "New Configuration",
    searchPlaceholder: "Search configurations...",
    kpis: [kpi("Total Configurations", "236", "Settings2", "purple", "18 vs last 30 days"), kpi("Active", "192", "CheckCircle2", "green", "81% of total"), kpi("Draft", "21", "FileClock", "blue", "9% of total", "neutral"), kpi("Deprecated", "15", "Archive", "orange", "6% of total"), kpi("Archived", "8", "Archive", "slate", "4% of total"), kpi("Config Changes (30d)", "124", "GitCompare", "purple", "22 vs last 30 days")],
    tabs: ["All Configurations", "Models", "Prompts", "Tools", "Guardrails", "Routing", "Quotas", "Environments", "Connectors"],
    filters: [{ label: "Type", options: ["All Types", "Prompt", "Model", "Tool", "Guardrail"] }, { label: "Status", options: ["All Statuses", "Active", "Draft", "Deprecated"] }, { label: "Environment", options: ["All Environments", ...envs] }, { label: "Owner", options: ["All Owners", "Amit Kapoor"] }, { label: "Impact", options: ["All Impact Levels", "High", "Medium", "Low"] }],
    columns: [{ key: "name", label: "Name", type: "entity", width: "300px" }, { key: "type", label: "Type", type: "badge" }, { key: "environment", label: "Environment", type: "environment" }, { key: "status", label: "Status", type: "status" }, { key: "version", label: "Version", type: "text" }, { key: "lastUpdated", label: "Last Modified", type: "text" }, { key: "owner", label: "Owner", type: "avatar" }, { key: "impact", label: "Impact", type: "risk" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(configurationSeeds, 236),
    details: { title: "Invoice Validation Prompt v2.1", status: "Active", tabs: ["Overview", "Versions", "Usage", "Audit Trail", "History"], sections: [{ title: "Summary", text: "Extracts and validates invoice data from documents and returns structured output.", rows: [{ label: "Type", value: "Prompt" }, { label: "Environment", value: "Production", tone: "green" }, { label: "Version", value: "v2.1.0" }] }, { title: "Impact & Usage", rows: [{ label: "Impact Level", value: "High", tone: "red" }, { label: "Used By Agents", value: "8" }, { label: "Total Runs (30d)", value: "24,532" }] }, { title: "Linked Configurations", actions: ["gpt-4o-prod", "PII Detection Guardrail v1.0", "High Risk Routing Policy"] }, { title: "Quick Actions", actions: ["Edit Configuration", "Clone", "Create New Version", "Deprecate"] }] }
  },
  knowledge: {
    title: "RAG & Knowledge Governance",
    subtitle: "Manage knowledge sources, vector indexes, retrieval policies, citations, and grounding quality.",
    actionLabel: "Add Knowledge Source",
    searchPlaceholder: "Search knowledge sources...",
    kpis: [kpi("Total Sources", "48", "Database", "purple", "6 vs last 30 days"), kpi("Active Sources", "41", "CheckCircle2", "green", "85% of total"), kpi("Total Documents", "1.24M", "FileText", "blue", "12.4% vs last 30 days"), kpi("Total Chunks", "24.7M", "Boxes", "orange", "14.7% vs last 30 days"), kpi("Avg. Grounding Score", "0.86", "TrendingUp", "green", "0.06 vs last 30 days"), kpi("Sources with ACL", "32", "Shield", "slate", "67% of total")],
    tabs: ["Knowledge Sources", "Vector Indexes", "Retrieval Policies", "Citations & Grounding", "Data Access & Lineage"],
    filters: [{ label: "Type", options: ["All Types", "SharePoint", "Confluence", "Zendesk"] }, { label: "Status", options: ["All Status", "Active", "Syncing", "Failed"] }, { label: "Environment", options: ["All Environments", ...envs] }, { label: "Sensitivity", options: ["All Sensitivity", "Confidential", "Internal", "Public"] }],
    columns: [{ key: "name", label: "Source Name", type: "entity", width: "280px" }, { key: "type", label: "Type", type: "badge" }, { key: "environment", label: "Environment", type: "environment" }, { key: "status", label: "Status", type: "status" }, { key: "documents", label: "Documents", type: "text" }, { key: "chunks", label: "Chunks", type: "text" }, { key: "progress", label: "Grounding Score", type: "progress" }, { key: "sensitivity", label: "Sensitivity", type: "risk" }, { key: "time", label: "Last Sync", type: "text" }, { key: "owner", label: "Owner", type: "avatar" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(knowledgeSeeds, 48),
    details: { title: "Finance Policies SharePoint", status: "Active", tabs: ["Overview", "Documents", "Chunks", "Access", "Lineage", "History"], sections: [{ title: "Source Summary", text: "Company finance policies, procedures, and guidelines.", rows: [{ label: "Type", value: "SharePoint Online" }, { label: "Sensitivity", value: "Confidential", tone: "purple" }] }, { title: "Sync & Indexing", rows: [{ label: "Last Sync", value: "2 mins ago" }, { label: "Indexing Status", value: "Up to date", tone: "green" }, { label: "Indexer", value: "Azure AI Search" }] }, { title: "Grounding & Quality", chart: "score", rows: [{ label: "Context Relevance", value: "0.93", tone: "green" }, { label: "Answer Relevance", value: "0.90", tone: "green" }, { label: "Citation Quality", value: "0.88", tone: "green" }] }, { title: "Quick Actions", actions: ["Sync Now", "Edit Source", "View Documents", "Delete Source"] }] }
  },
  secrets: {
    title: "Secrets & Credentials",
    subtitle: "Manage vaults, API keys, certificates, service principals, and credential rotation across your AI ecosystem.",
    actionLabel: "Add Secret",
    searchPlaceholder: "Search secrets...",
    kpis: [kpi("Total Secrets", "184", "KeyRound", "purple", "12 vs last 30d"), kpi("Active Vaults", "7", "LockKeyhole", "blue", "No change vs last 30d", "neutral"), kpi("Expiring Soon", "12", "TriangleAlert", "orange", "3 vs last 30d"), kpi("Rotation Overdue", "5", "ShieldAlert", "red", "1 vs last 30d", "down"), kpi("Compliance Score", "94%", "ShieldCheck", "green", "4% vs last 30d"), kpi("Privileged Access Events (30d)", "27", "Users", "purple", "8 vs last 30d", "down")],
    tabs: ["All Secrets", "Vaults", "API Keys", "OAuth Clients", "Certificates", "Service Principals"],
    filters: [{ label: "Type", options: ["All Types", "API Key", "Service Principal", "OAuth Client"] }, { label: "Environment", options: ["All Environments", ...envs] }, { label: "Status", options: ["All Statuses", "Active", "Warning", "Expired"] }, { label: "Rotation Policy", options: ["All Policies", "30d", "60d", "Overdue"] }],
    columns: [{ key: "name", label: "Secret Name", type: "entity", width: "280px" }, { key: "type", label: "Type", type: "badge" }, { key: "vault", label: "Vault / Store", type: "text" }, { key: "environment", label: "Environment", type: "environment" }, { key: "status", label: "Status", type: "status" }, { key: "rotation", label: "Rotation", type: "risk" }, { key: "time", label: "Last Accessed", type: "text" }, { key: "owner", label: "Owner", type: "avatar" }, { key: "risk", label: "Risk", type: "risk" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(secretSeeds, 184),
    details: { title: "Azure OpenAI Production Key", status: "Active", tabs: ["Overview", "Access", "Rotation", "Audit"], sections: [{ title: "Overview", text: "Secret value: sk-****************A4f", rows: [{ label: "Type", value: "API Key" }, { label: "Vault", value: "Azure Key Vault" }, { label: "Environment", value: "Production", tone: "green" }] }, { title: "Access & Usage", rows: [{ label: "Used By Services", value: "6" }, { label: "Access Scope", value: "Production Only" }] }, { title: "Rotation & Compliance", rows: [{ label: "Rotation Policy", value: "30 days" }, { label: "Next Rotation", value: "In 5 days", tone: "orange" }, { label: "Compliance", value: "Compliant", tone: "green" }] }, { title: "Quick Actions", actions: ["Rotate Secret", "View Audit Log", "Edit Access", "Disable Secret"] }] },
    charts: [{ title: "Vault Health Overview", type: "donut" }, { title: "Compliance by Secret Type", type: "bars" }, { title: "Expiring Secrets", type: "bars" }]
  },
  memory: {
    title: "Memory & State Management",
    subtitle: "Manage, persist, and govern AI agent memory, state, and conversation context across sessions and environments.",
    actionLabel: "Create Memory Store",
    searchPlaceholder: "Search memories, agents, sessions...",
    kpis: [kpi("Total Memory Stores", "18", "Database", "purple", "3 vs last 30 days"), kpi("Active Sessions", "1,246", "Activity", "green", "18.7% vs last 24h"), kpi("Stored Memories", "12.8M", "Brain", "blue", "12.4% vs last 7 days"), kpi("Avg. Retrieval Latency", "98ms", "Clock", "orange", "12ms vs last 24h", "down"), kpi("State Sync Success", "99.2%", "RefreshCw", "purple", "1.8% vs last 7 days"), kpi("Expired / Purged", "245K", "Trash2", "red", "7.6% vs last 7 days")],
    tabs: ["Memory Stores", "Sessions", "Agent State", "Conversation State", "Retention Policies", "Backups"],
    filters: [{ label: "Type", options: ["All Types", "Vector DB", "Document Store", "Key-Value Store", "In-Memory"] }, { label: "Status", options: ["All Status", "Active", "Warning"] }, { label: "Environment", options: ["All Environments", ...envs] }],
    columns: [{ key: "name", label: "Memory Store", type: "entity", width: "300px" }, { key: "type", label: "Type", type: "badge" }, { key: "environment", label: "Environment", type: "environment" }, { key: "status", label: "Status", type: "status" }, { key: "progress", label: "Usage", type: "progress" }, { key: "records", label: "Records", type: "text" }, { key: "retention", label: "Retention Policy", type: "text" }, { key: "lastUpdated", label: "Last Updated", type: "text" }, { key: "owner", label: "Owner", type: "avatar" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(memorySeeds, 18),
    details: { title: "Agent Conversation Memory", status: "Active", tabs: ["Overview", "Usage", "Configuration", "Activity", "Backups"], sections: [{ title: "Summary", text: "Stores conversation history and context for AI agents.", rows: [{ label: "Type", value: "Vector Database" }, { label: "Total Records", value: "3,200,453" }, { label: "Usage", value: "72%", tone: "green" }] }, { title: "Usage Over Time", chart: "line" }, { title: "Health Status", rows: [{ label: "Retrieval Latency", value: "98ms", tone: "green" }, { label: "Write Latency", value: "112ms", tone: "green" }, { label: "Error Rate", value: "0.02%", tone: "green" }] }, { title: "Quick Actions", actions: ["View Records", "Update Policy", "Purge Data", "Create Backup"] }] }
  },
  testing: {
    title: "Testing & Regression Suite",
    subtitle: "Build, run, and manage evaluation, regression, and load tests to ensure AI agent reliability and quality.",
    actionLabel: "Create Test Suite",
    searchPlaceholder: "Search tests, suites, datasets...",
    kpis: [kpi("Total Test Suites", "42", "Box", "purple", "16.7% vs last 30 days"), kpi("Tests Executed (30d)", "1,284", "ClipboardCheck", "blue", "22.4% vs last 30 days"), kpi("Pass Rate (30d)", "94.2%", "ShieldCheck", "green", "3.6 pp vs last 30 days"), kpi("Regressions Detected", "18", "Bug", "orange", "18.2% vs last 30 days", "down"), kpi("Avg. Test Duration", "4m 32s", "Clock", "purple", "8.7% vs last 30 days", "down"), kpi("Flaky Tests", "23", "AlertTriangle", "orange", "11.5% vs last 30 days", "down")],
    tabs: ["Test Suites", "Test Runs", "Datasets", "Evaluations", "Baselines", "Schedules", "Environments"],
    filters: [{ label: "Type", options: ["All Types", "Regression", "Evaluation", "Compliance", "Load"] }, { label: "Status", options: ["All Status", "Passed", "Failed", "Warning"] }, { label: "Environment", options: ["All Environments", ...envs] }],
    columns: [{ key: "name", label: "Suite Name", type: "entity", width: "300px" }, { key: "type", label: "Type", type: "badge" }, { key: "environment", label: "Environment", type: "environment" }, { key: "status", label: "Status", type: "status" }, { key: "progress", label: "Pass Rate", type: "progress" }, { key: "time", label: "Last Run", type: "text" }, { key: "baseline", label: "Baseline", type: "badge" }, { key: "owner", label: "Owner", type: "avatar" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(testSeeds, 42),
    details: { title: "Invoice Processing Regression", status: "Passed", tabs: ["Overview", "Runs", "Datasets", "Baselines"], sections: [{ title: "Suite Summary", text: "Validates invoice extraction accuracy and key field mapping.", rows: [{ label: "Type", value: "Regression" }, { label: "Environment", value: "Production", tone: "green" }, { label: "Baseline", value: "v2.4.1" }] }, { title: "Pass Rate Trend", chart: "line" }, { title: "Test Results", chart: "donut", rows: [{ label: "Passed", value: "1,210", tone: "green" }, { label: "Failed", value: "54", tone: "red" }, { label: "Warning", value: "20", tone: "orange" }] }, { title: "Quick Actions", actions: ["Run All Suites", "View Schedules", "Create Evaluation", "Compare Baselines"] }] }
  },
  feedback: {
    title: "Feedback & Quality Loop",
    subtitle: "Capture feedback, analyze quality signals, prioritize improvements, and drive continuous AI agent excellence.",
    actionLabel: "Submit Feedback",
    searchPlaceholder: "Search feedback, ratings, agents...",
    kpis: [kpi("Total Feedback (30d)", "8,742", "MessageSquare", "purple", "21.4% vs last 30 days"), kpi("Avg. Rating", "4.32 / 5", "Star", "green", "0.18 vs last 30 days"), kpi("Positive Feedback", "78.6%", "ThumbsUp", "green", "6.3 pp vs last 30 days"), kpi("Issues Identified", "342", "TriangleAlert", "orange", "15.7% vs last 30 days"), kpi("Improvements Deployed", "27", "Rocket", "blue", "22.7% vs last 30 days"), kpi("SLA Met", "96.3%", "Shield", "purple", "1.8 pp vs last 30 days", "down")],
    tabs: ["Overview", "Feedback", "Quality Insights", "Issues", "Improvement Backlog", "Actions", "Reports", "Settings"],
    filters: [{ label: "Sentiment", options: ["All Sentiment", "Positive", "Neutral", "Negative"] }, { label: "Agent", options: ["All Agents", "Invoice Processing Agent", "HR Policy Assistant"] }, { label: "Source", options: ["All Sources", "End User (In-App)", "Agent Rating"] }],
    columns: [{ key: "id", label: "Feedback ID", type: "text" }, { key: "agent", label: "Agent", type: "text" }, { key: "runId", label: "Run ID", type: "text" }, { key: "rating", label: "Rating", type: "rating" }, { key: "sentiment", label: "Sentiment", type: "status" }, { key: "feedback", label: "Feedback", type: "text", width: "320px" }, { key: "source", label: "Source", type: "text" }, { key: "time", label: "Time", type: "text" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows(feedbackSeeds, 120),
    details: { title: "Feedback Details", status: "Positive", sections: [{ title: "Feedback", text: "Extracted all invoice fields correctly and matched PO successfully. Great job!", rows: [{ label: "Rating", value: "4.0 / 5", tone: "orange" }, { label: "Agent", value: "Invoice Processing Agent" }, { label: "Environment", value: "Production", tone: "green" }] }, { title: "Top Issues (30 Days)", chart: "bars", rows: [{ label: "Incorrect Data Extraction", value: "124", tone: "red" }, { label: "Missing Field", value: "96", tone: "red" }, { label: "Slow Response", value: "37", tone: "orange" }] }, { title: "Recent Improvements", actions: ["Better PO matching logic", "Improved tax extraction", "Reduced hallucination in totals"] }, { title: "Quick Actions", actions: ["Create Issue", "Add to Backlog", "Assign to Team", "Analyze Feedback"] }] },
    charts: [{ title: "Feedback Trend", type: "line", secondaryKey: "secondary" }, { title: "Feedback by Sentiment", type: "donut" }, { title: "Feedback by Source", type: "bars" }]
  },
  "cost-capacity": {
    title: "Quota, Cost & Capacity",
    subtitle: "Monitor AI usage quotas, costs, and infrastructure capacity across environments and services.",
    actionLabel: "Create Quota",
    searchPlaceholder: "Search by service, environment, or team...",
    kpis: [kpi("Total Spend (MTD)", "$128,450", "DollarSign", "purple", "12.4% vs last month", "down"), kpi("Total Budget (MTD)", "$200,000", "WalletCards", "blue", "64.2% utilized"), kpi("Total Tokens (MTD)", "1.42B", "Cpu", "cyan", "18.7% vs last month"), kpi("API Calls (MTD)", "8.76M", "ChartNoAxesCombined", "purple", "15.3% vs last month"), kpi("Avg. Cost / 1K Tokens", "$0.092", "BadgeDollarSign", "orange", "8.6% vs last month", "down"), kpi("Capacity Health", "92%", "Activity", "orange", "Healthy")],
    tabs: ["Overview", "Quotas", "Costs", "Capacity", "Usage", "Budgets", "Forecasting"],
    filters: [{ label: "Range", options: ["This Month", "Last Month", "Last 90 days"] }],
    columns: [{ key: "name", label: "Team", type: "entity" }, { key: "spend", label: "Total Spend (MTD)", type: "text" }, { key: "share", label: "% of Total", type: "text" }, { key: "tokens", label: "Tokens (MTD)", type: "text" }, { key: "calls", label: "API Calls (MTD)", type: "text" }, { key: "cost", label: "Avg. Cost / 1K Tokens", type: "text" }, { key: "progress", label: "Trend (7D)", type: "progress" }, { key: "actions", label: "Actions", type: "actions" }],
    rows: makeRows([{ id: "team-research", name: "Research Team", description: "Model evaluation and experiments", spend: "$42,150", share: "32.8%", tokens: "512.4M", calls: "2.98M", cost: "$0.082", progress: 82 }, { id: "team-product", name: "Product Team", description: "Customer-facing AI features", spend: "$38,650", share: "30.1%", tokens: "438.7M", calls: "2.45M", cost: "$0.088", progress: 78 }, { id: "team-eng", name: "Engineering Team", description: "Platform automation", spend: "$26,240", share: "20.4%", tokens: "312.3M", calls: "1.87M", cost: "$0.084", progress: 65 }, { id: "team-data", name: "Data Science Team", description: "Analytics and RAG research", spend: "$15,410", share: "12.0%", tokens: "162.5M", calls: "1.01M", cost: "$0.095", progress: 58 }, { id: "team-others", name: "Others", description: "Shared services", spend: "$6,000", share: "4.7%", tokens: "64.1M", calls: "450K", cost: "$0.093", progress: 42 }], 25),
    details: { title: "Budget Status (MTD)", sections: [{ title: "Budget Status", rows: [{ label: "AI Platform Budget", value: "$128,450 / $200,000", tone: "green" }, { label: "Research Team Budget", value: "$42,150", tone: "green" }, { label: "Product Team Budget", value: "$38,600", tone: "green" }] }, { title: "Top Cost Drivers", chart: "bars", rows: [{ label: "gpt-4o", value: "$38,520" }, { label: "text-embedding-3-large", value: "$18,760" }] }, { title: "Cost Optimization Insights", actions: ["Idle environments detected", "Right-size opportunities", "Optimize Model Usage"] }, { title: "Alerts", actions: ["Budget threshold exceeded", "Quota approaching limit"] }] },
    charts: [{ title: "Spend Over Time", type: "area", dataKey: "cost" }, { title: "Cost by Service", type: "donut" }, { title: "Quota Utilization", type: "bars" }, { title: "Capacity Overview", type: "bars" }],
    pageKind: "analytics"
  }
};

const workspaceRoutes = {
  replay: "Replay Studio",
  metrics: "Metrics",
  "connection-center": "Connection Center",
  prompts: "Prompt Manager",
  deployment: "Deployment & Environment",
  evaluations: "Evaluations",
  guardrails: "Guardrails",
  alerts: "Alerts",
  exports: "Exports"
};

for (const [slug, title] of Object.entries(workspaceRoutes)) {
  pages[slug] = {
    title,
    subtitle: `${title} workspace with operational controls, governance signals, and enterprise activity streams.`,
    actionLabel: `New ${title.split(" ")[0]}`,
    searchPlaceholder: `Search ${title.toLowerCase()}...`,
    kpis: [kpi("Total Items", "236", "Layers3", "purple", "18 vs last 30 days"), kpi("Active", "192", "CheckCircle2", "green", "81% of total"), kpi("Warnings", "12", "TriangleAlert", "orange", "3 vs last week"), kpi("Critical", "3", "ShieldAlert", "red", "Needs review", "down")],
    tabs: ["Overview", "Activity", "Policies", "Reports", "Settings"],
    filters: [{ label: "Status", options: ["All Statuses", "Active", "Warning", "Failed"] }, { label: "Environment", options: ["All Environments", ...envs] }],
    columns: baseListColumns,
    rows: makeRows(connectorSeeds.map((row) => ({ ...row, type: title.split(" ")[0] })), 36, variations(36)),
    details: { title: `${title} Details`, status: "Active", sections: defaultSections(title) },
    pageKind: "workspace"
  };
}

export const chartDatasets = {
  donutData,
  sentimentData,
  barData
};

export const agentDetailRows = runRows.slice(0, 5);
